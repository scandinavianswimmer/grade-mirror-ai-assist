// Model registry + health-based fallback for aiTA (Google Gemini).
// All Gemini models accept `temperature` (0 => deterministic grading) and responseSchema JSON,
// so the registry is simple: id + priority. Defaults are STABLE GA models, not previews.
import { adminClient } from "../db.ts";

export interface ModelSpec {
  id: string;
  priority: number; // lower = preferred
}

// Grading default = gemini-2.5-pro (strong rubric reasoning, mature responseSchema support).
// Fallback = gemini-2.5-flash (cheaper/faster) for health failover and high-volume grading.
// Newer GA option to consider swapping in for cost/quality: "gemini-3.5-flash".
// Override the primary via the GEMINI_GRADING_MODEL secret without editing code.
export const GRADING_MODELS: ModelSpec[] = [
  { id: Deno.env.get("GEMINI_GRADING_MODEL") ?? "gemini-2.5-pro", priority: 0 },
  { id: "gemini-2.5-flash", priority: 1 },
];

const FAIL_THRESHOLD = 5;
// A model marked unhealthy is re-admitted (given another chance) after this cooldown, so a transient
// failure of the preferred model (e.g. gemini-2.5-pro) doesn't permanently demote it to the fallback.
const HEALTH_COOLDOWN_MS = 10 * 60 * 1000;

// Returns grading models ordered by preference, filtered to those currently healthy.
export async function getHealthyGradingModels(): Promise<ModelSpec[]> {
  const admin = adminClient();
  const { data } = await admin.from("ai_model_health").select("model_id, healthy, updated_at");
  const now = Date.now();
  const unhealthy = new Set(
    (data ?? [])
      .filter((r) => {
        if (r.healthy !== false) return false;
        // Past the cooldown? Re-admit so the model gets retried and can recover.
        const ts = r.updated_at ? new Date(r.updated_at).getTime() : 0;
        return now - ts < HEALTH_COOLDOWN_MS;
      })
      .map((r) => r.model_id),
  );
  // De-dup in case the override equals the fallback id.
  const seen = new Set<string>();
  const healthy = GRADING_MODELS.filter((m) => {
    if (seen.has(m.id) || unhealthy.has(m.id)) return false;
    seen.add(m.id);
    return true;
  }).sort((a, b) => a.priority - b.priority);
  // Never return empty — if all flagged unhealthy, try them anyway (fail-open on routing).
  return healthy.length ? healthy : [...GRADING_MODELS];
}

export async function recordModelResult(
  modelId: string,
  ok: boolean,
  latencyMs: number,
  errorType?: string,
): Promise<void> {
  const admin = adminClient();
  await admin.from("ai_request_logs").insert({
    model_id: modelId,
    ok,
    error_type: errorType ?? null,
    latency_ms: latencyMs,
  });

  const { data: row } = await admin
    .from("ai_model_health")
    .select("consecutive_fails")
    .eq("model_id", modelId)
    .maybeSingle();

  const fails = ok ? 0 : (row?.consecutive_fails ?? 0) + 1;
  await admin.from("ai_model_health").upsert({
    model_id: modelId,
    consecutive_fails: fails,
    healthy: fails < FAIL_THRESHOLD,
    updated_at: new Date().toISOString(),
  });
}
