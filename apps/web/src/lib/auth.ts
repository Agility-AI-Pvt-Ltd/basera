import type { AuthError, Session } from '@supabase/supabase-js';

import { normalizeEmail } from './email';
import { supabase } from './supabase';

const VERIFY_TYPES = ['email', 'signup', 'magiclink', 'recovery'] as const;

function friendlyVerifyError(error: AuthError | null): string {
  if (!error) return 'Could not verify that code.';
  const msg = error.message ?? '';
  const code = (error as AuthError & { code?: string }).code ?? '';

  if (code === 'otp_expired' || /expired|invalid/i.test(msg)) {
    return (
      'That code is invalid or expired. Tap Resend code, then enter the new 6-digit number within a few minutes. ' +
      'Use the email whose subject is “Your Basera sign-in code” — not “Confirm your email address”. ' +
      'Do not click any link in the email before entering the code (Gmail/Outlook preview can invalidate it).'
    );
  }
  if (error.status === 403) {
    return (
      'Verification was rejected (403). Use the newest 6-digit code from the latest email, or tap Send OTP again.'
    );
  }
  return msg || 'Could not verify that code.';
}

/** Matches mobile: try email OTP types used by hosted + local GoTrue. */
export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<{ session: Session | null; error: string | null }> {
  const normalized = normalizeEmail(email);
  const otp = token.replace(/\D/g, '').trim();
  if (otp.length < 6) {
    return { session: null, error: 'Enter the full 6-digit code from your email.' };
  }

  let lastError: AuthError | null = null;
  for (const type of VERIFY_TYPES) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalized,
      token: otp,
      type,
    });
    if (!error && data.session) {
      return { session: data.session, error: null };
    }
    lastError = error;
    if (error && !/expired|invalid|403|otp/i.test(error.message)) {
      break;
    }
  }

  return { session: null, error: friendlyVerifyError(lastError) };
}
