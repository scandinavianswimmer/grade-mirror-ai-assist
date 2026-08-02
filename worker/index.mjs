// Mr Selby grading worker (Phase 4 — JOBS-01/02, RELY-01/02).
// A Cloud Run service: a tiny HTTP server for the platform health check + a background loop that
// pops grading jobs off the Upstash queue and invokes the grade-submission edge function via the
// secret-gated internal path. Idempotent + retried; a single bad job never crashes the loop.
import http from "node:http";

const {
  PORT = "8080",
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  INTERNAL_GRADE_SECRET,
  MAX_ATTEMPTS = "3",
  IDLE_SLEEP_MS = "3000",
} = process.env;

const QUEUE = "grading:queue";
const GRADE_FN = `${SUPABASE_URL}/functions/v1/grade-submission`;
const maxAttempts = Number(MAX_ATTEMPTS);

function requireEnv() {
  const missing = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "SUPABASE_URL", "SUPABASE_ANON_KEY", "INTERNAL_GRADE_SECRET"]
    .filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Worker missing env: ${missing.join(", ")}`);
}

async function redis(path, body) {
  const res = await fetch(`${UPSTASH_REDIS_REST_URL}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Upstash ${path} HTTP ${res.status}`);
  return (await res.json()).result;
}

const popJob = async () => {
  const raw = await redis(`rpop/${QUEUE}`); // FIFO: producer LPUSHes, worker RPOPs
  return raw ? JSON.parse(raw) : null;
};
const requeue = (job) => redis(`lpush/${QUEUE}`, JSON.stringify({ ...job, attempts: (job.attempts ?? 0) + 1 }));

async function grade(job) {
  const res = await fetch(GRADE_FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      "x-internal-secret": INTERNAL_GRADE_SECRET,
    },
    body: JSON.stringify({ submissionId: job.submissionId, userId: job.userId }),
  });
  if (!res.ok) throw new Error(`grade-submission HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function processOne() {
  const job = await popJob();
  if (!job) return false;
  try {
    await grade(job);
    console.log(`[worker] graded ${job.submissionId}`);
  } catch (err) {
    const attempts = job.attempts ?? 0;
    if (attempts + 1 < maxAttempts) {
      console.warn(`[worker] retry ${job.submissionId} (attempt ${attempts + 1}): ${err.message}`);
      await requeue(job); // RELY-02: failed jobs are retried, not silently lost
    } else {
      console.error(`[worker] giving up on ${job.submissionId} after ${maxAttempts} attempts: ${err.message}`);
    }
  }
  return true;
}

async function loop() {
  // RELY-01: one bad job/iteration can't crash the loop.
  for (;;) {
    try {
      const had = await processOne();
      if (!had) await new Promise((r) => setTimeout(r, Number(IDLE_SLEEP_MS)));
    } catch (err) {
      console.error(`[worker] loop error (continuing): ${err.message}`);
      await new Promise((r) => setTimeout(r, Number(IDLE_SLEEP_MS)));
    }
  }
}

requireEnv();
// Cloud Run requires the container to listen on 0.0.0.0:$PORT. Bind the host explicitly (not just the
// port) so the contract is unambiguous and doesn't rely on Node's default-interface behavior.
http.createServer((_req, res) => { res.writeHead(200); res.end("ok"); }).listen(Number(PORT), "0.0.0.0", () => {
  console.log(`[worker] health server on 0.0.0.0:${PORT}; polling ${QUEUE}`);
  loop();
});
