// POST /delete-data  { scope: "submission" | "class" | "account", id? }
// Auth: JWT. Erases the caller's owned content and verifies Storage deletion before deleting the
// corresponding database rows. The authenticated account itself is deliberately retained.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { adminClient } from "../_shared/db.ts";
import {
  eraseOwnedStorageFiles,
  listOwnedStorageFiles,
  StorageErasureError,
} from "../_shared/storage-erasure.ts";

const SUBMISSIONS_BUCKET = "submissions";
const ACCOUNT_STORAGE_BUCKETS = [
  SUBMISSIONS_BUCKET,
  "uploads",
  "grading-examples",
  "training-data",
] as const;
const QUERY_BATCH_SIZE = 100;
const REQUIRED_ACCOUNT_CHILD_TABLES = [
  "agent_events",
  "teacher_feedback_exemplars",
  "grading_batches",
  "annotation_edits",
  "annotations",
  "submission_grades",
  "rubric_criteria",
  "teacher_style_profiles",
  "consent_records",
  "lms_credentials",
  "llm_sessions",
  "training_examples",
] as const;
const REQUIRED_ACCOUNT_CORE_TABLES = [
  "rubrics",
  "assignments",
  "classes",
  "privacy_settings",
] as const;
const REQUIRED_ACCOUNT_USER_TABLES = [
  ...REQUIRED_ACCOUNT_CHILD_TABLES,
  ...REQUIRED_ACCOUNT_CORE_TABLES,
] as const;
const OPTIONAL_ACCOUNT_USER_TABLES = [
  "teacher_edits",
  "teacher_comments",
  "grading_examples",
  "ai_profiles",
  "teacher_profiles",
  "training_data",
  "lms_integrations",
  "podcast_episodes",
  "ai_request_logs",
] as const;

type AdminClient = ReturnType<typeof adminClient>;
type Submission = { id: string; assignment_id: string; file_path: string | null };

function databaseFailure(operation: string, error: { message: string; code?: string } | null): never {
  console.error(`[delete-data] ${operation} failed: ${error?.code ?? "unknown"} ${error?.message ?? "unknown"}`);
  throw new AppError(
    500,
    "database",
    "Data deletion did not complete. Some records may already be removed; please retry to finish.",
  );
}

function storageOperations(admin: AdminClient, bucketName: string) {
  const bucket = admin.storage.from(bucketName);
  return {
    list: (prefix: string, options: { limit: number; offset: number; sortBy: { column: "name"; order: "asc" } }) =>
      bucket.list(prefix, options),
    remove: (paths: string[]) => bucket.remove(paths),
  };
}

async function eraseStorage(options: {
  admin: AdminClient;
  bucket: string;
  userId: string;
  targetPaths?: string[];
}): Promise<number> {
  const operations = storageOperations(options.admin, options.bucket);
  try {
    return await eraseOwnedStorageFiles({
      bucket: options.bucket,
      ownerPrefix: options.userId,
      ...operations,
      targetPaths: options.targetPaths,
    });
  } catch (error) {
    if (error instanceof StorageErasureError) {
      console.error(`[delete-data] storage ${error.stage} failed: ${error.message}`);
      throw new AppError(
        503,
        `storage_${error.stage}`,
        "Storage deletion could not be verified, so database records were preserved. Please retry.",
      );
    }
    throw error;
  }
}

async function eraseLegacyPersonalBucket(
  admin: AdminClient,
  userId: string,
): Promise<{ bucket: string; removed: number } | null> {
  // The legacy signup trigger created one dedicated `user-<uuid>` bucket per account. Current
  // uploads use shared owner-prefixed buckets, but old objects in the dedicated bucket still count
  // as user data. The bucket itself can remain because the sign-in account is retained.
  const bucketName = `user-${userId}`;
  const operations = storageOperations(admin, bucketName);
  try {
    const removed = await eraseOwnedStorageFiles({
      bucket: bucketName,
      ownerPrefix: "",
      allowBucketRoot: true,
      ...operations,
    });
    return { bucket: bucketName, removed };
  } catch (error) {
    if (
      error instanceof StorageErasureError &&
      error.stage === "list" &&
      /bucket.*not found|not found.*bucket/i.test(error.message)
    ) {
      return null; // clean v2 never created the legacy per-user bucket
    }
    if (error instanceof StorageErasureError) {
      console.error(`[delete-data] storage ${error.stage} failed: ${error.message}`);
      throw new AppError(
        503,
        `storage_${error.stage}`,
        "Storage deletion could not be verified, so database records were preserved. Please retry.",
      );
    }
    throw error;
  }
}

async function getOwnedAssignmentIds(
  admin: AdminClient,
  userId: string,
  classId?: string,
): Promise<string[]> {
  let query = admin.from("assignments").select("id").eq("user_id", userId);
  if (classId) query = query.eq("class_id", classId);
  const { data, error } = await query;
  if (error) databaseFailure("list owned assignments", error);
  return (data ?? []).map((row) => row.id as string);
}

async function getOwnedSubmissions(
  admin: AdminClient,
  assignmentIds: string[],
  submissionId?: string,
): Promise<Submission[]> {
  if (assignmentIds.length === 0) return [];

  const rows: Submission[] = [];
  for (let start = 0; start < assignmentIds.length; start += QUERY_BATCH_SIZE) {
    const batch = assignmentIds.slice(start, start + QUERY_BATCH_SIZE);
    let query = admin
      .from("submissions")
      .select("id, assignment_id, file_path")
      .in("assignment_id", batch);
    if (submissionId) query = query.eq("id", submissionId);
    const { data, error } = await query;
    if (error) databaseFailure("list owned submissions", error);
    rows.push(...((data ?? []) as Submission[]));
  }

  return rows;
}

async function deleteSubmissionRows(
  admin: AdminClient,
  submissionIds: string[],
): Promise<number> {
  let deleted = 0;
  for (let start = 0; start < submissionIds.length; start += QUERY_BATCH_SIZE) {
    const batch = submissionIds.slice(start, start + QUERY_BATCH_SIZE);
    const { data, error } = await admin
      .from("submissions")
      .delete()
      .in("id", batch)
      .select("id");
    if (error) databaseFailure("delete submissions", error);
    deleted += data?.length ?? 0;
  }
  if (deleted !== submissionIds.length) {
    databaseFailure("verify deleted submissions", {
      message: `expected ${submissionIds.length}, deleted ${deleted}`,
    });
  }
  return deleted;
}

function isMissingOptionalSchema(error: { code?: string; message: string }): boolean {
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    /could not find the (table|column)|does not exist/i.test(error.message)
  );
}

async function deleteOwnedRows(
  admin: AdminClient,
  table: string,
  column: string,
  userId: string,
  optional = false,
): Promise<void> {
  const { error } = await admin.from(table).delete().eq(column, userId);
  if (error) {
    if (optional && isMissingOptionalSchema(error)) return;
    databaseFailure(`delete ${table}`, error);
  }

  const { count, error: verifyError } = await admin
    .from(table)
    .select(column, { count: "exact", head: true })
    .eq(column, userId);
  if (verifyError) {
    if (optional && isMissingOptionalSchema(verifyError)) return;
    databaseFailure(`verify ${table} deletion`, verifyError);
  }
  if (count !== 0) {
    databaseFailure(`verify ${table} deletion`, {
      message: `${count ?? "unknown"} owned row(s) remained`,
    });
  }
}

async function assertOwnedTableAccessible(
  admin: AdminClient,
  table: string,
  column: string,
  userId: string,
  optional = false,
): Promise<void> {
  const { error } = await admin
    .from(table)
    .select(column, { count: "exact", head: true })
    .eq(column, userId);
  if (!error) return;
  if (optional && isMissingOptionalSchema(error)) return;
  databaseFailure(`preflight ${table}`, error);
}

async function assertAccountDatabaseReady(admin: AdminClient, userId: string): Promise<void> {
  // Discover schema drift/permission failures before touching Storage. This materially reduces the
  // chance of an old deployment deleting files and only then learning its database is incompatible.
  for (const table of REQUIRED_ACCOUNT_USER_TABLES) {
    await assertOwnedTableAccessible(admin, table, "user_id", userId);
  }
  for (const table of OPTIONAL_ACCOUNT_USER_TABLES) {
    await assertOwnedTableAccessible(admin, table, "user_id", userId, true);
  }
  await assertOwnedTableAccessible(admin, "access_audit_log", "actor_id", userId);
}

async function assertAccountStorageReady(admin: AdminClient, userId: string): Promise<boolean> {
  const check = async (bucketName: string, prefix: string, optionalMissing = false) => {
    const { error } = await admin.storage.from(bucketName).list(prefix, {
      limit: 1,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });
    if (!error) return true;
    if (optionalMissing && /bucket.*not found|not found.*bucket/i.test(error.message)) return false;
    console.error(`[delete-data] storage preflight failed for ${bucketName}: ${error.message}`);
    throw new AppError(
      503,
      "storage_list",
      "Storage deletion could not be verified, so database records were preserved. Please retry.",
    );
  };

  // Check every required bucket before deleting from the first one, so schema/bucket drift cannot
  // create an avoidable partial purge halfway through the operation.
  for (const bucket of ACCOUNT_STORAGE_BUCKETS) await check(bucket, userId);
  return check(`user-${userId}`, "", true);
}

async function deleteAccountDatabaseContent(
  admin: AdminClient,
  userId: string,
  submissions: Submission[],
): Promise<number> {
  // Tables introduced after the baseline do not all have foreign keys, so delete every current
  // user-owned data store explicitly. Any real permission/database error aborts the operation.
  for (const table of REQUIRED_ACCOUNT_CHILD_TABLES) {
    await deleteOwnedRows(admin, table, "user_id", userId);
  }

  // These stores exist only on the additive/legacy branch. A precisely identified missing table is
  // acceptable; every other error remains fatal. This is intentionally not a blanket catch.
  for (const table of OPTIONAL_ACCOUNT_USER_TABLES) {
    await deleteOwnedRows(admin, table, "user_id", userId, true);
  }

  const deletedSubmissions = await deleteSubmissionRows(
    admin,
    submissions.map((submission) => submission.id),
  );

  // Core parent records and personalization data. Ordering avoids relying on a particular mix of
  // legacy and v2 cascade definitions.
  for (const table of ["rubrics", "assignments", "classes"]) {
    await deleteOwnedRows(admin, table, "user_id", userId);
  }
  await deleteOwnedRows(admin, "privacy_settings", "user_id", userId);
  await deleteOwnedRows(admin, "access_audit_log", "actor_id", userId);

  return deletedSubmissions;
}

Deno.serve((req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");

    const { userId } = await getUserFromJWT(req);
    const body = await req.json().catch(() => ({}));
    const scope = body.scope;
    const id = typeof body.id === "string" ? body.id : null;
    if (scope !== "submission" && scope !== "class" && scope !== "account") {
      throw new AppError(400, "input", 'scope must be "submission", "class", or "account"');
    }
    if ((scope === "submission" || scope === "class") && !id) {
      throw new AppError(400, "input", `id is required for ${scope} deletion`);
    }

    const admin = adminClient();

    if (scope === "class") {
      const { data: ownedClass, error } = await admin
        .from("classes")
        .select("id")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) databaseFailure("verify class ownership", error);
      if (!ownedClass) throw new AppError(404, "ownership", "Class not found");
    }

    const assignmentIds = await getOwnedAssignmentIds(
      admin,
      userId,
      scope === "class" ? (id as string) : undefined,
    );
    const submissions = await getOwnedSubmissions(
      admin,
      assignmentIds,
      scope === "submission" ? (id as string) : undefined,
    );
    if (scope === "submission" && submissions.length !== 1) {
      throw new AppError(404, "ownership", "Submission not found");
    }
    let legacyPersonalBucketExists = false;
    if (scope === "account") {
      await assertAccountDatabaseReady(admin, userId);
      legacyPersonalBucketExists = await assertAccountStorageReady(admin, userId);
    }

    // Storage is always deleted and then re-enumerated BEFORE database rows. Account deletion
    // purges every nested/orphaned object under the user's prefix in all user-owned buckets.
    let filesRemoved = 0;
    const bucketsProcessed: string[] = [];
    if (scope === "account") {
      for (const bucket of ACCOUNT_STORAGE_BUCKETS) {
        filesRemoved += await eraseStorage({ admin, bucket, userId });
        bucketsProcessed.push(bucket);
      }
      if (legacyPersonalBucketExists) {
        const personalBucket = await eraseLegacyPersonalBucket(admin, userId);
        if (personalBucket) {
          filesRemoved += personalBucket.removed;
          bucketsProcessed.push(personalBucket.bucket);
        }
      }
    } else {
      const databasePaths = submissions
        .map((submission) => submission.file_path)
        .filter((path): path is string => typeof path === "string" && path.length > 0);
      let targetPaths = databasePaths;

      if (scope === "class") {
        const operations = storageOperations(admin, SUBMISSIONS_BUCKET);
        let allFiles: string[];
        try {
          allFiles = await listOwnedStorageFiles({
            bucket: SUBMISSIONS_BUCKET,
            ownerPrefix: userId,
            list: operations.list,
          });
        } catch (error) {
          if (error instanceof StorageErasureError) {
            console.error(`[delete-data] storage ${error.stage} failed: ${error.message}`);
            throw new AppError(
              503,
              `storage_${error.stage}`,
              "Storage deletion could not be verified, so database records were preserved. Please retry.",
            );
          }
          throw error;
        }
        const assignmentPrefixes = assignmentIds.map(
          (assignmentId) => `${userId}/assignments/${assignmentId}/`,
        );
        targetPaths = [
          ...databasePaths,
          ...allFiles.filter((path) => assignmentPrefixes.some((prefix) => path.startsWith(prefix))),
        ];
      }

      filesRemoved = await eraseStorage({
        admin,
        bucket: SUBMISSIONS_BUCKET,
        userId,
        targetPaths,
      });
      bucketsProcessed.push(SUBMISSIONS_BUCKET);
    }

    let deletedSubmissions: number;
    if (scope === "account") {
      deletedSubmissions = await deleteAccountDatabaseContent(admin, userId, submissions);
    } else {
      deletedSubmissions = await deleteSubmissionRows(
        admin,
        submissions.map((submission) => submission.id),
      );
      if (scope === "class") {
        const { data: deletedAssignments, error: assignmentError } = await admin
          .from("assignments")
          .delete()
          .in("id", assignmentIds.length > 0 ? assignmentIds : ["00000000-0000-0000-0000-000000000000"])
          .eq("user_id", userId)
          .select("id");
        if (assignmentError) databaseFailure("delete class assignments", assignmentError);
        if ((deletedAssignments?.length ?? 0) !== assignmentIds.length) {
          databaseFailure("verify deleted class assignments", {
            message: `expected ${assignmentIds.length}, deleted ${deletedAssignments?.length ?? 0}`,
          });
        }

        const { data: deletedClass, error: classError } = await admin
          .from("classes")
          .delete()
          .eq("id", id)
          .eq("user_id", userId)
          .select("id");
        if (classError) databaseFailure("delete class", classError);
        if (deletedClass?.length !== 1) {
          databaseFailure("verify deleted class", { message: "owned class was not deleted" });
        }
      }
    }

    const { error: auditError } = await admin.from("access_audit_log").insert({
      actor_id: scope === "account" ? null : userId,
      action: "delete_data",
      resource: `scope:${scope};id:${id ?? "all"};submissions:${deletedSubmissions};files:${filesRemoved}`,
    });
    if (auditError) databaseFailure("write deletion audit", auditError);

    return ok(req, {
      scope,
      deletedSubmissions,
      filesRemoved,
      bucketsProcessed,
      accountRetained: true,
    });
  });
});
