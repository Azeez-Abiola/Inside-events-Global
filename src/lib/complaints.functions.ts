import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuthAllowSuspended } from "@/lib/supabase-auth-allow-suspended";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { notifyAdmins } from "@/lib/admin-notify";
import { IGE_SUPPORT_EMAIL } from "@/lib/support-email";
import { flushEmailQueueInDev } from "@/lib/email/flush-queue-dev";
import { getSiteUrl } from "@/lib/site-url";
import { roleLabel } from "@/lib/dashboard-meta";
import { auditAdminAction } from "@/lib/admin-audit";
import { getActorProfile } from "@/lib/admin-auth";

const ComplaintInput = z.object({
  role: z.string().trim().min(1).max(40),
  message: z.string().trim().min(20).max(3000),
});

async function ensureAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
}

export const submitAccountComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuthAllowSuspended])
  .inputValidator((d) => ComplaintInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name, is_suspended")
      .eq("id", userId)
      .single();
    if (profileErr) throw new Error(profileErr.message);
    if (!profile.is_suspended) {
      throw new Error("Complaints can only be submitted for deactivated accounts.");
    }
    if (!profile.email) throw new Error("No email on file for this account.");

    const { data: row, error } = await supabaseAdmin
      .from("account_complaints" as never)
      .insert({
        user_id: userId,
        email: profile.email,
        display_name: profile.display_name,
        role: data.role,
        message: data.message,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const label = roleLabel([data.role]);
    const name = profile.display_name?.trim() || profile.email.split("@")[0];

    try {
      await sendTransactionalEmailServer({
        templateName: "complaint-internal",
        recipientEmail: IGE_SUPPORT_EMAIL,
        idempotencyKey: `complaint-internal-${row.id}`,
        templateData: {
          name,
          email: profile.email,
          role: data.role,
          roleLabel: label,
          message: data.message,
          siteUrl: getSiteUrl(),
        },
      });
      await flushEmailQueueInDev();
    } catch (e) {
      console.error("[submitAccountComplaint] email failed", e);
    }

    try {
      await notifyAdmins({
        type: "account_complaint",
        title: "New account complaint",
        body: `${name} (${label}) submitted a support request about their deactivated account.`,
        data: { complaint_id: row.id, user_id: userId },
      });
    } catch (e) {
      console.error("[submitAccountComplaint] admin notify failed", e);
    }

    return { ok: true };
  });

export const listAccountComplaints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("account_complaints" as never)
      .select("id, created_at, user_id, email, display_name, role, message, status, admin_reply, replied_at, replied_by")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { complaints: data ?? [] };
  });

export const updateAccountComplaintStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "read", "resolved"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("account_complaints" as never)
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ReplyInput = z.object({
  id: z.string().uuid(),
  reply: z.string().trim().min(10).max(3000),
  markResolved: z.boolean().optional().default(true),
});

export const replyAccountComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ReplyInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);

    const { data: complaint, error: fetchErr } = await supabaseAdmin
      .from("account_complaints" as never)
      .select("id, user_id, email, display_name, message, status")
      .eq("id", data.id)
      .single();
    if (fetchErr || !complaint) throw new Error(fetchErr?.message ?? "Complaint not found");

    const c = complaint as {
      id: string;
      user_id: string;
      email: string;
      display_name: string | null;
      message: string;
      status: string;
    };

    const name = c.display_name?.trim() || c.email.split("@")[0];

    try {
      await sendTransactionalEmailServer({
        templateName: "complaint-reply",
        recipientEmail: c.email,
        idempotencyKey: `complaint-reply-${data.id}-${Date.now()}`,
        templateData: {
          name,
          originalMessage: c.message,
          reply: data.reply,
          supportEmail: IGE_SUPPORT_EMAIL,
          siteUrl: getSiteUrl(),
        },
      });
      await flushEmailQueueInDev();
    } catch (e) {
      console.error("[replyAccountComplaint] email failed", e);
      throw new Error("Could not send reply email. Please try again.");
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from("account_complaints" as never)
      .update({
        admin_reply: data.reply,
        replied_at: now,
        replied_by: context.userId,
        status: data.markResolved ? "resolved" : c.status === "new" ? "read" : c.status,
      } as never)
      .eq("id", data.id);
    if (updateErr) throw new Error(updateErr.message);

    try {
      await supabaseAdmin.from("notifications").insert({
        user_id: c.user_id,
        type: "complaint_reply",
        title: "Response from IGE support",
        body: data.reply.slice(0, 200),
        data: { complaint_id: data.id },
      });
    } catch (e) {
      console.error("[replyAccountComplaint] user notify failed", e);
    }

    const actor = await getActorProfile(context.userId);
    await auditAdminAction({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "complaint_reply_sent",
      summary: `Replied to account complaint from ${c.email}`,
      resourceType: "account_complaint",
      resourceId: data.id,
      notifyTitle: "Complaint reply sent",
      notifyBody: `${actor?.display_name ?? actor?.email ?? "Admin"} replied to a complaint from ${c.email}.`,
    });

    return { ok: true };
  });
