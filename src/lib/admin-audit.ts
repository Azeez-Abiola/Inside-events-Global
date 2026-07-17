import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isSubAdmin, isSuperAdmin } from "@/lib/admin-permissions";

export type AdminAuditAction =
  | "admin_login"
  | "admin_invited"
  | "user_suspended"
  | "user_reactivated"
  | "event_vetting_updated"
  | "event_deleted"
  | "newsletter_sent"
  | "commission_rates_updated"
  | "fx_rates_updated"
  | "fraud_flag_updated"
  | "complaint_reply_sent"
  | "waitlist_invited"
  | "waitlist_rejected";

const VITAL_ACTIONS = new Set<AdminAuditAction>([
  "admin_login",
  "admin_invited",
  "user_suspended",
  "user_reactivated",
  "event_vetting_updated",
  "event_deleted",
  "newsletter_sent",
  "commission_rates_updated",
  "fx_rates_updated",
  "fraud_flag_updated",
  "complaint_reply_sent",
]);

export async function getActorAdminRole(userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  if (isSuperAdmin(roles)) return "super_admin";
  if (roles.includes("abw_admin")) return "abw_admin";
  return "unknown";
}

export async function recordAdminAudit(input: {
  actorId: string;
  actorEmail?: string | null;
  action: AdminAuditAction;
  summary: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  const actorRole = await getActorAdminRole(input.actorId);
  if (actorRole !== "abw_admin" && actorRole !== "super_admin") return;

  await supabaseAdmin.from("admin_audit_log" as never).insert({
    actor_id: input.actorId,
    actor_email: input.actorEmail ?? null,
    actor_role: actorRole,
    action: input.action,
    resource_type: input.resourceType ?? null,
    resource_id: input.resourceId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
  } as never);
}

export async function notifySuperAdminsVital(input: {
  actorId: string;
  action: AdminAuditAction;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  if (!VITAL_ACTIONS.has(input.action)) return;

  const actorRole = await getActorAdminRole(input.actorId);
  // Notify super admins when a sub-admin performs a vital action, or always for invites/suspensions
  const alwaysNotify = ["admin_invited", "user_suspended", "user_reactivated"].includes(input.action);
  if (!alwaysNotify && !isSubAdmin([actorRole])) return;

  const { data: supers } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "super_admin");

  const recipients = (supers ?? []).filter((s) => s.user_id !== input.actorId);
  if (!recipients.length) return;

  await supabaseAdmin.from("notifications").insert(
    recipients.map((s) => ({
      user_id: s.user_id,
      type: "admin_audit",
      title: input.title,
      body: input.body,
      data: { action: input.action, ...(input.data ?? {}) },
    })),
  );
}

export async function auditAdminAction(input: {
  actorId: string;
  actorEmail?: string | null;
  action: AdminAuditAction;
  summary: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  notifyTitle?: string;
  notifyBody?: string;
}) {
  await recordAdminAudit(input);
  if (input.notifyTitle && input.notifyBody) {
    await notifySuperAdminsVital({
      actorId: input.actorId,
      action: input.action,
      title: input.notifyTitle,
      body: input.notifyBody,
      data: { resource_type: input.resourceType, resource_id: input.resourceId },
    });
  }
}
