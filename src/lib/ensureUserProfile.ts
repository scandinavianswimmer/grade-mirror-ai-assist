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
 * It is idempotent: a no-op overwrite (`ignoreDuplicates`) for existing rows so we
 * never clobber onboarding progress or a name the teacher already set.
 */
export const ensureUserProfile = async (user: User): Promise<void> => {
  // Prefer an explicit metadata name, then Google's full_name, then the email local-part.
  const metadata = user.user_metadata ?? {};
  const displayName =
    (metadata.name as string | undefined) ??
    (metadata.full_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Teacher';

  const { error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
        name: displayName,
        full_name: (metadata.full_name as string | undefined) ?? displayName,
        onboarding_complete: false,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

  if (error) {
    // Don't block sign-in on a bootstrap hiccup — the DB trigger is the primary
    // path. Surface server-side context without leaking the session/token (C7).
    console.error('ensureUserProfile: failed to upsert users row');
  }
};
