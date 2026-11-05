import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEMO, demoProfile } from '@/lib/demo';
import { supabase } from '@/lib/supabase';
import { teardownTracking } from '@/lib/tracking';
import type { Profile } from '@/lib/types';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, 'display_name' | 'bio' | 'photo'>>) => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);

/** Maps Supabase auth errors to friendly German messages. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'E-Mail oder Passwort stimmt nicht.';
  if (m.includes('email not confirmed')) return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if (m.includes('already registered')) return 'Diese E-Mail ist schon registriert – melde dich an.';
  if (m.includes('password should be')) return 'Das Passwort muss mindestens 6 Zeichen haben.';
  if (m.includes('rate limit')) return 'Zu viele Versuche. Warte kurz und probier es nochmal.';
  if (m.includes('network') || m.includes('fetch')) return 'Keine Verbindung. Prüfe dein Internet.';
  if (m.includes('valid email') || m.includes('invalid email')) return 'Bitte gib eine gültige E-Mail ein.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    DEMO ? ({ user: { id: demoProfile.id, email: demoProfile.email } } as unknown as Session) : null,
  );
  const [profile, setProfile] = useState<Profile | null>(() => (DEMO ? demoProfile : null));
  const [loading, setLoading] = useState(!DEMO);

  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    if (DEMO) return;
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (alive) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Defer DB calls out of the auth callback (avoids a supabase-js deadlock).
      setTimeout(() => loadProfile(s?.user.id), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return authErrorMessage(error.message);
        const uid = (await supabase.auth.getUser()).data.user?.id;
        if (uid) await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', uid);
        return null;
      },
      async signUp(email, password, displayName) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) return authErrorMessage(error.message);
        // Supabase hides existing accounts: no error, but a user without identities.
        if (data.user && (data.user.identities ?? []).length === 0) return 'Diese E-Mail ist schon registriert – melde dich an.';
        if (!data.session) return 'CONFIRM_EMAIL';
        return null;
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        return error ? authErrorMessage(error.message) : null;
      },
      async signOut() {
        await teardownTracking();
        await supabase.auth.signOut();
      },
      async refreshProfile() {
        await loadProfile(session?.user.id);
      },
      async updateProfile(patch) {
        if (!session) return 'Nicht angemeldet';
        const { data, error } = await supabase.from('profiles').update(patch).eq('id', session.user.id).select('*').single();
        if (error) return error.message;
        setProfile(data as Profile);
        return null;
      },
    }),
    [session, profile, loading, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export const isGlobalAdmin = (p: Profile | null) => p?.role === 'global_admin';
export const isAdminLevel = (p: Profile | null) => p?.role === 'admin' || p?.role === 'global_admin';
