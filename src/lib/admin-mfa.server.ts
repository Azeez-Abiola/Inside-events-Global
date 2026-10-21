/**
 * Admin two-factor sign-in (TAB 12 §12.4). Switched off for now at the
 * product owner's request; set ADMIN_MFA_REQUIRED=true (with
 * VITE_ADMIN_MFA_REQUIRED=true) to turn it back on. When on, high-impact
 * admin actions check the session's assurance level server-side, so a stolen
 * single-factor session can't perform them.
 */
export function assertAdminMfa(claims: unknown) {
  if (process.env.ADMIN_MFA_REQUIRED !== "true") return;
  const aal = (claims as { aal?: string } | null)?.aal;
  if (aal !== "aal2") {
    throw new Error(
      "Two-factor sign-in is required for this admin action. Complete the 2FA step and try again.",
    );
  }
}
