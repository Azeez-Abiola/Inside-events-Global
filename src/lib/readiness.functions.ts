import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as zv4 from "zod/v4";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notifyAdmins } from "@/lib/admin-notify";

/**
 * Brand-Readiness Score + AI Coaching Feed (TAB 4 §4.2 Module 3, TAB 7 §7.5).
 *
 * The score is computed from the listing itself, deterministically, so it is
 * explainable and works with no AI at all. The AI writes the coaching cards on
 * top of it when ANTHROPIC_API_KEY is set; without a key the built-in
 * checklist writes them instead. Either way the cards are suggestions, never a
 * vetting decision.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   readiness_scores, coaching_nudges and the newer event columns postdate the
   last generated types. */
const rdb = (): any => supabaseAdmin as any;
/** An events row, read untyped for the same reason. */
type EventRow = Record<string, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const DIMENSIONS = [
  { key: "audience_clarity", label: "Audience Clarity" },
  { key: "attendance_proof", label: "Attendance Proof" },
  { key: "sponsor_roi_history", label: "Sponsor ROI History" },
  { key: "commercialisation", label: "Commercialisation Readiness" },
  { key: "experience_quality", label: "Experience Quality" },
  { key: "organiser_credibility", label: "Organiser Credibility" },
] as const;
export type DimensionKey = (typeof DIMENSIONS)[number]["key"];

interface Check {
  dimension: DimensionKey;
  weight: number;
  passed: boolean;
  /** What to do when it fails — the rules-based coaching card. */
  fix: string;
}

const has = (v: unknown) =>
  v != null &&
  v !== "" &&
  v !== false &&
  !(Array.isArray(v) && v.length === 0) &&
  !(typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0);

/** The checklist behind every dimension. Weights sum to 100 per dimension. */
function checks(ev: EventRow, ctx: Ctx): Check[] {
  return [
    // Audience Clarity — "seniority, sector, decision-making power, geographic mix"
    {
      dimension: "audience_clarity",
      weight: 30,
      passed: has(ev.primary_audience),
      fix: "Describe your primary audience — who attends, in plain words.",
    },
    {
      dimension: "audience_clarity",
      weight: 25,
      passed: has(ev.audience_seniority),
      fix: "Add a decision-maker seniority breakdown to your audience profile. Sponsors buy access to people who can say yes.",
    },
    {
      dimension: "audience_clarity",
      weight: 25,
      passed: ev.decision_makers_pct != null,
      fix: "State roughly what share of attendees are decision-makers.",
    },
    {
      dimension: "audience_clarity",
      weight: 20,
      passed: has(ev.geographic_mix),
      fix: "Add your audience's geographic mix — local, national, diaspora or international.",
    },

    // Attendance Proof — "at least 1 past edition with documented attendance"
    {
      dimension: "attendance_proof",
      weight: 35,
      passed: Number(ev.past_editions ?? 0) > 0,
      fix: "Record how many past editions you have run. A first edition is fine — say so.",
    },
    {
      dimension: "attendance_proof",
      weight: 35,
      passed: ev.attendance_size != null && Number(ev.attendance_size) > 0,
      fix: "Upload verified attendance figures from your last edition to unlock the Verified Attendance badge.",
    },
    {
      dimension: "attendance_proof",
      weight: 30,
      passed: Number(ev.years_running_event ?? 0) > 0,
      fix: "Add how many years the event has been running — growth over time is what sponsors look for.",
    },

    // Sponsor ROI History — "at least 1 verifiable sponsor success story"
    {
      dimension: "sponsor_roi_history",
      weight: 40,
      passed: ctx.paidDeals > 0 || ctx.pastSponsorLogos,
      fix: "You have no documented sponsor success story yet. Apply for a Co-Creation Advisory session to build one.",
    },
    {
      dimension: "sponsor_roi_history",
      weight: 35,
      passed: !!ev.post_event_report,
      fix: "Commit to a post-event report for sponsors. It is the evidence a renewal is built on.",
    },
    {
      dimension: "sponsor_roi_history",
      weight: 25,
      passed: !!ev.lead_capture,
      fix: "Offer sponsors lead capture (with consent). Leads are the value-for-business proof finance teams ask for.",
    },

    // Commercialisation Readiness — "tiers structured, a deck, activation opportunities"
    {
      dimension: "commercialisation",
      weight: 30,
      passed: has(ev.sponsorship_deck_url),
      fix: "Upload your sponsorship deck. No deck yet? IGE can help build one through Co-Creation.",
    },
    {
      dimension: "commercialisation",
      weight: 30,
      passed: ctx.tiers > 0,
      fix: "Structure your sponsorship into tiers with prices and deliverables.",
    },
    {
      dimension: "commercialisation",
      weight: 20,
      passed: !!ev.speaking_opps || Number(ev.speaking_slots ?? 0) > 0 || has(ev.exposure_channels),
      fix: "Your offer is missing defined activation zones, speaking slots or exposure channels. Spell out what a sponsor actually gets.",
    },
    {
      dimension: "commercialisation",
      weight: 20,
      passed: has(ev.floor_plan_url),
      fix: "Add a floor plan so sponsors can picture where their activation sits.",
    },

    // Experience Quality — production quality, venue, premium experience
    {
      dimension: "experience_quality",
      weight: 35,
      passed: has(ev.banner_image_url),
      fix: "Upload photos or video from your last edition — listings with media get far more sponsor attention.",
    },
    {
      dimension: "experience_quality",
      weight: 25,
      passed: has(ev.venue),
      fix: "Name your venue, or say which venues you are shortlisting.",
    },
    {
      dimension: "experience_quality",
      weight: 20,
      passed: has(ev.event_theme),
      fix: "Give the event a clear theme or tagline sponsors can align with.",
    },
    {
      dimension: "experience_quality",
      weight: 20,
      passed: has(ev.website),
      fix: "Add the event website so sponsors can see the experience for themselves.",
    },

    // Organiser Credibility — "LinkedIn verification + reference check"
    {
      dimension: "organiser_credibility",
      weight: 35,
      passed: ctx.verified,
      fix: "Complete Verification & trust in your profile to earn the Verified badge.",
    },
    {
      dimension: "organiser_credibility",
      weight: 25,
      passed: ctx.linkedin,
      fix: "Link your LinkedIn profile to complete your credibility verification.",
    },
    {
      dimension: "organiser_credibility",
      weight: 20,
      passed: has(ev.organiser_contact_name) && has(ev.organiser_contact_email),
      fix: "Add a named contact for the event so sponsors know who stands behind it.",
    },
    {
      dimension: "organiser_credibility",
      weight: 20,
      passed: ctx.trackRecord,
      fix: "Add your organisation's track record — past events, partners and results.",
    },
  ];
}

interface Ctx {
  tiers: number;
  paidDeals: number;
  pastSponsorLogos: boolean;
  verified: boolean;
  linkedin: boolean;
  trackRecord: boolean;
}

function score(ev: EventRow, ctx: Ctx) {
  const all = checks(ev, ctx);
  const dims = Object.fromEntries(
    DIMENSIONS.map((d) => {
      const mine = all.filter((c) => c.dimension === d.key);
      const got = mine.filter((c) => c.passed).reduce((n, c) => n + c.weight, 0);
      return [d.key, Math.round(got)];
    }),
  ) as Record<DimensionKey, number>;
  // Same composite logic as the ROI Score engine: an equal-weighted average.
  const composite = Math.round(Object.values(dims).reduce((a, b) => a + b, 0) / DIMENSIONS.length);
  return { dims, composite, failing: all.filter((c) => !c.passed) };
}

async function assertOwnedEvent(userId: string, eventId: string) {
  const { data: ev } = await rdb().from("events").select("*").eq("id", eventId).maybeSingle();
  if (!ev || ev.organiser_id !== userId) throw new Error("Event not found.");
  return ev as EventRow;
}

async function context(ev: EventRow): Promise<Ctx> {
  const [tiers, deals, org, app] = await Promise.all([
    rdb()
      .from("event_sponsorship_tiers")
      .select("id", { count: "exact", head: true })
      .eq("event_id", ev.id),
    rdb()
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("organiser_id", ev.organiser_id)
      .eq("status", "payment_received"),
    rdb()
      .from("organiser_profiles")
      .select("track_record, past_sponsor_logos, event_history")
      .eq("user_id", ev.organiser_id)
      .maybeSingle(),
    rdb()
      .from("onboarding_applications")
      .select("verification_status, sections")
      .eq("user_id", ev.organiser_id)
      .maybeSingle(),
  ]);
  const sections = JSON.stringify(app.data?.sections ?? {}).toLowerCase();
  return {
    tiers: tiers.count ?? 0,
    paidDeals: deals.count ?? 0,
    pastSponsorLogos: has(org.data?.past_sponsor_logos),
    verified: app.data?.verification_status === "verified",
    linkedin: /linkedin\.com\//.test(sections),
    trackRecord: has(org.data?.track_record) || has(org.data?.event_history),
  };
}

// ─── AI coaching ─────────────────────────────────────────────────────────────

const CoachingSchema = zv4.object({
  cards: zv4
    .array(
      zv4.object({
        dimension: zv4.enum(DIMENSIONS.map((d) => d.key) as [DimensionKey, ...DimensionKey[]]),
        message: zv4.string(),
      }),
    )
    .max(6),
});

const COACH_SYSTEM = `You coach event organisers on Inside Global Events (IGE), a vetted event sponsorship marketplace built in Africa for the global events economy.

You will be given one event listing and its Brand-Readiness scores across six dimensions of the IGE Brand-Readiness Framework: Audience Clarity, Attendance Proof, Sponsor ROI History, Commercialisation Readiness, Experience Quality, Organiser Credibility.

Write up to six coaching cards, one actionable fix per card, aimed at the weakest dimensions first. Each card is one or two sentences, addressed to the organiser as "you", specific to this event's actual details, and says what to do and why a sponsor's finance team would care. Do not invent statistics or percentages. Do not promise approval, vetting outcomes or sponsorship — these are suggestions only. If a dimension is already strong, do not write a card for it.`;

async function aiCoaching(
  ev: EventRow,
  dims: Record<DimensionKey, number>,
  failing: Check[],
): Promise<{ dimension: DimensionKey; message: string }[] | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic();
  const listing = {
    name: ev.name,
    event_type: ev.event_type,
    theme: ev.event_theme,
    dates: [ev.start_date, ev.end_date].filter(Boolean),
    location: [ev.venue, ev.city, ev.country].filter(Boolean).join(", "),
    format: ev.format,
    expected_attendance: ev.attendance_size,
    past_editions: ev.past_editions,
    years_running: ev.years_running_event,
    primary_audience: ev.primary_audience,
    audience_seniority: ev.audience_seniority,
    decision_makers_pct: ev.decision_makers_pct,
    geographic_mix: ev.geographic_mix,
    sector: [ev.primary_sector, ev.secondary_sector].filter(Boolean),
    sponsorship_floor: ev.min_sponsorship_spend
      ? `${ev.currency ?? ""} ${ev.min_sponsorship_spend}`
      : null,
    has_deck: !!ev.sponsorship_deck_url,
    offers: {
      speaking_slots: ev.speaking_slots,
      lead_capture: ev.lead_capture,
      post_event_report: ev.post_event_report,
    },
  };
  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: COACH_SYSTEM,
      output_config: { effort: "medium", format: betaZodOutputFormat(CoachingSchema) },
      messages: [
        {
          role: "user",
          content: `Event listing:\n${JSON.stringify(listing, null, 2)}\n\nScores out of 100:\n${JSON.stringify(dims, null, 2)}\n\nGaps the checklist found:\n${failing.map((f) => `- [${f.dimension}] ${f.fix}`).join("\n")}`,
        },
      ],
    });
    if (response.stop_reason === "refusal") return null;
    const cards = response.parsed_output?.cards ?? [];
    return cards.filter((c) => c.message.trim()).slice(0, 6);
  } catch (e) {
    // Coaching is a nicety; the checklist cards stand in if the API fails.
    if (e instanceof Anthropic.APIError) console.error("AI coaching failed", e.status, e.message);
    else console.error("AI coaching failed", e);
    return null;
  }
}

// ─── Server functions ────────────────────────────────────────────────────────

export interface ReadinessView {
  event_id: string;
  event_name: string;
  composite: number;
  dimensions: { key: DimensionKey; label: string; score: number }[];
  /** Change against the most recent score at least a week old. */
  weekly_delta: number | null;
  last_changed_at: string | null;
  nudges: { id: string; dimension: string; message: string; source: string; surfaced_at: string }[];
  ai_available: boolean;
}

/** Scores an event, records the score when it moved, and returns the view. */
export const getReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ event_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context: c }): Promise<ReadinessView> => {
    const ev = await assertOwnedEvent(c.userId, data.event_id);
    const { dims, composite, failing } = score(ev, await context(ev));

    const { data: history } = await rdb()
      .from("readiness_scores")
      .select("composite_score, computed_at")
      .eq("event_id", ev.id)
      .order("computed_at", { ascending: false })
      .limit(60);
    const H = (history ?? []) as { composite_score: number; computed_at: string }[];
    if (!H.length || H[0].composite_score !== composite) {
      await rdb()
        .from("readiness_scores")
        .insert({ event_id: ev.id, composite_score: composite, dimension_scores: dims });
    }
    const weekAgo = Date.now() - 7 * 86_400_000;
    const baseline = H.find((h) => Date.parse(h.computed_at) <= weekAgo);
    const lastChange =
      !H.length || H[0].composite_score !== composite ? new Date().toISOString() : H[0].computed_at;

    // "A dormant score for 30+ days flags the organiser to ABW admin for manual
    //  outreach" — once, not on every page view.
    if (
      Date.now() - Date.parse(lastChange) > 30 * 86_400_000 &&
      !ev.readiness_dormancy_flagged_at
    ) {
      await rdb()
        .from("events")
        .update({ readiness_dormancy_flagged_at: new Date().toISOString() })
        .eq("id", ev.id);
      await notifyAdmins({
        type: "readiness_dormant",
        title: `Readiness score dormant: ${ev.name}`,
        body: `${ev.name} has sat at ${composite}/100 for over 30 days. Worth a personal check-in — and a natural moment to offer Co-Creation or the Managed Service.`,
        data: { user_id: ev.organiser_id, event_id: ev.id },
      }).catch(() => {});
    }

    // Keep a rules card for every current gap that has no open card yet.
    const { data: open } = await rdb()
      .from("coaching_nudges")
      .select("id, dimension, message, source, surfaced_at")
      .eq("event_id", ev.id)
      .is("dismissed_at", null)
      .is("resolved_at", null)
      .order("surfaced_at", { ascending: false });
    let nudges = (open ?? []) as ReadinessView["nudges"];
    const failingDims = new Set(failing.map((f) => f.dimension));
    // A dimension that is now complete resolves its open cards.
    const stale = nudges.filter((n) => !failingDims.has(n.dimension as DimensionKey));
    if (stale.length) {
      await rdb()
        .from("coaching_nudges")
        .update({ resolved_at: new Date().toISOString() })
        .in(
          "id",
          stale.map((n) => n.id),
        );
      nudges = nudges.filter((n) => failingDims.has(n.dimension as DimensionKey));
    }
    if (!nudges.length && failing.length) {
      const fresh = failing
        .sort((a, b) => dims[a.dimension] - dims[b.dimension] || b.weight - a.weight)
        .slice(0, 4)
        .map((f) => ({ event_id: ev.id, dimension: f.dimension, message: f.fix, source: "rules" }));
      const { data: inserted } = await rdb()
        .from("coaching_nudges")
        .insert(fresh)
        .select("id, dimension, message, source, surfaced_at");
      nudges = (inserted ?? []) as ReadinessView["nudges"];
    }

    return {
      event_id: ev.id,
      event_name: ev.name,
      composite,
      dimensions: DIMENSIONS.map((d) => ({ key: d.key, label: d.label, score: dims[d.key] })),
      weekly_delta: baseline ? composite - baseline.composite_score : null,
      last_changed_at: lastChange,
      nudges,
      ai_available: !!process.env.ANTHROPIC_API_KEY,
    };
  });

/** Ask the AI coach for fresh cards. Replaces the open cards for this event. */
export const refreshAiCoaching = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ event_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context: c }) => {
    const ev = await assertOwnedEvent(c.userId, data.event_id);
    const { dims, failing } = score(ev, await context(ev));
    if (!failing.length) return { ok: true as const, cards: 0 };
    const cards = await aiCoaching(ev, dims, failing);
    if (!cards) {
      throw new Error(
        process.env.ANTHROPIC_API_KEY
          ? "The AI coach could not respond just now. Your checklist cards still apply."
          : "AI coaching is not switched on yet. Your checklist cards still apply.",
      );
    }
    const now = new Date().toISOString();
    await rdb()
      .from("coaching_nudges")
      .update({ dismissed_at: now })
      .eq("event_id", ev.id)
      .is("dismissed_at", null)
      .is("resolved_at", null);
    await rdb()
      .from("coaching_nudges")
      .insert(
        cards.map((k) => ({
          event_id: ev.id,
          dimension: k.dimension,
          message: k.message,
          source: "ai",
        })),
      );
    return { ok: true as const, cards: cards.length };
  });

export const dismissNudge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context: c }) => {
    const { data: n } = await rdb()
      .from("coaching_nudges")
      .select("event_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!n) throw new Error("Card not found.");
    await assertOwnedEvent(c.userId, n.event_id);
    await rdb()
      .from("coaching_nudges")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true as const };
  });

/** The organiser's events, for the coach's event picker. */
export const listReadinessEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context: c }) => {
    const { data } = await rdb()
      .from("events")
      .select("id, name, start_date, visibility, status")
      .eq("organiser_id", c.userId)
      .order("start_date", { ascending: true, nullsFirst: false });
    return {
      events: (data ?? []) as {
        id: string;
        name: string;
        start_date: string | null;
        visibility: string | null;
        status: string | null;
      }[],
    };
  });
