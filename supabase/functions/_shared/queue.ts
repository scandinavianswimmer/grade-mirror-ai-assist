// Phase 4 (JOBS-01): grading job queue on Upstash Redis (REST API — works from Deno edge functions
// and the Cloud Run worker alike). Enqueue is used by grade-enqueue for bulk/async grading; the
// Cloud Run worker pops + processes. No-ops with a clear error if Upstash isn't configured yet.

export const GRADING_QUEUE = "grading:queue";

export interface GradingJob {
  submissionId: string;
  userId: string;
  enqueuedAt: string;
  attempts?: number;
}

function upstash(): { url: string; token: string } | null {
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
  return url && token ? { url, token } : null;
}

// LPUSH the job; the worker RPOPs (FIFO). Returns the new queue length.
export async function enqueueGradingJob(job: GradingJob): Promise<number> {
  const cfg = upstash();
  if (!cfg) throw new Error("Queue not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)");
  const res = await fetch(`${cfg.url}/lpush/${GRADING_QUEUE}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(JSON.stringify(job)),
  });
  if (!res.ok) throw new Error(`Upstash lpush failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const out = (await res.json()) as { result?: number };
  return out.result ?? 0;
}

export function queueConfigured(): boolean {
  return upstash() !== null;
}
