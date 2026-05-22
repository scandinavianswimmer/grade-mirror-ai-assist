// Typed, fail-fast access to Edge Function secrets.
// Set via: supabase secrets set KEY=value  (never commit these).
export function requireEnv(key: string): string {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export function optionalEnv(key: string, fallback = ""): string {
  return Deno.env.get(key) ?? fallback;
}

export const ENV = {
  supabaseUrl: () => requireEnv("SUPABASE_URL"),
  anonKey: () => requireEnv("SUPABASE_ANON_KEY"),
  serviceRoleKey: () => requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  geminiKey: () => requireEnv("GEMINI_API_KEY"),
  // Shared secret that gates service-role/cron-only functions (privacy-tasks).
  cronSecret: () => requireEnv("CRON_SECRET"),
};
