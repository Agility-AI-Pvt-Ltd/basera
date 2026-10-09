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
    const otp = token.replace(/\D/g, '').trim();
    const types = ['email', 'signup', 'magiclink', 'recovery'] as const;
    let lastError: Error | null = null;
    for (const type of types) {
      const result = await supabase.auth.verifyOtp({
        email: normalized,
        token: otp,
        type,
      });
      if (!result.error && result.data.session) {
        return result.data.session;
      }
      lastError = result.error;
    }
    if (lastError) throw lastError;
    throw new Error('Could not verify that code.');
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
