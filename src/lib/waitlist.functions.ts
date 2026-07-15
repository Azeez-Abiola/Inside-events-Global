import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { waitlistAudienceLabel, type WaitlistAudience } from "@/lib/waitlist-audiences";

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("abw_admin") && !roles.includes("super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
}

const SITE_URL = process.env.VITE_SITE_URL || "https://www.insideglobalevents.com";

export const reviewWaitlistSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      action: z.enum(["approve", "reject"]),
      note: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const { data: signup, error } = await supabaseAdmin
      .from("waitlist_signups")
      .select("id, email, full_name, audience, status, rejection_reason")
      .eq("id", data.id)
      .single();
    if (error || !signup) throw new Error("Waitlist signup not found");

    const isApproved = ["approved", "invited", "converted"].includes(signup.status);
    const isRejected = ["rejected", "declined"].includes(signup.status);
    const audienceLabel = waitlistAudienceLabel(signup.audience as WaitlistAudience);

    if (data.action === "approve") {
      if (isApproved) throw new Error("This signup is already approved");
      if (isRejected) throw new Error("Cannot approve a rejected signup");
      const signupUrl = `${SITE_URL}/signup?role=${encodeURIComponent(signup.audience)}&email=${encodeURIComponent(signup.email)}`;

      await sendTransactionalEmailServer({
        templateName: "waitlist-invite",
        recipientEmail: signup.email,
        idempotencyKey: `waitlist-invite-${signup.id}`,
        templateData: {
          name: signup.full_name,
          audienceLabel,
          signupUrl,
        },
      });

      await supabaseAdmin
        .from("waitlist_signups")
        .update({ status: "approved", rejection_reason: null } as never)
        .eq("id", signup.id);

      return { ok: true, status: "approved" };
    }

    if (isRejected) throw new Error("This signup was already rejected");
    if (isApproved) throw new Error("Cannot reject an approved signup");

    const note = data.note?.trim();
    if (!note) throw new Error("A rejection note is required so the applicant can see why they were declined");

    await sendTransactionalEmailServer({
      templateName: "waitlist-rejected",
      recipientEmail: signup.email,
      idempotencyKey: `waitlist-rejected-${signup.id}`,
      templateData: {
        name: signup.full_name,
        audienceLabel,
        note,
      },
    });

    await supabaseAdmin
      .from("waitlist_signups")
      .update({ status: "rejected", rejection_reason: note } as never)
      .eq("id", signup.id);

    return { ok: true, status: "rejected" };
  });

export const inviteWaitlistSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const { data: signup, error } = await supabaseAdmin
      .from("waitlist_signups")
      .select("id, email, full_name, audience, status")
      .eq("id", data.id)
      .single();
    if (error || !signup) throw new Error("Waitlist signup not found");

    const audienceLabel = waitlistAudienceLabel(signup.audience as WaitlistAudience);
    const signupUrl = `${SITE_URL}/signup?role=${encodeURIComponent(signup.audience)}&email=${encodeURIComponent(signup.email)}`;

    await sendTransactionalEmailServer({
      templateName: "waitlist-invite",
      recipientEmail: signup.email,
      idempotencyKey: `waitlist-invite-${signup.id}`,
      templateData: {
        name: signup.full_name,
        audienceLabel,
        signupUrl,
      },
    });

    await supabaseAdmin
      .from("waitlist_signups")
      .update({ status: "invited" } as never)
      .eq("id", signup.id);

    return { ok: true };
  });

export const updateWaitlistStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "contacted", "invited", "approved", "converted", "declined", "rejected"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { error } = await supabaseAdmin
      .from("waitlist_signups")
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
