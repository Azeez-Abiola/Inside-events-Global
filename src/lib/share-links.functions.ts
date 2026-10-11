import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { openInboxThread } from "@/lib/admin-inbox.server";

/**
 * Private event share links (TAB 4 §4.4.5).
 *
 * Anyone with the link sees a summary; full details need sign in (v6.4).
 * Interest from a viewer is never passed to the owner directly — it goes to
 * Admin like any other match (TAB 19), which is why there is no contact
 * detail anywhere in the summary.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   event_share_links postdates the last `supabase gen types` run. */
const sdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface ShareLink {
  token: string;
  enabled: boolean;
  expires_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
}

export interface SharedEventSummary {
  name: string;
  event_type: string | null;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  country: string | null;
  format: string | null;
  attendance_size: number | null;
  primary_audience: string | null;
  primary_sector: string | null;
  event_theme: string | null;
  banner_image_url: string | null;
  looking_to_connect_with: string[];
  /** The sponsorship ask: the floor, plus tier names and prices. */
  min_sponsorship_spend: number | null;
  currency: string | null;
  tiers: { tier_name: string; price: number | null; currency: string | null }[];
}

function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function assertOwner(userId: string, eventId: string) {
  const { data: ev } = await sdb()
    .from("events")
    .select("id, organiser_id, visibility")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev || ev.organiser_id !== userId) throw new Error("Only the event owner can share it.");
  return ev as { id: string; organiser_id: string; visibility: string | null };
}

// ─── Owner side ───────────────────────────────────────────────────────────────

export const getShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ event_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context.userId, data.event_id);
    const { data: link } = await sdb()
      .from("event_share_links")
      .select("token, enabled, expires_at, view_count, last_viewed_at")
      .eq("event_id", data.event_id)
      .maybeSingle();
    return { link: (link ?? null) as ShareLink | null };
  });

export const saveShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        event_id: z.string().uuid(),
        enabled: z.boolean(),
        expires_at: z.string().max(40).nullish(),
        /** Swap the token so copies of the old link stop working. */
        regenerate: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const ev = await assertOwner(context.userId, data.event_id);
    if (ev.visibility !== "private") {
      throw new Error("Share links are for private events. A published event has its own page.");
    }
    const { data: existing } = await sdb()
      .from("event_share_links")
      .select("id, token")
      .eq("event_id", data.event_id)
      .maybeSingle();

    const row = {
      event_id: data.event_id,
      enabled: data.enabled,
      expires_at: data.expires_at || null,
      updated_at: new Date().toISOString(),
      ...(existing && !data.regenerate ? {} : { token: newToken(), view_count: 0 }),
    };
    const { error } = existing
      ? await sdb().from("event_share_links").update(row).eq("id", existing.id)
      : await sdb()
          .from("event_share_links")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─── Viewer side ──────────────────────────────────────────────────────────────

async function resolveLink(token: string) {
  const { data: link } = await sdb()
    .from("event_share_links")
    .select("event_id, enabled, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!link || !link.enabled) return null;
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) return null;
  return link as { event_id: string };
}

/** Public: no sign-in needed to see the summary. */
export const getSharedEvent = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(20).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const link = await resolveLink(data.token);
    if (!link) return { event: null };

    const [{ data: ev }, { data: tiers }] = await Promise.all([
      sdb()
        .from("events")
        .select(
          "name, event_type, start_date, end_date, city, country, format, attendance_size, primary_audience, primary_sector, event_theme, banner_image_url, min_sponsorship_spend, currency, looking_to_connect_with",
        )
        .eq("id", link.event_id)
        .maybeSingle(),
      supabaseAdmin
        .from("event_sponsorship_tiers")
        .select("tier_name, price, currency")
        .eq("event_id", link.event_id)
        .order("display_order"),
    ]);
    if (!ev) return { event: null };

    // A failed counter never blocks the page.
    await sdb().rpc("record_share_link_view", { _token: data.token });

    const e = ev as Record<string, unknown>;
    return {
      event: {
        name: e.name as string,
        event_type: (e.event_type as string) ?? null,
        start_date: (e.start_date as string) ?? null,
        end_date: (e.end_date as string) ?? null,
        city: (e.city as string) ?? null,
        country: (e.country as string) ?? null,
        format: (e.format as string) ?? null,
        attendance_size: (e.attendance_size as number) ?? null,
        primary_audience: (e.primary_audience as string) ?? null,
        primary_sector: (e.primary_sector as string) ?? null,
        event_theme: (e.event_theme as string) ?? null,
        banner_image_url: (e.banner_image_url as string) ?? null,
        looking_to_connect_with: (e.looking_to_connect_with as string[]) ?? [],
        min_sponsorship_spend:
          e.min_sponsorship_spend != null ? Number(e.min_sponsorship_spend) : null,
        currency: (e.currency as string) ?? null,
        tiers: (
          (tiers ?? []) as { tier_name: string; price: number | null; currency: string | null }[]
        ).map((t) => ({
          tier_name: t.tier_name,
          price: t.price != null ? Number(t.price) : null,
          currency: t.currency,
        })),
      } satisfies SharedEventSummary,
    };
  });

/**
 * Signed-in viewers express interest. It goes to Admin, never to the owner,
 * and the owner never learns who looked unless Admin approves a match.
 */
export const expressShareInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        token: z.string().min(20).max(100),
        note: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const link = await resolveLink(data.token);
    if (!link) throw new Error("This link has been switched off or has expired.");

    const [{ data: ev }, { data: profile }, { data: roles }] = await Promise.all([
      supabaseAdmin
        .from("events")
        .select("id, name, organiser_id")
        .eq("id", link.event_id)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("email, display_name")
        .eq("id", context.userId)
        .maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    if (!ev) throw new Error("Event not found.");
    if (ev.organiser_id === context.userId) throw new Error("This is your own event.");

    const id = await openInboxThread({
      source: "request",
      subject: `Interest via private share link: ${ev.name ?? "event"}`,
      body:
        data.note ||
        "Expressed interest in this private event from its share link. Please review for a match.",
      userId: context.userId,
      contactName: profile?.display_name ?? null,
      contactEmail: profile?.email ?? null,
      payload: {
        event_id: ev.id,
        event_name: ev.name ?? null,
        event_owner_id: ev.organiser_id,
        viewer_roles: (roles ?? []).map((r) => r.role),
        via: "private_share_link",
      },
    });
    if (!id) throw new Error("Could not send your interest. Please try again.");
    return { ok: true as const };
  });
