/**
 * Multi-role accounts: one account can hold several signup roles (Sponsor +
 * Organiser + Creative Hub, say). The dashboard shows one role at a time —
 * the "active role" — and the sidebar switcher changes it.
 *
 * Shared by client and server, so nothing here may import either side's
 * Supabase client.
 */
import { isSignupRole, type SignupRole } from "@/lib/signup-roles";

/** Default order when the account has never picked a dashboard. */
export const ROLE_PRIORITY: SignupRole[] = [
  "organiser",
  "sponsor",
  "referral_partner",
  "media_partner",
  "partnerships_pro",
  "creative_hub",
];

/** The signup roles in `roles`, in priority order (admin roles dropped). */
export function heldSignupRoles(roles: readonly string[]): SignupRole[] {
  return ROLE_PRIORITY.filter((r) => roles.includes(r));
}

/**
 * The role whose dashboard to show: the preferred one when the account
 * actually holds it, otherwise the first held role by priority.
 */
export function pickActiveRole(
  roles: readonly string[],
  preferred?: string | null,
): SignupRole | null {
  const held = heldSignupRoles(roles);
  if (preferred && isSignupRole(preferred) && held.includes(preferred)) return preferred;
  return held[0] ?? null;
}
