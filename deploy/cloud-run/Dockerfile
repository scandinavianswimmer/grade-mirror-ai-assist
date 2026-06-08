# Generic Cloud Run image that runs an UNMODIFIED Supabase Deno edge function as a standalone HTTP
# server on $PORT — M2 (compute → Cloud Run), strangler-fig parallel path.
#
# BUILD CONTEXT: the repository ROOT (so we can copy supabase/functions into the image). Build with:
#   docker build -f deploy/cloud-run/Dockerfile -t edge-fn .
# or let `gcloud run deploy --source .` from the repo root do it (point it at this Dockerfile).
#
# The shim (serve-edge-function.ts) imports ./functions/<EDGE_FUNCTION>/index.ts and binds it to
# 0.0.0.0:$PORT. The function code is NEVER edited — only hosted.
FROM denoland/deno:2.1.4

WORKDIR /app

# The entry shim that wraps Deno.serve so $PORT is honored without touching the function.
COPY deploy/cloud-run/serve-edge-function.ts ./serve-edge-function.ts

# The unmodified Supabase functions (including _shared/*). The shim imports ./functions/<name>/index.ts.
COPY supabase/functions ./functions

# Cloud Run injects $PORT (default 8080). The shim reads it; this is just the documented default.
ENV PORT=8080
EXPOSE 8080

# Warm the dependency + remote-module cache at build time so cold starts don't pay the first-fetch
# cost. --entrypoint resolves the import graph (incl. https://esm.sh/@supabase/... and ./functions)
# without executing it. EDGE_FUNCTION can be overridden at deploy time to host a different function.
ENV EDGE_FUNCTION=grade-submission
RUN deno cache serve-edge-function.ts ./functions/${EDGE_FUNCTION}/index.ts || true

# Broad permissions: edge functions read env (Deno.env), make outbound fetches (Supabase REST, Gemini,
# Upstash), and the supabase-js client needs them. --allow-env/--allow-net/--allow-read mirror the
# Supabase edge runtime's effective grants. Tighten per-function later if desired.
CMD ["run", "--allow-env", "--allow-net", "--allow-read", "--allow-sys", "serve-edge-function.ts"]
