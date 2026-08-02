
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/ensureUserProfile';
import type { User, Session } from '@supabase/supabase-js';
import { analytics } from '@/lib/analytics';
import {
  clearPasswordRecoveryIntent,
  getInitialPasswordRecoveryIntent,
  getPasswordResetRedirectUrl,
  rememberPasswordRecoveryIntent,
} from '@/lib/passwordRecovery';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  passwordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  passwordRecovery: false,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  requestPasswordReset: async () => {},
  updatePassword: async () => {},
});

// eslint-disable-next-line react-refresh/only-export-components -- Splitting this established hook would churn every auth consumer; keep the exception local.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(() =>
    getInitialPasswordRecoveryIntent(window.location.href, window.sessionStorage)
  );

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    if (error) throw error;
  };

  // AUTH-02: Continue with Google via Supabase Auth's Google OAuth provider.
  // redirectTo is the running app's origin so Supabase can deliver the session
  // back via the URL on return (detectSessionInUrl is on by default).
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const requestPasswordReset = async (email: string) => {
    const redirectTo = getPasswordResetRedirectUrl(window.location.origin);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    clearPasswordRecoveryIntent(window.sessionStorage);
    setPasswordRecovery(false);
  };

  useEffect(() => {
    // Get initial session. Never log the session object — it contains the access token (C7).
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthProvider: failed to get session');
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'PASSWORD_RECOVERY') {
          rememberPasswordRecoveryIntent(window.sessionStorage);
          setPasswordRecovery(true);
        } else if (event === 'SIGNED_OUT') {
          clearPasswordRecoveryIntent(window.sessionStorage);
          setPasswordRecovery(false);
        } else if (event === 'SIGNED_IN' && window.location.pathname !== '/auth/reset-password') {
          clearPasswordRecoveryIntent(window.sessionStorage);
          setPasswordRecovery(false);
        }

        // AUTH-03: bootstrap the profile basics downstream depends on for BOTH
        // email/password and Google paths. The DB trigger normally creates the
        // `users` row, but OAuth metadata may lack a `name`; this client-side
        // safety net upserts a row (idempotent) so onboarding state always exists.
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          void ensureUserProfile(session.user);
        }

        // Tie product analytics to the teacher; clear identity on sign-out (METRIC-04).
        if (session?.user) {
          analytics.identify(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          analytics.reset();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        passwordRecovery,
        signIn,
        signUp,
        signInWithGoogle,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
