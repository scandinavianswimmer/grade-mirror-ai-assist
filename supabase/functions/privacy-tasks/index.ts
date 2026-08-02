// POST /privacy-tasks   (cron/secret-gated — NOT user-callable)
// Header: x-cron-secret: <CRON_SECRET>
// Runs retention + anonymization across all teachers. Storage deletion is verified before its
// corresponding submission row is removed; any partial/ambiguous deletion aborts the run.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { requireCronSecret } from "../_shared/auth.ts";
import { adminClient } from "../_shared/db.ts";
import { scrubNames as scrub } from "../_shared/deid.ts";
import { eraseOwnedStorageFiles, StorageErasureError } from "../_shared/storage-erasure.ts";

const SUBMISSIONS_BUCKET = "submissions";
const QUERY_BATCH_SIZE = 100;

type AdminClient = ReturnType<typeof adminClient>;
type SubmissionIdentity = { id: string; student_name: string | null };
type ExpiringSubmission = { id: string; file_path: string | null };

function databaseFailure(operation: string, error: { message: string; code?: string } | null): never {
  console.error(`[privacy-tasks] ${operation} failed: ${error?.code ?? "unknown"} ${error?.message ?? "unknown"}`);
  throw new AppError(500, "database", "The privacy task could not be completed safely.");
}

async function getAssignmentIds(admin: AdminClient, userId: string): Promise<string[]> {
  const { data, error } = await admin.from("assignments").select("id").eq("user_id", userId);
  if (error) databaseFailure("list teacher assignments", error);
  return (data ?? []).map((row) => row.id as string);
}

async function getSubmissionsWithNames(
  admin: AdminClient,
  assignmentIds: string[],
): Promise<SubmissionIdentity[]> {
  const rows: SubmissionIdentity[] = [];
  for (let start = 0; start < assignmentIds.length; start += QUERY_BATCH_SIZE) {
    const { data, error } = await admin
      .from("submissions")
      .select("id, student_name")
      .in("assignment_id", assignmentIds.slice(start, start + QUERY_BATCH_SIZE))
      .not("student_name", "is", null);
    if (error) databaseFailure("list submissions for anonymization", error);
    rows.push(...((data ?? []) as SubmissionIdentity[]));
  }
  return rows;
}

async function getExpiringSubmissions(
  admin: AdminClient,
  assignmentIds: string[],
  cutoff: string,
): Promise<ExpiringSubmission[]> {
  const rows: ExpiringSubmission[] = [];
  for (let start = 0; start < assignmentIds.length; start += QUERY_BATCH_SIZE) {
    const { data, error } = await admin
      .from("submissions")
      .select("id, file_path")
      .in("assignment_id", assignmentIds.slice(start, start + QUERY_BATCH_SIZE))
      .lt("created_at", cutoff);
    if (error) databaseFailure("list retention-eligible submissions", error);
    rows.push(...((data ?? []) as ExpiringSubmission[]));
  }
  return rows;
}

async function anonymizeTeacherSubmissions(
  admin: AdminClient,
  userId: string,
  assignmentIds: string[],
): Promise<number> {
  if (assignmentIds.length === 0) return 0;
  const submissions = await getSubmissionsWithNames(admin, assignmentIds);
  const names = submissions
    .map((submission) => submission.student_name)
    .filter((name): name is string => typeof name === "string" && name.length > 0 && name !== "Student");
  if (names.length === 0) return 0;

  let anonymized = 0;
  for (const submission of submissions) {
    const { data: full, error: fullError } = await admin
      .from("submissions")
      .select("extracted_text")
      .eq("id", submission.id)
      .maybeSingle();
    if (fullError) databaseFailure("read submission text for anonymization", fullError);
    if (!full) continue;

    const { error: submissionError } = await admin
      .from("submissions")
      .update({
        student_name: "Student",
        extracted_text: scrub(full.extracted_text ?? null, names),
      })
      .eq("id", submission.id);
    if (submissionError) databaseFailure("anonymize submission", submissionError);

    const { data: grades, error: gradeReadError } = await admin
      .from("submission_grades")
      .select("id, summary_feedback")
      .eq("submission_id", submission.id)
      .eq("user_id", userId);
    if (gradeReadError) databaseFailure("read grade feedback for anonymization", gradeReadError);
    for (const grade of grades ?? []) {
      const { error } = await admin
        .from("submission_grades")
        .update({ summary_feedback: scrub(grade.summary_feedback, names) })
        .eq("id", grade.id)
        .eq("user_id", userId);
      if (error) databaseFailure("anonymize grade feedback", error);
    }

    const { data: annotations, error: annotationReadError } = await admin
      .from("annotations")
      .select("id, comment, quote")
      .eq("submission_id", submission.id)
      .eq("user_id", userId);
    if (annotationReadError) databaseFailure("read annotations for anonymization", annotationReadError);
    for (const annotation of annotations ?? []) {
      const { error } = await admin
        .from("annotations")
        .update({
          comment: scrub(annotation.comment, names),
          quote: scrub(annotation.quote, names),
        })
        .eq("id", annotation.id)
        .eq("user_id", userId);
      if (error) databaseFailure("anonymize annotation", error);
    }

    anonymized++;
  }
  return anonymized;
}

async function deleteExpiredSubmissions(
  admin: AdminClient,
  userId: string,
  assignmentIds: string[],
  cutoff: string,
): Promise<{ submissions: number; files: number }> {
  if (assignmentIds.length === 0) return { submissions: 0, files: 0 };
  const expiring = await getExpiringSubmissions(admin, assignmentIds, cutoff);
  if (expiring.length === 0) return { submissions: 0, files: 0 };

  const storage = admin.storage.from(SUBMISSIONS_BUCKET);
  let filesRemoved: number;
  try {
    filesRemoved = await eraseOwnedStorageFiles({
      bucket: SUBMISSIONS_BUCKET,
      ownerPrefix: userId,
      list: (prefix, options) => storage.list(prefix, options),
      remove: (paths) => storage.remove(paths),
      targetPaths: expiring
        .map((submission) => submission.file_path)
        .filter((path): path is string => typeof path === "string" && path.length > 0),
    });
  } catch (error) {
    if (error instanceof StorageErasureError) {
      console.error(`[privacy-tasks] storage ${error.stage} failed: ${error.message}`);
      throw new AppError(
        503,
        `storage_${error.stage}`,
        "Retention storage deletion could not be verified; submission records were preserved.",
      );
    }
    throw error;
  }

  let deleted = 0;
  const ids = expiring.map((submission) => submission.id);
  for (let start = 0; start < ids.length; start += QUERY_BATCH_SIZE) {
    const batch = ids.slice(start, start + QUERY_BATCH_SIZE);
    const { data, error } = await admin
      .from("submissions")
      .delete()
      .in("id", batch)
      .select("id");
    if (error) databaseFailure("delete retention-eligible submissions", error);
    deleted += data?.length ?? 0;
  }
  if (deleted !== ids.length) {
    databaseFailure("verify retention deletion", {
      message: `expected ${ids.length}, deleted ${deleted}`,
    });
  }

  return { submissions: deleted, files: filesRemoved };
}

Deno.serve((req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    requireCronSecret(req);

    const admin = adminClient();
    const report = { anonymized: 0, deletedSubmissions: 0, deletedFiles: 0 };
    const assignmentIdsByUser = new Map<string, string[]>();
    const assignmentsFor = async (userId: string) => {
      const cached = assignmentIdsByUser.get(userId);
      if (cached) return cached;
      const assignmentIds = await getAssignmentIds(admin, userId);
      assignmentIdsByUser.set(userId, assignmentIds);
      return assignmentIds;
    };

    // 1) Anonymize teachers who opted in, including body text and generated feedback.
    const { data: optedIn, error: optedInError } = await admin
      .from("privacy_settings")
      .select("user_id")
      .eq("anonymize_student_names", true);
    if (optedInError) databaseFailure("list anonymization settings", optedInError);

    for (const row of optedIn ?? []) {
      const userId = row.user_id as string;
      report.anonymized += await anonymizeTeacherSubmissions(
        admin,
        userId,
        await assignmentsFor(userId),
      );
    }

    // 2) Apply retention. null means "keep forever" on the additive schema; never silently turn
    // it into a 365-day deletion policy.
    const { data: settings, error: settingsError } = await admin
      .from("privacy_settings")
      .select("user_id, retention_days");
    if (settingsError) databaseFailure("list retention settings", settingsError);

    for (const setting of settings ?? []) {
      if (setting.retention_days == null) continue;
      const retentionDays = Number(setting.retention_days);
      if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
        databaseFailure("validate retention setting", {
          message: `invalid retention_days for user ${setting.user_id}`,
        });
      }

      const userId = setting.user_id as string;
      const cutoff = new Date(Date.now() - retentionDays * 86_400_000).toISOString();
      const deleted = await deleteExpiredSubmissions(
        admin,
        userId,
        await assignmentsFor(userId),
        cutoff,
      );
      report.deletedSubmissions += deleted.submissions;
      report.deletedFiles += deleted.files;
    }

    const { error: auditError } = await admin.from("access_audit_log").insert({
      actor_id: null,
      action: "privacy_tasks_run",
      resource: `anonymized:${report.anonymized};deleted:${report.deletedSubmissions};files:${report.deletedFiles}`,
    });
    if (auditError) databaseFailure("write privacy task audit", auditError);

    return ok(req, report);
  });
});
