// Global, cross-tenant rate ceiling for upstream Gemini calls — backed by the same Upstash Redis
// the job queue already uses (queue.ts). It counts EVERY upstream call (including key-pool
// rotations) in a fixed 60-second window. Once the ceiling is hit, callers back off instead of
// draining the rotating free-tier key pool for every tenant (the headline abuse vector).
//
// Best-effort by design: if Upstash isn't configured, or the check errors, it fails OPEN — grading
// is never blocked by a Redis hiccup. The per-user quota gate (Layer A) and the per-request call
// budget (Layer C) are the other, independent layers; this one is purely the cross-tenant valve.

const WINDOW_SECONDS = 60;
// Upstream Gemini calls per minute, summed across all tenants + key rotations. Set with headroom
// for legitimate sequential bulk grading (a whole class) while still stopping a scripted drain
// (which does thousands/min). Tune via GEMINI_GLOBAL_QPM.
const DEFAULT_CEILING = 120;

function ceiling(): number {
  const n = Number(Deno.env.get("GEMINI_GLOBAL_QPM") ?? String(DEFAULT_CEILING));
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CEILING;
}

function upstash(): { url: string; token: string } | null {
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
  return url && token ? { url, token } : null;
}

export interface BudgetVerdict {
  ok: boolean;
  count: number;
  ceiling: number;
}

// INCR a per-minute counter and report whether we're still under the global ceiling.
// Returns ok=true (fail-open) whenever the limiter can't be consulted.
export async function withinGlobalGeminiBudget(): Promise<BudgetVerdict> {
  const cap = ceiling();
  const cfg = upstash();
  if (!cfg) return { ok: true, count: 0, ceiling: cap };
  try {
    const bucket = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
    const key = `gemini:rl:${bucket}`;
    // One round-trip: INCR the window counter, then (re)set its TTL so buckets self-expire.
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(WINDOW_SECONDS * 2)],
      ]),
    });
    if (!res.ok) return { ok: true, count: 0, ceiling: cap }; // fail open
    const out = (await res.json()) as Array<{ result?: number }>;
    const count = out?.[0]?.result ?? 0;
    return { ok: count <= cap, count, ceiling: cap };
  } catch {
    return { ok: true, count: 0, ceiling: cap }; // fail open — never block grading on a Redis error
  }
}
