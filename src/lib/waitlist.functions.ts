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
      status: z.enum(["new", "contacted", "invited", "converted", "declined"]),
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
