// CORS allowlist (no wildcard). Set ALLOWED_ORIGINS as a comma-separated list, e.g.
//   supabase secrets set ALLOWED_ORIGINS="https://app.aita.example,http://localhost:5173"
import { optionalEnv } from "./env.ts";

function allowedOrigins(): string[] {
  return optionalEnv("ALLOWED_ORIGINS", "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allow = allowedOrigins();
  const allowOrigin = allow.includes(origin) ? origin : allow[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// Handle preflight; returns a Response if this was an OPTIONS request, else null.
export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  return null;
}
