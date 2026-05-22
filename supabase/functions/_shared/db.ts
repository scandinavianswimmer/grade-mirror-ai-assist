// Supabase clients for Edge Functions.
// - userClient(req): forwards the caller's JWT so all queries respect RLS.
// - adminClient(): service-role, bypasses RLS — use ONLY for vetted server-only writes
//   (ai logs, model health, audit, lms_credentials, privilege-column mutations).
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { ENV } from "./env.ts";

export function userClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(ENV.supabaseUrl(), ENV.anonKey(), {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}

let _admin: SupabaseClient | null = null;
export function adminClient(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(ENV.supabaseUrl(), ENV.serviceRoleKey(), {
      auth: { persistSession: false },
    });
  }
  return _admin;
}
