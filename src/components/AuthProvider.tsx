
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/ensureUserProfile';
import type { User, Session } from '@supabase/supabase-js';
import { analytics } from '@/lib/analytics';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
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
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
