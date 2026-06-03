import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/components/AuthProvider'
import { Feather } from 'lucide-react'

/**
 * AUTH-02 — OAuth return landing.
 *
 * Supabase's client is configured with detectSessionInUrl (on by default), so the
 * provider's redirect back to `${origin}/auth/callback` is parsed automatically and
 * the session is established. This page just waits for AuthProvider to surface that
 * session, then sends the teacher into the app (where onboarding gating takes over).
 * Profile bootstrap (the `users` row) is handled in AuthProvider's auth listener.
 */
const AuthCallback = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    // Once the session resolves, leave the callback URL. Authed -> app home;
    // if no session arrived (e.g. the user cancelled), fall back to /auth.
    navigate(user ? '/' : '/auth', { replace: true })
  }, [user, loading, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Feather className="h-5 w-5" />
      </span>
      <p className="text-sm">Completing sign-in…</p>
    </div>
  )
}

export default AuthCallback
