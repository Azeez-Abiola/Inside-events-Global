import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notifyAdmins } from "@/lib/admin-notify";

const RequestInput = z.object({
  event_id: z.string().uuid(),
  request_type: z.enum(["coverage", "press_credentials", "content"]).default("coverage"),
  message: z.string().trim().max(1000).optional().nullable(),
});

async function assertMediaPartner(userId: string) {
  const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "media_partner")) {
    throw new Error("Only media partners can request coverage");
  }
}

// Media partner submits a coverage / press-credentials request for an event.
export const submitMediaRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RequestInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertMediaPartner(userId);

    const { error } = await supabaseAdmin.from("media_requests" as any).upsert(
      {
        event_id: data.event_id,
        media_partner_id: userId,
        request_type: data.request_type,
        message: data.message ?? null,
        status: "pending",
      },
      { onConflict: "event_id,media_partner_id,request_type" },
    );

    if (error) {
      const code = (error as { code?: string }).code;
      if (code === "PGRST205" || error.message.includes("media_requests") || error.code === "42P01") {
        throw new Error(
          "Media requests are not set up yet. Run scripts/apply-media-requests.mjs or apply the SQL migration in Supabase.",
        );
      }
      throw new Error(error.message);
    }

    // Admin is told, and it lands in the Admin Inbox (TAB 6 §6.10). Best
    // effort — must not fail the request.
    await notifyAdmins({
      type: "media_request",
      title: "New media coverage request",
      body: `A media partner flagged an event they want to cover (${data.request_type.replace(/_/g, " ")}).${data.message ? ` "${data.message}"` : ""} Approving it queues an introduction in the Match queue.`,
      data: { user_id: userId, event_id: data.event_id },
    }).catch((notifyErr) => console.error("[submitMediaRequest] admin notify failed", notifyErr));

    return { ok: true };
  });

// Media partner's own requests, with event info.
export const getMyMediaRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    try {
      const { data: reqs, error } = await supabaseAdmin
        .from("media_requests" as any)
        .select("id, event_id, request_type, message, status, created_at")
        .eq("media_partner_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message.includes("media_requests") || error.code === "42P01") {
          return { requests: [], events: {} };
        }
        throw new Error(error.message);
      }

      const eventIds = Array.from(
        new Set((reqs ?? []).map((r: { event_id: string }) => r.event_id).filter(Boolean)),
      ) as string[];
      const eventMap: Record<string, { id: string; name: string; slug: string; city: string | null; country: string | null }> = {};
      if (eventIds.length) {
        const { data: evs } = await supabaseAdmin
          .from("events")
          .select("id, name, slug, city, country")
          .in("id", eventIds);
        for (const e of evs ?? []) eventMap[e.id] = e;
      }
      return { requests: reqs ?? [], events: eventMap };
    } catch (e) {
      console.error("[getMyMediaRequests]", e);
      return { requests: [], events: {} };
    }
  });

// Saved events for media partners (same event_saves table as sponsors).
export const getMediaPartnerSaves = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: saves } = await supabaseAdmin
      .from("event_saves")
      .select("event_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const ids = (saves ?? []).map((s) => s.event_id);
    const eventMap: Record<string, any> = {};
    if (ids.length) {
      const { data: evs } = await supabaseAdmin
        .from("events")
        .select("id, slug, name, banner_image_url, start_date, city, country, primary_sector")
        .in("id", ids);
      for (const e of evs ?? []) eventMap[e.id] = e;
    }
    return { saves: saves ?? [], eventMap };
  });

// Admin: list all media coverage requests
export const adminListMediaRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");

    const { data: reqs, error } = await supabaseAdmin
      .from("media_requests" as any)
      .select("id, event_id, media_partner_id, request_type, message, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      if (error.message.includes("media_requests") || error.code === "42P01") return { requests: [], events: {}, partners: {} };
      throw new Error(error.message);
    }

    const eventIds = Array.from(new Set((reqs ?? []).map((r: any) => r.event_id)));
    const partnerIds = Array.from(new Set((reqs ?? []).map((r: any) => r.media_partner_id)));
    const events: Record<string, any> = {};
    const partners: Record<string, any> = {};

    if (eventIds.length) {
      const { data: evs } = await supabaseAdmin.from("events").select("id, name, slug, city, country").in("id", eventIds);
      for (const e of evs ?? []) events[e.id] = e;
    }
    if (partnerIds.length) {
      const [{ data: profiles }, { data: mp }] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, email, display_name").in("id", partnerIds),
        supabaseAdmin.from("media_partner_profiles" as any).select("user_id, outlet_name").in("user_id", partnerIds),
      ]);
      for (const p of profiles ?? []) partners[p.id] = { ...partners[p.id], ...p };
      for (const m of mp ?? []) partners[m.user_id] = { ...partners[m.user_id], outlet_name: m.outlet_name };
    }

    return { requests: reqs ?? [], events, partners };
  });

export const adminUpdateMediaRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "approved", "declined", "completed"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
    const { error } = await supabaseAdmin
      .from("media_requests" as any)
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // §5.4 / TAB 19: approving coverage means IGE introduces the media partner
    // to the organiser. That introduction is a match like any other, so it is
    // queued for Admin to offer meeting times and release.
    let matchQueued = false;
    if (data.status === "approved") {
      matchQueued = await queueCoverageIntroduction(data.id).catch(() => false);
    }
    return { ok: true, matchQueued };
  });

async function queueCoverageIntroduction(requestId: string): Promise<boolean> {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- newer tables */
  const db = supabaseAdmin as any;
  const { data: req } = await db.from("media_requests").select("*").eq("id", requestId).maybeSingle();
  if (!req?.event_id) return false;
  const { data: ev } = await db
    .from("events")
    .select("id, name, organiser_id, event_type, city, start_date")
    .eq("id", req.event_id)
    .maybeSingle();
  if (!ev) return false;
  const { data: app } = await db
    .from("onboarding_applications")
    .select("sections")
    .eq("user_id", req.media_partner_id)
    .maybeSingle();
  const media = (app?.sections?.b?.media_types ?? []) as string[];
  const when = ev.start_date
    ? new Date(ev.start_date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;
  const { error } = await db.from("match_scores").upsert(
    {
      pairing_type: "media_event",
      subject_kind: "event",
      subject_id: ev.id,
      subject_user_id: ev.organiser_id,
      subject_role: "organiser",
      candidate_user_id: req.media_partner_id,
      candidate_role: "media_partner",
      base_score: 100,
      secondary_score: 100,
      composite_score: 100,
      queue_status: "pending",
      why_user_text: "Coverage requested for this event and approved by IGE",
      user_summary_for_subject: `A media partner${media.length ? ` (${media.slice(0, 2).join(", ")})` : ""} who wants to cover your event`,
      user_summary_for_candidate: `${ev.name} — ${ev.event_type ?? "event"}${ev.city ? ` in ${ev.city}` : ""}${when ? `, ${when}` : ""}`,
    },
    { onConflict: "pairing_type,subject_id,candidate_user_id" },
  );
  return !error;
}

