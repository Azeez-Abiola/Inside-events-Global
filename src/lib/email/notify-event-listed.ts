import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";

/** Notify organisers, sponsors, and newsletter subscribers when an event goes live. */
export async function notifyEventListed(event: {
  id: string;
  name: string;
  slug: string | null;
  city?: string | null;
  country?: string | null;
  start_date?: string | null;
  organiser_id?: string | null;
}) {
  const siteUrl = getSiteUrl();
  const eventUrl = event.slug ? `${siteUrl}/events/${event.slug}` : `${siteUrl}/marketplace`;
  const location = [event.city, event.country].filter(Boolean).join(", ");
  const eventDate = event.start_date
    ? new Date(event.start_date).toLocaleDateString(undefined, { dateStyle: "medium" })
    : undefined;

  const emails = new Set<string>();

  const [{ data: roleRows }, { data: subscribers }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id, role").in("role", ["organiser", "sponsor"]),
    supabaseAdmin
      .from("newsletter_subscribers")
      .select("email")
      .eq("status", "active"),
  ]);

  const userIds = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));
  if (userIds.length) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, is_active, is_suspended")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      if (p.email && p.is_active && !p.is_suspended) emails.add(p.email);
    }
  }

  for (const sub of subscribers ?? []) {
    if (sub.email) emails.add(sub.email);
  }

  // Organiser already gets vetting-status email — still included in broadcast per product request.

  const templateData = {
    eventName: event.name,
    eventLocation: location || undefined,
    eventDate,
    eventUrl,
    siteUrl,
  };

  await Promise.all(
    [...emails].map((recipientEmail) =>
      sendTransactionalEmailServer({
        templateName: "event-listed",
        recipientEmail,
        idempotencyKey: `event-listed-${event.id}-${recipientEmail}`,
        templateData,
      }).catch((e) => console.error("[notifyEventListed]", recipientEmail, e)),
    ),
  );
}
