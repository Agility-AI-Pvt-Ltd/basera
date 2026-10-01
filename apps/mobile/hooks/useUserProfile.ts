import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import {
  EMPTY_PROFILE,
  getSignupHref,
  getSignupRoute,
  hasCompletedBasics,
  profileToRow,
  rowToProfile,
  UserProfile,
  type ProfileRow,
} from '@/types/profile';

function isClockSkewError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST303' ||
    (error.message?.toLowerCase().includes('jwt issued at future') ?? false)
  );
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToProfile(data as ProfileRow);
}

export function useUserProfile() {
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const loadForSession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUserId(null);
      setProfile(null);
      setIsReady(true);
      return null;
    }

    setUserId(session.user.id);
    try {
      const next = await fetchProfile(session.user.id);
      setProfile(next ?? { ...EMPTY_PROFILE });
      return next;
    } catch (err) {
      const error = err as { code?: string; message?: string; details?: string };
      // Stale JWT after Docker clock drift — clear session so user can sign in again
      if (isClockSkewError(error)) {
        await supabase.auth.signOut();
        setUserId(null);
        setProfile(null);
        return null;
      }
      const detail = [error?.message, error?.details, error?.code].filter(Boolean).join(' | ');
      console.warn(`Failed to load profile: ${detail || String(err)}`);
      setProfile({ ...EMPTY_PROFILE });
      return { ...EMPTY_PROFILE };
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sessionUserIdRef = { current: null as string | null };

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      sessionUserIdRef.current = data.session?.user?.id ?? null;
      void loadForSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      const nextUserId = session?.user?.id ?? null;
      const userChanged = sessionUserIdRef.current !== nextUserId;
      sessionUserIdRef.current = nextUserId;

      // Token refresh on app resume must not unmount navigation (shows Home again).
      if (event === 'TOKEN_REFRESHED' && !userChanged) {
        void loadForSession(session);
        return;
      }

      if (userChanged) {
        setIsReady(false);
      }
      void loadForSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadForSession]);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return loadForSession(session);
  }, [loadForSession]);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!userId) throw new Error('Not authenticated');

      const next: UserProfile = {
        ...(profile ?? EMPTY_PROFILE),
        ...patch,
      };

      const { error } = await supabase
        .from('profiles')
        .update(profileToRow(next))
        .eq('id', userId);

      if (error) throw error;
      setProfile(next);
      return next;
    },
    [profile, userId],
  );

  const resetProfile = useCallback(async () => {
    if (!userId) return;

    const cleared: UserProfile = { ...EMPTY_PROFILE };
    const { error } = await supabase
      .from('profiles')
      .update(profileToRow(cleared))
      .eq('id', userId);

    if (error) throw error;
    setProfile(cleared);
  }, [userId]);

  const signupRoute = getSignupRoute(profile);
  const signupHref = getSignupHref(profile);
  const isSignupComplete = profile?.signupComplete === true;
  const basicsDone = profile ? hasCompletedBasics(profile) : false;

  return {
    isReady,
    profile,
    updateProfile,
    resetProfile,
    refreshProfile,
    signupHref,
    signupRoute,
    isSignupComplete,
    basicsDone,
  };
}
