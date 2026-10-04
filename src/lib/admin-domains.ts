/**
 * Admin accounts are limited to ABW and IGE company domains
 * (TAB 2 §2.1, TAB 12 §12.4).
 *
 * "IGE Admin accounts can only be created with an ABW email
 *  (@alexboyoworld.com) or an IGE email (@insideglobalevents.com). Any other
 *  address is rejected at the Admin access-request step."
 *
 * Override with VITE_ADMIN_EMAIL_DOMAINS (comma-separated) only for a staging
 * environment — never to widen the list in production.
 */

const DEFAULT_ADMIN_DOMAINS = ["alexboyoworld.com", "insideglobalevents.com"];

function configured(): string[] {
  const raw =
    (typeof process !== "undefined" ? process.env?.ADMIN_EMAIL_DOMAINS : undefined) ??
    (typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_ADMIN_EMAIL_DOMAINS as string | undefined)
      : undefined);
  if (!raw) return DEFAULT_ADMIN_DOMAINS;
  const parsed = raw
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_ADMIN_DOMAINS;
}

export const ADMIN_EMAIL_DOMAINS = configured();

export function isAdminEmailDomain(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();
  // Subdomains count: mail.alexboyoworld.com is still ABW.
  return ADMIN_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/** Throws with copy fit to show the person who typed the address. */
export function assertAdminEmailDomain(email: string) {
  if (isAdminEmailDomain(email)) return;
  const list = ADMIN_EMAIL_DOMAINS.map((d) => `@${d}`).join(" or ");
  throw new Error(`Admin accounts must use a company email address (${list}).`);
}
