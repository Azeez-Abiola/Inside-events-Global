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
 * Supabase email OTP length is a per-project setting, so the input accepts a
 * range rather than assuming one. Hardcoding the maximum meant the field
 * showed eight boxes and only submitted at eight — a shorter real code could
 * never be entered, which looks exactly like "the code does not work".
 *
 * Set VITE_AUTH_OTP_LENGTH to the project's configured length to render that
 * many boxes; the range still governs what is accepted.
 */
export const AUTH_EMAIL_OTP_MIN = 4;
export const AUTH_EMAIL_OTP_MAX = 8;

/** How many boxes to draw. Defaults to Supabase's own default of 6. */
export const AUTH_EMAIL_OTP_LENGTH = (() => {
  const raw =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_AUTH_OTP_LENGTH as string | undefined)
      : undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= AUTH_EMAIL_OTP_MIN && n <= AUTH_EMAIL_OTP_MAX ? n : 6;
})();

export function normalizeEmailOtp(input: string): string {
  return input.replace(/\D/g, "");
}

export function isValidEmailOtp(code: string): boolean {
  const digits = normalizeEmailOtp(code);
  return digits.length >= AUTH_EMAIL_OTP_MIN && digits.length <= AUTH_EMAIL_OTP_MAX;
}
