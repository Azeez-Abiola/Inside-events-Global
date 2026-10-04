/**
 * Text-limit helpers for the onboarding wizard (TAB 3 §3.9).
 *
 * "Text length limits (tagline ≤150 chars, description ≤500 words) enforced
 *  with a live counter, blocked at the limit."
 */

/** Words as a person counts them, not as `split` does on a trailing space. */
export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export const TAGLINE_MAX_CHARS = 150;
export const DESCRIPTION_MAX_WORDS = 500;
