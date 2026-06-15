import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";

const ROLE_LABELS: Record<string, string> = {
  organiser: "Event Organiser",
  sponsor: "Brand / Sponsor",
  referral_partner: "Referral Partner",
  media_partner: "Media Partner",
  abw_admin: "IGE Admin",
  super_admin: "Super Admin",
};

export async function sendWelcomeEmailForUser(userId: string, role: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  const email = profile?.email;
  if (!email) return { ok: false, reason: "no_email" };

  const siteUrl = getSiteUrl();
  const roleLabel = ROLE_LABELS[role] ?? "IGE member";

  await sendTransactionalEmailServer({
    templateName: "welcome",
    recipientEmail: email,
    idempotencyKey: `welcome-${userId}`,
    templateData: {
      role,
      roleLabel,
      siteUrl,
      dashboardUrl: `${siteUrl}/dashboard`,
      messagesUrl: `${siteUrl}/messages`,
      marketplaceUrl: `${siteUrl}/marketplace`,
    },
  });
  return { ok: true };
}
