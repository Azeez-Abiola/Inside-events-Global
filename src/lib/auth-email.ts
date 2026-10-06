import type { User } from "@supabase/supabase-js";

/** True when Supabase has verified the user's email address. */
export function isEmailConfirmed(user: User | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at);
}

export function isEmailNotConfirmedError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("email not confirmed") || lower.includes("email address not confirmed");
}

/**
 * Accepted length range for a typed verification code.
 *
 * The lower bound is the short code we now issue ourselves; the upper bound
 * covers Supabase's own 6-to-10 digit tokens, which still arrive for any flow
 * we have not shortened and for codes minted before this change.
 */
export const AUTH_EMAIL_OTP_MIN = 4;
export const AUTH_EMAIL_OTP_MAX = 10;

/**
 * How many boxes to draw, and the number the copy promises.
 *
 * Signup codes are minted by the send-email hook (see email/short-otp.ts), so
 * this is our number to choose rather than Supabase's — it has to match
 * SHORT_OTP_LENGTH on the server. Keep VITE_AUTH_OTP_LENGTH and the server's
 * AUTH_OTP_LENGTH in step if either moves: too few boxes and a correct code
 * cannot be typed at all, too many and the field asks for digits nobody was
 * sent.
 */
export const AUTH_EMAIL_OTP_LENGTH = (() => {
  const raw =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_AUTH_OTP_LENGTH as string | undefined)
      : undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= AUTH_EMAIL_OTP_MIN && n <= AUTH_EMAIL_OTP_MAX ? n : 4;
})();

export function normalizeEmailOtp(input: string): string {
  return input.replace(/\D/g, "");
}

export function isValidEmailOtp(code: string): boolean {
  const digits = normalizeEmailOtp(code);
  return digits.length >= AUTH_EMAIL_OTP_MIN && digits.length <= AUTH_EMAIL_OTP_MAX;
}
