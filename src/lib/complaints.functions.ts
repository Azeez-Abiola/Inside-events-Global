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
      .select("id, created_at, user_id, email, display_name, role, message, status")
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
