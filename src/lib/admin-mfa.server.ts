/**
 * Admin sign-in must use two-factor authentication (TAB 12 §12.4). High
 * impact admin actions check the session's assurance level server-side, so
 * a stolen single-factor session can't perform them. Set
 * ADMIN_MFA_REQUIRED=false only as a temporary escape hatch.
 */
export function assertAdminMfa(claims: unknown) {
  if (process.env.ADMIN_MFA_REQUIRED === "false") return;
  const aal = (claims as { aal?: string } | null)?.aal;
  if (aal !== "aal2") {
    throw new Error(
      "Two-factor sign-in is required for this admin action. Complete the 2FA step and try again.",
    );
  }
}
