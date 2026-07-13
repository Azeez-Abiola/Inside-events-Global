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
