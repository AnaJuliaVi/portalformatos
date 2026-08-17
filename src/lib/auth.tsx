import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type PortalRole, type PortalUser } from '@/lib/supabase';
import { fetchPortalUserByEmail } from '@/lib/data';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  email: string | null;
  role: PortalRole | null;
  isAdmin: boolean;
  loading: boolean;
  profile: PortalUser | null;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<PortalRole | null>(null);
  const [profile, setProfile] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (userEmail: string | undefined) => {
    if (!userEmail) {
      setRole(null);
      setProfile(null);
      return;
    }
    const data = await fetchPortalUserByEmail(userEmail);
    if (!data) {
      setRole(null);
      setProfile(null);
      return;
    }
    if (data.status === 'inactive') {
      setRole(null);
      setProfile(null);
      return;
    }
    setRole(data.role as PortalRole);
    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.email) {
        fetchRole(data.session.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
        setProfile(null);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.email) {
        fetchRole(newSession.user.email);
      } else {
        setRole(null);
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchRole]);

  const signInWithEmail = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      const normalizedEmail = email.trim().toLowerCase();

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-login`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!response.ok) {
        try {
          const body = await response.json();
          return { error: body.error ?? "Não foi possível acessar o portal." };
        } catch {
          return { error: "Não foi possível acessar o portal. Tente novamente." };
        }
      }

      const body = await response.json();
      if (!body.session) {
        return { error: "Não foi possível acessar o portal. Tente novamente." };
      }

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: body.session.access_token,
        refresh_token: body.session.refresh_token,
      });

      if (setSessionError) {
        return { error: "Não foi possível acessar o portal. Tente novamente." };
      }

      setRole(body.role as PortalRole);
      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
    setProfile(null);
  }, []);

  const email = session?.user?.email ?? null;
  const isAdmin = role === 'admin';

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    email,
    role,
    isAdmin,
    loading,
    profile,
    signInWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
