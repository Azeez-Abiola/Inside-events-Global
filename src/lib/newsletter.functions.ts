import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { flushEmailQueueInDev } from "@/lib/email/flush-queue-dev";
import { requirePlatformAdmin, requireAdminPermission, getActorProfile } from "@/lib/admin-auth";
import { auditAdminAction } from "@/lib/admin-audit";
import { isSubAdmin } from "@/lib/admin-permissions";

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("abw_admin") && !roles.includes("super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
}

/** Accept bare domains like insideglobalevents.com by prefixing https:// */
function normalizeHttpUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const LinkItem = z.object({
  label: z.string().min(1).max(120),
  url: z
    .string()
    .max(500)
    .transform(normalizeHttpUrl)
    .pipe(z.string().url("Enter a valid link (e.g. insideglobalevents.com)")),
});

const CampaignContent = z.object({
  subject: z.string().min(3).max(200),
  thumbnail_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  body_html: z.string().min(3).max(50000),
  links: z.array(LinkItem).max(8).default([]),
});

const SubscribeInput = z.object({
  email: z.string().email().max(320),
  name: z.string().max(120).optional().nullable(),
  source: z.string().max(40).optional().default("homepage"),
});

/** Public — homepage footer newsletter signup */
export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d) => SubscribeInput.parse(d))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();

    const { data: suppressed } = await supabaseAdmin
      .from("suppressed_emails")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (suppressed) {
      return { ok: true, alreadySuppressed: true };
    }

    const { error } = await supabaseAdmin.from("newsletter_subscribers").upsert(
      {
        email,
        name: data.name?.trim() || null,
        source: data.source ?? "homepage",
        status: "active",
        unsubscribed_at: null,
      } as never,
      { onConflict: "email" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listNewsletterSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const { data, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, name, source, status, subscribed_at")
      .eq("status", "active")
      .order("subscribed_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);

    const { data: campaigns } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select("id, subject, thumbnail_url, body_html, links, status, recipient_count, sent_at, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);

    return { subscribers: data ?? [], campaigns: campaigns ?? [] };
  });

const SaveDraftInput = CampaignContent.extend({
  id: z.string().uuid().optional().nullable(),
});

/** Save newsletter as draft — no subscribers required */
export const saveNewsletterDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SaveDraftInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const payload = {
      subject: data.subject.trim(),
      thumbnail_url: data.thumbnail_url?.trim() || null,
      body_html: data.body_html.trim(),
      links: data.links ?? [],
      status: "draft",
      created_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { data: existing, error: findErr } = await supabaseAdmin
        .from("newsletter_campaigns")
        .select("id, status")
        .eq("id", data.id)
        .single();
      if (findErr) throw new Error(findErr.message);
      if (existing.status === "sent") throw new Error("Sent campaigns cannot be edited. Duplicate as a new draft instead.");

      const { data: updated, error } = await supabaseAdmin
        .from("newsletter_campaigns")
        .update(payload as never)
        .eq("id", data.id)
        .select("id, subject, status")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, campaign: updated };
    }

    const { data: created, error } = await supabaseAdmin
      .from("newsletter_campaigns")
      .insert({ ...payload, recipient_count: 0, sent_at: null } as never)
      .select("id, subject, status")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, campaign: created };
  });

const SendNewsletterInput = z.object({
  campaign_id: z.string().uuid().optional().nullable(),
  subject: z.string().min(3).max(200).optional(),
  thumbnail_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  body_html: z.string().min(3).max(50000).optional(),
  links: z.array(LinkItem).max(8).optional(),
  subscriber_ids: z.array(z.string().uuid()).min(1),
  /** When true, treat as a resend and use unique idempotency keys */
  resend: z.boolean().optional().default(false),
});

/** Send a draft (by id) or inline content to selected subscribers */
export const sendNewsletterCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SendNewsletterInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requireAdminPermission(userId, "newsletter_send");

    const { data: subscribers, error: subErr } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, name")
      .in("id", data.subscriber_ids)
      .eq("status", "active");
    if (subErr) throw new Error(subErr.message);
    if (!subscribers?.length) throw new Error("No active subscribers selected");

    let campaignId = data.campaign_id ?? null;
    let subject = data.subject?.trim() ?? "";
    let thumbnailUrl = data.thumbnail_url?.trim() || null;
    let bodyHtml = data.body_html?.trim() ?? "";
    let links = data.links ?? [];
    let previousRecipientCount = 0;
    let isResend = data.resend === true;

    if (campaignId) {
      const { data: camp, error: campErr } = await supabaseAdmin
        .from("newsletter_campaigns")
        .select("id, subject, thumbnail_url, body_html, links, status, recipient_count")
        .eq("id", campaignId)
        .single();
      if (campErr) throw new Error(campErr.message);
      subject = camp.subject;
      thumbnailUrl = camp.thumbnail_url;
      bodyHtml = camp.body_html;
      links = (camp.links as { label: string; url: string }[]) ?? [];
      previousRecipientCount = camp.recipient_count ?? 0;
      isResend = data.resend === true || camp.status === "sent";
    } else {
      if (!subject || bodyHtml.length < 3) {
        throw new Error("Subject and newsletter content are required");
      }
      const { data: created, error: createErr } = await supabaseAdmin
        .from("newsletter_campaigns")
        .insert({
          subject,
          thumbnail_url: thumbnailUrl,
          body_html: bodyHtml,
          links,
          status: "draft",
          created_by: userId,
          recipient_count: 0,
        } as never)
        .select("id")
        .single();
      if (createErr) throw new Error(createErr.message);
      campaignId = created.id;
    }

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];
    const resendBatch = isResend ? Date.now() : null;

    for (const sub of subscribers) {
      try {
        const res = await sendTransactionalEmailServer({
          templateName: "newsletter",
          recipientEmail: sub.email,
          idempotencyKey: resendBatch
            ? `newsletter-${campaignId}-${sub.email}-r${resendBatch}`
            : `newsletter-${campaignId}-${sub.email}`,
          templateData: {
            subject,
            thumbnailUrl: thumbnailUrl ?? undefined,
            bodyHtml,
            links,
            recipientName: sub.name ?? undefined,
          },
        });
        if (res.success) sent += 1;
        else skipped += 1;
      } catch (e) {
        errors.push(`${sub.email}: ${e instanceof Error ? e.message : "send failed"}`);
      }
    }

    if (sent === 0 && errors.length) {
      throw new Error(errors[0] ?? "Failed to send newsletter");
    }

    const { error: upErr } = await supabaseAdmin
      .from("newsletter_campaigns")
      .update({
        status: "sent",
        recipient_count: isResend ? previousRecipientCount + sent : sent,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", campaignId!);
    if (upErr) throw new Error(upErr.message);

    // Localhost: deliver queued emails via this machine's Resend key (live cron may be misconfigured).
    const queueFlush = await flushEmailQueueInDev();

    const actor = await getActorProfile(userId);
    await auditAdminAction({
      actorId: userId,
      actorEmail: actor?.email,
      action: "newsletter_sent",
      summary: `Newsletter "${subject}" sent to ${sent} subscriber${sent === 1 ? "" : "s"}`,
      resourceType: "newsletter_campaign",
      resourceId: campaignId ?? undefined,
      metadata: { sent, skipped, resend: isResend },
      notifyTitle: "Newsletter sent",
      notifyBody: `${actor?.display_name ?? actor?.email ?? "Admin"} sent "${subject}" to ${sent} subscribers.`,
    });

    return {
      ok: true,
      campaignId,
      sent,
      skipped,
      resent: isResend,
      errors: errors.slice(0, 5),
      queueFlush,
    };
  });

export const deleteNewsletterCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const { error } = await supabaseAdmin
      .from("newsletter_campaigns")
      .delete()
      .eq("id", data.id)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
