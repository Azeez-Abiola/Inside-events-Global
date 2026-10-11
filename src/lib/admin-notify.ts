import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { openInboxThread } from "@/lib/admin-inbox.server";

export async function notifyAdmins(input: {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const { data: admins } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .in("role", ["abw_admin", "super_admin"]);
  if (!admins?.length) return;

  await supabaseAdmin.from("notifications").insert(
    admins.map((a) => ({
      user_id: a.user_id,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    })),
  );

  // TAB 6 §6.10: everything Admin is told about also lands in the one Admin
  // Inbox. Notices that need no reply (a reset link went out) arrive resolved
  // so they are on record without crowding the open queue.
  const userId = typeof input.data?.user_id === "string" ? input.data.user_id : null;
  await openInboxThread({
    source: INBOX_SOURCE[input.type] ?? "system",
    subject: input.title,
    body: input.body,
    userId,
    payload: { notification_type: input.type, ...(input.data ?? {}) },
    startResolved: NO_REPLY_TYPES.has(input.type),
  }).catch(() => null);
}

/** Notification types mapped onto inbox sources; anything else is "system". */
const INBOX_SOURCE: Record<string, string> = {
  password_reset_requested: "password_reset",
  password_reset_completed: "password_reset",
  password_reset_failed: "password_reset",
  account_complaint: "complaint",
  admin_access_requested: "admin_access",
  cocreation_interest: "co_creation",
  media_request: "request",
  production_submitted: "request",
  readiness_dormant: "system",
};

const NO_REPLY_TYPES = new Set(["password_reset_requested", "password_reset_completed"]);
