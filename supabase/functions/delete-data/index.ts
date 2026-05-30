// POST /delete-data  { scope: "submission" | "class" | "account", id? }
// Auth: JWT. Right-to-erasure (FERPA / H2): deletes the caller's data — DB rows AND the uploaded
// Storage objects (H3: previously orphaned forever) — then writes an access_audit_log entry.
// Everything runs through the user's RLS-scoped client, so a caller can only ever erase their own
// data. DB cascades remove dependent grades/annotations; this function additionally removes the
// Storage files the cascades can't reach.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { userClient, adminClient } from "../_shared/db.ts";

const UPLOAD_BUCKET = "uploads"; // matches src/lib/fileUpload.ts default

// Best-effort removal of the Storage objects backing a set of submissions. Non-fatal: a storage
// hiccup must not leave the caller unable to erase their DB rows (we log and continue).
// deno-lint-ignore no-explicit-any
async function removeFiles(db: any, filePaths: string[]): Promise<number> {
  const paths = filePaths.filter((p): p is string => typeof p === "string" && p.length > 0);
  if (paths.length === 0) return 0;
  const { error } = await db.storage.from(UPLOAD_BUCKET).remove(paths);
  if (error) {
    console.error(`[delete-data] storage remove failed (continuing): ${error.message}`);
    return 0;
  }
  return paths.length;
}

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    const { userId } = await getUserFromJWT(req);
    const body = await req.json().catch(() => ({}));
    const scope = body.scope;
    const id = typeof body.id === "string" ? body.id : null;
    const db = userClient(req); // RLS: caller can only read/delete their own rows + files

    let submissionFilter: { col: string; ids: string[] } | null = null;

    if (scope === "submission") {
      if (!id) throw new AppError(400, "input", "id (submissionId) is required");
      submissionFilter = { col: "id", ids: [id] };
    } else if (scope === "class") {
      if (!id) throw new AppError(400, "input", "id (classId) is required");
      const { data: asgs } = await db.from("assignments").select("id").eq("class_id", id);
      const asgIds = (asgs ?? []).map((a) => a.id as string);
      submissionFilter = { col: "assignment_id", ids: asgIds };
    } else if (scope === "account") {
      submissionFilter = null; // all of the caller's submissions (RLS scopes to them)
    } else {
      throw new AppError(400, "input", 'scope must be "submission", "class", or "account"');
    }

    // 1) Collect the Storage paths for the submissions being erased, then remove the files.
    let q = db.from("submissions").select("id, file_path");
    if (submissionFilter) {
      if (submissionFilter.ids.length === 0) q = q.eq("id", "00000000-0000-0000-0000-000000000000"); // matches nothing
      else q = q.in(submissionFilter.col, submissionFilter.ids);
    }
    const { data: subs } = await q;
    const filePaths = (subs ?? []).map((s) => s.file_path as string);
    const filesRemoved = await removeFiles(db, filePaths);

    // 2) Delete DB rows. Cascades handle submission_grades / annotations / annotation_edits.
    let deletedSubmissions = 0;
    const subIds = (subs ?? []).map((s) => s.id as string);
    if (subIds.length > 0) {
      const { data: del } = await db.from("submissions").delete().in("id", subIds).select("id");
      deletedSubmissions = del?.length ?? 0;
    }

    if (scope === "class" && id) {
      // Remove the class's assignments then the class itself (RLS-scoped to the owner).
      await db.from("assignments").delete().eq("class_id", id);
      await db.from("classes").delete().eq("id", id);
    } else if (scope === "account") {
      // Erase the caller's remaining owned content. Auth-user (auth.users) deletion is a separate
      // privileged step (admin API) and is intentionally NOT done here.
      await db.from("assignments").delete().eq("user_id", userId);
      await db.from("classes").delete().eq("user_id", userId);
      await db.from("rubrics").delete().eq("user_id", userId);
      await db.from("training_examples").delete().eq("user_id", userId);
    }

    // 3) Audit (server-only table via service role).
    await adminClient().from("access_audit_log").insert({
      actor_id: userId,
      action: "delete_data",
      resource: `scope:${scope};id:${id ?? "all"};submissions:${deletedSubmissions};files:${filesRemoved}`,
    });

    return ok(req, { scope, deletedSubmissions, filesRemoved });
  });
});
