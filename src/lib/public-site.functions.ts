import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";

/**
 * Public, signed-out surfaces of the site (TAB 1): the Upcoming IGE Featured
 * Events on the home page (§1.5D), the public Past Events archive (§1.5C) and
 * the Instagram strip (§1.5B). Everything else in the catalogue is behind
 * sign-in (v6.4).
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   these tables and columns postdate the generated types. */
const sdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface HomeEvent {
  id: string;
  name: string;
  starts_at: string;
  city: string | null;
  cover_image_url: string;
  description: string;
  luma_url: string;
  source: "ige_abw" | "retainer_client";
  marketplace_event_id: string | null;
  display_order: number;
  publish_from: string | null;
  publish_to: string | null;
}

export const IGE_LUMA_CALENDAR = "https://luma.com/d13lhuci";

/** Public. Ordered by Admin's display order, then date; expired ones never show. */
export const getUpcomingHomeEvents = createServerFn({ method: "GET" }).handler(async () => {
  const now = new Date().toISOString();
  const { data, error } = await sdb()
    .from("upcoming_home_events")
    .select(
      "id, name, starts_at, city, cover_image_url, description, luma_url, source, marketplace_event_id, display_order, publish_from, publish_to",
    )
    .gte("starts_at", now)
    .or(`publish_from.is.null,publish_from.lte.${now}`)
    .or(`publish_to.is.null,publish_to.gte.${now}`)
    .order("display_order")
    .order("starts_at")
    .limit(9);
  // A missing table (migration not yet applied) means "nothing to show" —
  // and the section does not render when empty (§1.5D).
  if (error) return { events: [] as HomeEvent[] };
  return { events: (data ?? []) as HomeEvent[] };
});

export interface PastEvent {
  id: string;
  slug: string | null;
  name: string;
  event_type: string | null;
  city: string | null;
  country: string | null;
  start_date: string | null;
  end_date: string | null;
  banner_image_url: string | null;
  attendance_size: number | null;
  next_edition_slug: string | null;
}

/** Public archive: proof of track record for the next sponsorship cycle. */
export const getPastEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await sdb()
    .from("events")
    .select(
      "id, slug, name, event_type, city, country, start_date, end_date, banner_image_url, attendance_size, next_edition_event_id",
    )
    .eq("status", "past")
    .eq("visibility", "published")
    .order("end_date", { ascending: false, nullsFirst: false })
    .limit(120);
  if (error) return { events: [] as PastEvent[] };
  const rows = (data ?? []) as (Omit<PastEvent, "next_edition_slug"> & {
    next_edition_event_id: string | null;
  })[];
  const nextIds = rows.map((r) => r.next_edition_event_id).filter(Boolean) as string[];
  const { data: next } = nextIds.length
    ? await sdb().from("events").select("id, slug, status").in("id", nextIds)
    : { data: [] };
  const live = new Map(
    ((next ?? []) as { id: string; slug: string | null; status: string }[])
      .filter((n) => ["approved", "listed"].includes(n.status))
      .map((n) => [n.id, n.slug]),
  );
  return {
    events: rows.map(({ next_edition_event_id, ...r }) => ({
      ...r,
      next_edition_slug: next_edition_event_id ? (live.get(next_edition_event_id) ?? null) : null,
    })) as PastEvent[],
  };
});

export const getInstagramFeed = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await sdb()
    .from("instagram_feed_cache")
    .select("id, permalink, media_url, caption")
    .order("posted_at", { ascending: false })
    .limit(6);
  if (error)
    return {
      posts: [] as { id: string; permalink: string; media_url: string; caption: string | null }[],
    };
  return {
    posts: (data ?? []) as {
      id: string;
      permalink: string;
      media_url: string;
      caption: string | null;
    }[],
  };
});

// ─── Admin: upload Upcoming IGE Featured Events (§6.1C) ──────────────────────

export const adminListHomeEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminPermission(context.userId, "vetting");
    const { data } = await sdb()
      .from("upcoming_home_events")
      .select("*")
      .order("starts_at", { ascending: false });
    return { events: (data ?? []) as HomeEvent[] };
  });

const HomeEventInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  starts_at: z.string().min(10).max(40),
  city: z.string().trim().max(120).optional(),
  cover_image_url: z.string().trim().url().max(500),
  description: z.string().trim().min(1).max(240),
  luma_url: z
    .string()
    .trim()
    .url()
    .max(500)
    // Registration goes through IGE's own Luma calendar (v6.4).
    .refine(
      (u) => /^https:\/\/(www\.)?(luma\.com|lu\.ma)\//.test(u),
      "Use the event's page on IGE's Luma calendar.",
    ),
  source: z.enum(["ige_abw", "retainer_client"]),
  marketplace_event_id: z.string().uuid().nullish(),
  display_order: z.number().int().min(0).max(999).optional(),
  publish_from: z.string().max(40).nullish(),
  publish_to: z.string().max(40).nullish(),
});

export const adminUpsertHomeEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => HomeEventInput.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "vetting");
    const row = {
      name: data.name,
      starts_at: new Date(data.starts_at).toISOString(),
      city: data.city || null,
      cover_image_url: data.cover_image_url,
      description: data.description,
      luma_url: data.luma_url,
      source: data.source,
      marketplace_event_id: data.marketplace_event_id ?? null,
      display_order: data.display_order ?? 0,
      publish_from: data.publish_from ? new Date(data.publish_from).toISOString() : null,
      publish_to: data.publish_to ? new Date(data.publish_to).toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await sdb().from("upcoming_home_events").update(row).eq("id", data.id)
      : await sdb()
          .from("upcoming_home_events")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    await recordAdminAudit({
      actorId: context.userId,
      action: "home_event_updated",
      summary: `${data.id ? "Edited" : "Uploaded"} home page event "${data.name}"`,
      resourceType: "upcoming_home_event",
      resourceId: data.id,
    }).catch(() => {});
    return { ok: true as const };
  });

export const adminDeleteHomeEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "vetting");
    await sdb().from("upcoming_home_events").delete().eq("id", data.id);
    await recordAdminAudit({
      actorId: context.userId,
      action: "home_event_updated",
      summary: "Removed a home page event",
      resourceType: "upcoming_home_event",
      resourceId: data.id,
    }).catch(() => {});
    return { ok: true as const };
  });
