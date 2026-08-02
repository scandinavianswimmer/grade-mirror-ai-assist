// Portable Cloud Run entry shim for a Supabase Deno edge function — M2 (compute → Cloud Run).
//
// WHY THIS EXISTS
// Supabase edge functions are authored as Deno modules that call `Deno.serve(handler)` at import
// time (see ../../supabase/functions/grade-submission/index.ts). That is exactly an HTTP server —
// the ONLY thing that makes it "Supabase-specific" is the hosting platform, not the code. So we can
// run the *unmodified* function on Cloud Run by importing it. The one mismatch: bare `Deno.serve()`
// defaults to port 8000 and ignores Cloud Run's injected $PORT. We bridge that here WITHOUT editing
// the function: wrap `Deno.serve` so that when the function module calls it, the handler is bound to
// 0.0.0.0:$PORT (the Cloud Run container contract).
//
// This is a strangler-fig parallel path: the same function keeps running on Supabase unchanged; this
// shim lets the identical code ALSO run as a Cloud Run service. Nothing here mutates the function.
//
// SELECTING THE FUNCTION
// The function module is chosen at build time via the EDGE_FUNCTION env var (default: grade-submission)
// and imported from the repo's supabase/functions tree, which the Dockerfile copies into the image.
// To run a different function as its own Cloud Run service, deploy with --set-env-vars EDGE_FUNCTION=<name>
// (and that function's required secrets) — no new shim needed.

const PORT = Number(Deno.env.get("PORT") ?? "8080");
const HOST = "0.0.0.0"; // Cloud Run requires binding all interfaces, not localhost.
const EDGE_FUNCTION = (Deno.env.get("EDGE_FUNCTION") ?? "grade-submission").trim();

// Capture the real Deno.serve, then intercept the function module's call to it. The function passes
// either a bare handler `Deno.serve(handler)` or `Deno.serve(options, handler)`; normalize both and
// force our { hostname, port } so $PORT always wins. We resolve a promise once the server is up so a
// failed import/bind surfaces as a non-zero exit (Cloud Run marks the revision unhealthy) rather than
// a silent hang.
const realServe = Deno.serve.bind(Deno);
let served = false;
let resolveStarted!: () => void;
const started = new Promise<void>((r) => (resolveStarted = r));

const denoRuntime = Deno as unknown as {
  serve: (optionsOrHandler: unknown, handler?: unknown) => ReturnType<typeof realServe>;
};

denoRuntime.serve = (a: unknown, b?: unknown) => {
  // Two call shapes: (handler) or (options, handler).
  const handler = (typeof a === "function" ? a : b) as Deno.ServeHandler;
  if (typeof handler !== "function") {
    throw new Error(`[serve-edge] ${EDGE_FUNCTION} called Deno.serve without a handler`);
  }
  served = true;
  return realServe(
    {
      hostname: HOST,
      port: PORT,
      onListen: () => {
        console.log(`[serve-edge] ${EDGE_FUNCTION} listening on ${HOST}:${PORT}`);
        resolveStarted();
      },
    },
    handler,
  );
};

// Importing the function module runs its top-level `Deno.serve(...)`, which our wrapper intercepts.
// The path is relative to this file inside the image (see Dockerfile COPY layout).
await import(`./functions/${EDGE_FUNCTION}/index.ts`);

if (!served) {
  console.error(`[serve-edge] ${EDGE_FUNCTION}/index.ts did not call Deno.serve — nothing to host`);
  Deno.exit(1);
}
await started;
