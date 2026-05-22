# Phase 6 — Auth & Account Creation (notes)

Branch: `phase-6-auth`. Requirements: AUTH-01 (existing), AUTH-02 (Google), AUTH-03 (profile bootstrap).

## What was built

### AUTH-01 — email/password (confirmed, unchanged)
Existing flow in `AuthProvider` (`signIn` / `signUp` via `supabase.auth`) and the
`Auth.tsx` page / `LoginOverlay.tsx` overlay was left intact. No behavior change.

### AUTH-02 — Continue with Google
- `src/components/AuthProvider.tsx`: added `signInWithGoogle()` to the auth context.
  It calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })`.
- `src/pages/Auth.tsx` and `src/components/LoginOverlay.tsx`: added a "Continue with
  Google" button (shadcn `Button variant="outline"`) above the email form, with an
  "or" divider, matching each surface's styling (Marginalia on Auth.tsx, the blue/
  white frosted card on LoginOverlay.tsx).
- `src/components/icons/GoogleIcon.tsx`: shared 4-color Google "G" SVG (lucide ships
  no brand icons) used by both buttons.
- OAuth return handling:
  - `src/pages/AuthCallback.tsx`: lightweight landing page at `/auth/callback`. The
    Supabase client uses `detectSessionInUrl` (on by default) so the session is parsed
    from the return URL automatically; `AuthProvider.onAuthStateChange` then surfaces
    it. The page waits for the session and navigates to `/` (or `/auth` if none).
  - `src/App.tsx`: added a lazy import + an early `location.pathname === '/auth/callback'`
    branch (before the login-overlay check, mirroring the `/pitch` special case) so the
    overlay never flashes during the OAuth round-trip, plus a `/auth/callback` route in
    the authed `<Routes>`.

### AUTH-03 — profile bootstrap for BOTH paths
The primary path is the existing Postgres trigger `handle_new_user` (AFTER INSERT on
`auth.users`) which creates the `public.users` row + `privacy_settings` + personal
storage bucket. It fires for OAuth users too, but it only read the display name from
`raw_user_meta_data->>'name'` (Google supplies `full_name`), and there was no INSERT
RLS policy / `onboarding_complete` default. Two changes make it robust:

1. `supabase/migrations/20260522000000_oauth_profile_bootstrap.sql` (additive,
   idempotent): hardens `handle_new_user()` to resolve the name as
   `name -> full_name -> email local-part`, also populate `users.full_name`, default
   `onboarding_complete = false`, and use `ON CONFLICT DO NOTHING` on all three inserts.
   Adds a self-scoped `INSERT` RLS policy on `public.users` (`auth.uid() = id`).
2. `src/lib/ensureUserProfile.ts` + a hook in `AuthProvider.onAuthStateChange`
   (`SIGNED_IN` / `INITIAL_SESSION`): client-side **safety net** that upserts the
   `users` row (idempotent, `ignoreDuplicates: true`) so onboarding state always
   exists even if the trigger lags or metadata lacks a name. Failures are logged, not
   thrown — sign-in never blocks on it.

## REQUIRED Supabase dashboard config (user's hands — NOT in code)

To actually enable Google sign-in for project `yhdobsmmhdvqswjpousc`:

1. **Google Cloud Console** → APIs & Services → Credentials → create an *OAuth 2.0
   Client ID* (type: Web application). Configure the OAuth consent screen first if
   prompted. Under **Authorized redirect URIs** add:
   `https://yhdobsmmhdvqswjpousc.supabase.co/auth/v1/callback`
   Copy the generated **Client ID** and **Client secret**.
2. **Supabase Dashboard** → Authentication → Providers → **Google**: toggle
   **Enabled**, paste the **Client ID** and **Client secret** from step 1, Save.
3. **Supabase Dashboard** → Authentication → URL Configuration:
   - Set **Site URL** to the deployed app origin (e.g. `https://app.example.com`;
     for local dev `http://localhost:5173` or `http://localhost:8080` per `vite.config.ts`).
   - Under **Redirect URLs** add the app callback(s) used by `redirectTo`:
     `<app-origin>/auth/callback` for each environment (local + production).
4. Apply the new migration `20260522000000_oauth_profile_bootstrap.sql` to cloud
   (per the project's go-live runbook / DB-password step — deploys are the user's hands;
   I did NOT run any deploy/push).

> Note: the in-code `redirectTo` is `${window.location.origin}/auth/callback`. The
> Google Cloud "authorized redirect URI" is the **Supabase** callback
> (`.../auth/v1/callback`), while the Supabase "Redirect URLs" allowlist must contain
> the **app** callback (`<origin>/auth/callback`). Both are required.

## New dependencies
None. `@supabase/supabase-js` (already present) provides `signInWithOAuth`; the Google
icon is an inline SVG. `package.json` was not modified — nothing to install.

## Integration follow-ups
- Phase 7 (Onboarding) consumes the bootstrapped `users` row + `onboarding_complete`;
  Google users land in onboarding with `onboarding_complete = false` (handled by the
  existing `App.tsx` gating). No extra work needed there.
- The client `ensureUserProfile` upsert relies on the new `users` INSERT RLS policy
  shipped in the same migration — apply the migration before relying on the OAuth path.
- Could not run `tsc`/lint (node_modules absent in this worktree, per constraints);
  code follows existing conventions.
