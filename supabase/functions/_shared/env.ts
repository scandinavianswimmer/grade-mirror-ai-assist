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
  // Billing (Phase 12 / Stripe). Set via: supabase secrets set STRIPE_SECRET_KEY=... etc.
  stripeSecretKey: () => requireEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => requireEnv("STRIPE_WEBHOOK_SECRET"),
  // Map app plan -> Stripe Price ID. Configure per-plan price IDs as secrets (never hardcode).
  stripePriceId: (plan: string) =>
    requireEnv(`STRIPE_PRICE_${plan.toUpperCase()}`),
  // Where Stripe sends the teacher back after Checkout / the Customer Portal. e.g.
  //   https://app.aita.example  (no trailing slash). Defaults to localhost for dev.
  appUrl: () => optionalEnv("APP_URL", "http://localhost:5173"),
};
