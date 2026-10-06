import { createHash, randomInt } from "node:crypto";

/**
 * Short email verification codes (server only).
 *
 * Supabase's own OTP is 6 to 10 digits and not configurable below that. Auth
 * emails already leave through our send-email hook and Resend, so we mint a
 * shorter code, email that, and keep a mapping to the `token_hash` Supabase
 * issued for the same action. Redeeming the short code returns that
 * token_hash, which the client hands to `verifyOtp` — Supabase still decides
 * whether the email is confirmed and still mints the session.
 */

/** Digits in the code the person receives. */
export const SHORT_OTP_LENGTH = Number(process.env.AUTH_OTP_LENGTH ?? 4);

/**
 * How long a code lives. Short, because a 4-digit code is only 10,000
 * possibilities — the less time it exists, the less there is to attack.
 */
export const SHORT_OTP_TTL_MINUTES = 10;

/**
 * Guesses allowed before the code is burned. The real defence for a 4-digit
 * code: 5 tries against 10,000 values is a 0.05% chance, and a burned code
 * forces the attacker back through email delivery to get another.
 */
export const SHORT_OTP_MAX_ATTEMPTS = 5;

/** Codes a single address may request in the window, to cap burn-and-retry. */
export const SHORT_OTP_MAX_PER_HOUR = 6;

/**
 * Cryptographically uniform digits. `Math.random()` is predictable enough to
 * matter at this length, and `randomInt` avoids the modulo bias a naive
 * `% 10` would introduce.
 */
export function generateShortOtp(length = SHORT_OTP_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += String(randomInt(0, 10));
  return out;
}

/** Codes are stored hashed so plaintext never lands in a backup or a log. */
export function hashShortOtp(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

export function shortOtpExpiry(from = new Date()): string {
  return new Date(from.getTime() + SHORT_OTP_TTL_MINUTES * 60_000).toISOString();
}
