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

// ── Dev-mode pacer ────────────────────────────────────────────────────────────
// In-process minimum-interval throttle for upstream Gemini calls. Unlike the Upstash ceiling
// (which no-ops when Upstash isn't configured), this needs NO external infra — it serializes calls
// within a warm isolate to stay under free-tier RPM during development. It DELAYS rather than
// rejects, so grading still succeeds, just paced. 0 (the default) disables it entirely → zero
// overhead in production. Enable in dev by setting GEMINI_MIN_CALL_INTERVAL_MS (e.g. 4000 ≈ 15
// calls/min, comfortably under the free flash tier's per-key RPM with two rotating keys).
let _pacerChain: Promise<void> = Promise.resolve();
let _lastCallAt = 0;

export function paceUpstreamCall(): Promise<void> {
  const interval = Number(Deno.env.get("GEMINI_MIN_CALL_INTERVAL_MS") ?? "0");
  if (!Number.isFinite(interval) || interval <= 0) return Promise.resolve();
  // Chain so that concurrent calls queue and each waits its turn behind the last.
  _pacerChain = _pacerChain.then(async () => {
    const wait = _lastCallAt + interval - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    _lastCallAt = Date.now();
  });
  return _pacerChain;
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
