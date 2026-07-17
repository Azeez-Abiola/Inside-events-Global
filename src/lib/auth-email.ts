import type { User } from '@supabase/supabase-js'

/** True when Supabase has verified the user's email address. */
export function isEmailConfirmed(user: User | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at)
}

export function isEmailNotConfirmedError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('email not confirmed') ||
    lower.includes('email address not confirmed')
  )
}

/** Supabase email OTP length varies by project (often 6 or 8). */
export const AUTH_EMAIL_OTP_MIN = 6
export const AUTH_EMAIL_OTP_MAX = 8

export function normalizeEmailOtp(input: string): string {
  return input.replace(/\D/g, '')
}

export function isValidEmailOtp(code: string): boolean {
  const digits = normalizeEmailOtp(code)
  return digits.length >= AUTH_EMAIL_OTP_MIN && digits.length <= AUTH_EMAIL_OTP_MAX
}
