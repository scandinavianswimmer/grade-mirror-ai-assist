-- Phase 6 (AUTH-03): make the new-user profile bootstrap robust for OAuth sign-ups.
--
-- The existing handle_new_user() trigger fires AFTER INSERT on auth.users for every
-- new account, including Google OAuth users. However it read the display name only
-- from raw_user_meta_data->>'name', which Google populates under 'full_name' (or
-- 'name'), and the email/password path sets 'name'. This hardens the function to:
--   * derive a usable name from name -> full_name -> email local-part,
--   * also populate the users.full_name column,
--   * default onboarding_complete to false so onboarding gating works,
--   * be idempotent (ON CONFLICT DO NOTHING) so re-runs / races never error.
--
-- Additive + idempotent only. No data is dropped. Provider OAuth client id/secret
-- and redirect URLs are configured in the Supabase dashboard, never here.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    resolved_name TEXT;
BEGIN
    resolved_name := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        split_part(COALESCE(NEW.email, 'teacher'), '@', 1)
    );

    -- Insert user profile (idempotent: trigger may co-exist with a client-side upsert)
    INSERT INTO public.users (id, email, name, full_name, role, onboarding_complete)
    VALUES (NEW.id, NEW.email, resolved_name, resolved_name, 'teacher', FALSE)
    ON CONFLICT (id) DO NOTHING;

    -- Default privacy settings (idempotent)
    INSERT INTO public.privacy_settings (user_id, anonymize_student_names, allow_training_on_content, auto_delete_training_data)
    VALUES (NEW.id, TRUE, TRUE, TRUE)
    ON CONFLICT (user_id) DO NOTHING;

    -- Personal storage bucket (idempotent)
    INSERT INTO storage.buckets (id, name, public)
    VALUES (
        'user-' || NEW.id::text,
        'user-' || NEW.id::text,
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Ensure the trigger exists and points at the updated function.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow a signed-in user to insert their OWN profile row. The SECURITY DEFINER
-- trigger above is the primary path, but the client-side ensureUserProfile safety
-- net (src/lib/ensureUserProfile.ts) runs as the authed user and needs this so the
-- OAuth profile bootstrap is never blocked by RLS. Self-scoped: auth.uid() = id.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users'
          AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON public.users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END
$$;
