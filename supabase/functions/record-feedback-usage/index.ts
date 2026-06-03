// POST /record-feedback-usage   (replaces v1 increment-feedback-count)
// Auth: JWT. Identity derived from the token — NEVER from the request body. Increments the
// privileged weekly_feedback_count column via service role (clients cannot write it directly),
// with automatic weekly reset. Enforces plan limits server-side.
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";
import { adminClient } from "../_shared/db.ts";

const WEEKLY_LIMIT: Record<string, number> = { free: 10, pro: 1000, enterprise: 100000 };

function startOfWeek(d = new Date()): string {
  const day = d.getUTCDay();
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");
    const { userId } = await getUserFromJWT(req);

    const admin = adminClient();
    const { data: user, error } = await admin
      .from("users")
      .select("plan, weekly_feedback_count, last_reset_date")
      .eq("id", userId)
      .single();
    if (error || !user) throw new AppError(404, "user", "User profile not found");

    const weekStart = startOfWeek();
    let count = user.weekly_feedback_count ?? 0;
    if ((user.last_reset_date ?? "") < weekStart) count = 0; // weekly reset

    const limit = WEEKLY_LIMIT[user.plan] ?? WEEKLY_LIMIT.free;
    if (count >= limit) {
      throw new AppError(429, "limit", `Weekly feedback limit reached for plan '${user.plan}'`);
    }

    const { error: updErr } = await admin
      .from("users")
      .update({ weekly_feedback_count: count + 1, last_reset_date: weekStart })
      .eq("id", userId);
    if (updErr) throw new AppError(500, "update", "Failed to record usage");

    return ok(req, { count: count + 1, limit, remaining: limit - (count + 1) });
  });
});
