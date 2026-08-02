// Per-teacher grading quota gate (rate-limit Layer A). Calls the atomic consume_grading_quota RPC,
// which locks the user row, applies the weekly reset + plan limit, and increments — all in one
// transaction, so it is race-safe (no TOCTOU). Identity comes from auth.uid() inside the RPC,
// never the request body.
//
// FAILS OPEN: if the RPC is absent (migration not yet applied) or errors transiently, grading is
// allowed (and logged) rather than blocked — a missing migration or DB hiccup must never break
// grading. It BLOCKS only on a definitive allowed=false verdict.
import { AppError } from "./http.ts";

// Minimal structural type — both userClient and adminClient satisfy it.
type RpcCapable = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function errorDetail(error: unknown): string {
  if (!isRecord(error)) return "unknown";
  if (typeof error.message === "string") return error.message;
  if (typeof error.code === "string") return error.code;
  return "unknown";
}

export async function enforceGradingQuota(db: RpcCapable, units = 1): Promise<void> {
  const { data, error } = await db.rpc("consume_grading_quota", { p_units: units });
  if (error) {
    console.error(
      `[quota] consume_grading_quota unavailable; allowing (fail-open): ${errorDetail(error)}`,
    );
    return;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (isRecord(row) && row.allowed === false) {
    throw new AppError(
      429,
      "quota_exceeded",
      `Monthly grading limit reached (${String(row.used)}/${String(row.max_weekly)} on the ${String(row.plan)} plan). Upgrade your plan or wait for the monthly reset.`,
    );
  }
}
