import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getActorProfile } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { notifyAdmins } from "@/lib/admin-notify";

/**
 * Dual control (TAB 6 §6.9): suspending an account, Act as User, approving
 * a match involving a Managed Service client, and erasing a person's data
 * only take effect once a second Super Admin signs off.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- governance tables postdate the generated types.
const ddb = (): any => supabaseAdmin as any;

export type DualAction = "act_as_user" | "suspend_user" | "approve_match" | "erase_user";

export const DUAL_ACTION_LABEL: Record<DualAction, string> = {
  act_as_user: "Act as User",
  suspend_user: "Suspend account",
  approve_match: "Approve Managed Service match",
  erase_user: "Erase personal data",
};

export async function openDualControl(input: {
  action: DualAction;
  targetUserId: string;
  requestedBy: string;
  reason: string;
  payload?: Record<string, unknown>;
}): Promise<string> {
  const { data: open } = await ddb()
    .from("dual_control_requests")
    .select("id")
    .eq("action", input.action)
    .eq("target_user_id", input.targetUserId)
    .eq("status", "pending")
    .contains("payload", input.payload ?? {})
    .maybeSingle();
  if (open) throw new Error("There is already a request waiting for a second Super Admin.");
  const { data: row, error } = await ddb()
    .from("dual_control_requests")
    .insert({
      action: input.action,
      target_user_id: input.targetUserId,
      requested_by: input.requestedBy,
      reason: input.reason,
      payload: input.payload ?? {},
    })
    .select("id")
    .single();
  if (error)
    throw new Error(
      /relation|does not exist/.test(error.message)
        ? "Dual control isn't switched on yet. Apply the latest migrations."
        : error.message,
    );
  const actor = await getActorProfile(input.requestedBy);
  const label = DUAL_ACTION_LABEL[input.action];
  await recordAdminAudit({
    actorId: input.requestedBy,
    actorEmail: actor?.email,
    action: "dual_control_requested",
    summary: `Requested ${label}: ${input.reason}`,
    resourceType: "user",
    resourceId: input.targetUserId,
    metadata: { request_id: row.id, action: input.action, dual_control: true },
  }).catch(() => {});
  await notifyAdmins({
    type: "dual_control_requested",
    title: `${label} needs a second Super Admin`,
    body: `${actor?.display_name ?? actor?.email ?? "An admin"} asked to ${label.toLowerCase()}. Reason: ${input.reason}`,
    data: { request_id: row.id, link: "/dashboard/users" },
  }).catch(() => {});
  return row.id as string;
}

/** A Managed Service client: flagged by Admin, or an event handed to ABW to manage (TAB 20). */
export async function involvesManagedServiceClient(userIds: string[]): Promise<boolean> {
  const ids = userIds.filter(Boolean);
  if (!ids.length) return false;
  const [{ data: flagged }, { data: managed }] = await Promise.all([
    ddb().from("profiles").select("id").in("id", ids).eq("managed_service_client", true),
    ddb()
      .from("events")
      .select("id")
      .in("organiser_id", ids)
      .eq("abw_management_requested", true)
      .limit(1),
  ]);
  return !!(flagged ?? []).length || !!(managed ?? []).length;
}
