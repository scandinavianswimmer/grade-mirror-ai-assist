// POST /increment-feedback-count
// Auth: JWT. Identity is derived from the token (C2) — body userId is ignored.
// Uses an atomic RPC (increment_weekly_feedback) so the weekly limit can't be raced (H33).
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { userClient } from "../_shared/db.ts";

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    await getUserFromJWT(req); // ensure authenticated; RPC scopes to auth.uid()

    const db = userClient(req);
    const { data, error } = await db.rpc("increment_weekly_feedback");
    if (error) throw new AppError(500, "usage", "Could not update usage");

    const row = Array.isArray(data) ? data[0] : data;
    return ok(req, {
      success: !!row?.allowed,
      allowed: !!row?.allowed,
      newCount: row?.new_count ?? null,
      maxWeekly: row?.max_weekly ?? null,
      plan: row?.plan ?? null,
    });
  });
});
