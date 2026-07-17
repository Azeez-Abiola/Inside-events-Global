/** Platform admin roles */
export type PlatformAdminRole = "abw_admin" | "super_admin";

export type AdminPermission =
  | "dashboard"
  | "vetting"
  | "waitlist"
  | "contact"
  | "media_requests"
  | "revenue"
  | "partners"
  | "analytics"
  | "users_view"
  | "users_suspend"
  | "newsletter_draft"
  | "newsletter_send"
  | "controls"
  | "team_manage"
  | "audit_log";

/** Sub-admins (abw_admin) — operational access only */
export const SUB_ADMIN_PERMISSIONS: AdminPermission[] = [
  "dashboard",
  "vetting",
  "waitlist",
  "contact",
  "media_requests",
  "revenue",
  "partners",
  "analytics",
  "users_view",
  "newsletter_draft",
];

/** Super admin only — sensitive platform controls */
export const SUPER_ADMIN_ONLY_PERMISSIONS: AdminPermission[] = [
  "users_suspend",
  "newsletter_send",
  "controls",
  "team_manage",
  "audit_log",
];

export const ADMIN_ROUTE_PERMISSIONS: Record<string, AdminPermission> = {
  "/dashboard": "dashboard",
  "/dashboard/vetting": "vetting",
  "/dashboard/waitlist": "waitlist",
  "/dashboard/submissions": "contact",
  "/dashboard/media-requests": "media_requests",
  "/dashboard/revenue": "revenue",
  "/dashboard/partners": "partners",
  "/dashboard/analytics": "analytics",
  "/dashboard/users": "users_view",
  "/dashboard/newsletter": "newsletter_draft",
  "/dashboard/controls": "controls",
  "/dashboard/team": "team_manage",
  "/dashboard/audit": "audit_log",
};

export function isSuperAdmin(roles: string[]): boolean {
  return roles.includes("super_admin");
}

export function isSubAdmin(roles: string[]): boolean {
  return roles.includes("abw_admin") && !isSuperAdmin(roles);
}

export function isPlatformAdmin(roles: string[]): boolean {
  return isSuperAdmin(roles) || isSubAdmin(roles);
}

export function hasAdminPermission(roles: string[], permission: AdminPermission): boolean {
  if (isSuperAdmin(roles)) return true;
  if (!isSubAdmin(roles)) return false;
  return SUB_ADMIN_PERMISSIONS.includes(permission);
}

export function canAccessAdminRoute(roles: string[], pathname: string): boolean {
  const permission = ADMIN_ROUTE_PERMISSIONS[pathname];
  if (!permission) return isPlatformAdmin(roles);
  return hasAdminPermission(roles, permission);
}

/** Human-readable permission audit for super admins */
export const ADMIN_PERMISSION_AUDIT = {
  sub_admin_can: [
    "View dashboard overview and analytics",
    "Review and update event vetting queue (approve, reject, request revisions)",
    "Manage waitlist signups (invite, reject)",
    "View and reply to contact messages and account complaints",
    "Review media partner requests",
    "View and update revenue & deals pipeline (status, assignments, payment links)",
    "View referral partners and commission summaries",
    "View platform users (read-only — cannot deactivate accounts)",
    "Create and save newsletter drafts",
  ],
  super_admin_only: [
    "Invite and manage sub-admin accounts",
    "View full audit log (logins and all admin actions)",
    "Deactivate or reactivate user accounts",
    "Send or resend newsletter campaigns",
    "Fraud flags, commission rates, and FX rate controls",
    "Delete events from the platform",
    "Receive in-app alerts when sub-admins perform vital actions",
  ],
} as const;
