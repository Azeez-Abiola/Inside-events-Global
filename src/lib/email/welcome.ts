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

const SIGNUP_ROLES = new Set([
  "organiser",
  "sponsor",
  "referral_partner",
  "media_partner",
]);

async function resolveWelcomeName(userId: string, role: string): Promise<string | undefined> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("display_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.display_name?.trim()) return profile.display_name.trim();

  if (role === "organiser") {
    const { data } = await supabaseAdmin
      .from("organiser_profiles")
      .select("org_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.org_name?.trim()) return data.org_name.trim();
  }
  if (role === "sponsor") {
    const { data } = await supabaseAdmin
      .from("sponsor_profiles")
      .select("brand_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.brand_name?.trim()) return data.brand_name.trim();
  }
  if (role === "referral_partner") {
    const { data } = await supabaseAdmin
      .from("referral_partner_profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.full_name?.trim()) return data.full_name.trim();
  }

  const email = profile?.email;
  if (email?.includes("@")) {
    const local = email.split("@")[0]?.replace(/[._+-]/g, " ").trim();
    if (local) return local;
  }

  return undefined;
}

export async function sendWelcomeEmailForUser(userId: string, role: string) {
  if (!SIGNUP_ROLES.has(role)) {
    return { ok: false, reason: "unsupported_role" };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  const email = profile?.email;
  if (!email) return { ok: false, reason: "no_email" };

  const siteUrl = getSiteUrl();
  const roleLabel = ROLE_LABELS[role] ?? "IGE member";
  const name = await resolveWelcomeName(userId, role);

  await sendTransactionalEmailServer({
    templateName: "welcome",
    recipientEmail: email,
    idempotencyKey: `welcome-${userId}`,
    templateData: {
      role,
      roleLabel,
      name,
      siteUrl,
      dashboardUrl: `${siteUrl}/dashboard`,
      messagesUrl: `${siteUrl}/messages`,
      marketplaceUrl: `${siteUrl}/marketplace`,
    },
  });
  return { ok: true };
}
