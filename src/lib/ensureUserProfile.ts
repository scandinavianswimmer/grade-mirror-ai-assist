import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

/**
 * AUTH-03 — Profile bootstrap safety net.
 *
 * Account creation must capture the profile basics that downstream onboarding +
 * grading depend on: a `users` row keyed by the auth user id, with an initialized
 * `onboarding_complete` flag. The `handle_new_user` Postgres trigger normally does
 * this on first sign-up, but the trigger reads `name` from `raw_user_meta_data`,
 * which Google OAuth populates under `full_name`/`name` (and may omit). This helper
 * mirrors that bootstrap on the client for BOTH email/password and Google paths so
 * the row always exists with a usable display name, regardless of provider.
 *
 * SELECT-first (not blind upsert): for the overwhelmingly common case where the
 * trigger already created the row, we do a read-only existence check and return
 * without issuing any write. A blind `upsert` re-fired an INSERT on every sign-in /
 * INITIAL_SESSION, which RLS rejected with a repeated 403 (the INSERT policy lives
 * in migration 20260522000000 and is only needed on the rare cold-bootstrap path).
 * Reading one's own row is always allowed by the existing self-scoped SELECT policy,
 * so the steady state is now write-free and silent. We only attempt an INSERT when
 * the row is genuinely missing.
 */
export type ProfileBootstrapResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: 'lookup_failed' | 'insert_failed' };

export const ensureUserProfile = async (
  user: User,
): Promise<ProfileBootstrapResult> => {
  // 1. Read-only existence check (self-scoped SELECT policy already permits this).
  const { data: existing, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (lookupError) {
    // A read failure is the genuinely actionable signal (vs. the old swallowed 403 noise).
    console.error('ensureUserProfile: could not read profile row', lookupError.code);
    return { ok: false, reason: 'lookup_failed' };
  }

  // 2. Steady state: row exists (created by the handle_new_user trigger) — no write, no 403.
  if (existing) return { ok: true, created: false };

  // 3. Cold bootstrap only: the row is missing, so create exactly this user's row.
  const metadata = user.user_metadata ?? {};
  const displayName =
    (metadata.name as string | undefined) ??
    (metadata.full_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Teacher';

  const { error: insertError } = await supabase.from('users').insert({
    id: user.id,
    email: user.email ?? '',
    name: displayName,
    full_name: (metadata.full_name as string | undefined) ?? displayName,
    onboarding_complete: false,
  });

  if (insertError) {
    // Don't block sign-in — the DB trigger is the primary path and may win a race.
    // Surface a specific, actionable reason without leaking the session/token (C7).
    console.error('ensureUserProfile: profile bootstrap insert failed', insertError.code);
    return { ok: false, reason: 'insert_failed' };
  }

  return { ok: true, created: true };
};
