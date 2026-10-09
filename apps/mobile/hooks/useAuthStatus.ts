import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { normalizeEmail } from '@/utils/email';

export function useAuthStatus() {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizeEmail(email),
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const normalized = normalizeEmail(email);
    // Local GoTrue often sends recovery mail for signInWithOtp; try both types.
    let result = await supabase.auth.verifyOtp({
      email: normalized,
      token,
      type: 'email',
    });
    if (result.error) {
      result = await supabase.auth.verifyOtp({
        email: normalized,
        token,
        type: 'recovery',
      });
    }
    if (result.error) throw result.error;
    return result.data.session;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    setSession(null);
  }, []);

  const email = session?.user.email?.trim().toLowerCase() ?? '';

  return {
    isReady,
    isAuthenticated: session !== null,
    session,
    email,
    sendOtp,
    verifyOtp,
    signOut,
  };
}
