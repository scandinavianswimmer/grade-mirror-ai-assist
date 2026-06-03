// POST /grade-enqueue { submissionIds: string[] }
// Phase 4 (JOBS-01): enqueue submissions for async grading by the Cloud Run worker. Used for bulk
// grading (a whole class) so the request returns immediately instead of blocking on N model calls.
// Auth: JWT. RLS confirms the caller owns each submission before it's queued.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { userClient } from "../_shared/db.ts";
import { enqueueGradingJob, queueConfigured } from "../_shared/queue.ts";

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    if (!queueConfigured()) throw new AppError(503, "queue_unconfigured", "Async grading queue is not configured");

    const { userId } = await getUserFromJWT(req);
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.submissionIds) ? body.submissionIds.filter((x: unknown) => typeof x === "string") : [];
    if (ids.length === 0) throw new AppError(400, "input", "submissionIds[] is required");

    const db = userClient(req);
    // RLS scopes this to the caller's own submissions — anything not returned isn't theirs to queue.
    const { data: owned } = await db.from("submissions").select("id").in("id", ids);
    const ownedIds = new Set((owned ?? []).map((r) => r.id));

    let queued = 0;
    const skipped: string[] = [];
    for (const id of ids) {
      if (!ownedIds.has(id)) { skipped.push(id); continue; }
      await enqueueGradingJob({ submissionId: id, userId, enqueuedAt: new Date().toISOString(), attempts: 0 });
      await db.from("submissions").update({ status: "grading" }).eq("id", id);
      queued++;
    }

    return ok(req, { queued, skipped });
  });
});
