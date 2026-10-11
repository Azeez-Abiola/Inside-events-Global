import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { toUsd, type Rates } from "@/lib/currency";
import {
  bandProximity,
  score,
  whyLine,
  type FieldSignal,
  type PairingType,
  type ScoreResult,
} from "@/lib/matching/scoring";

/**
 * The automated half of the matchmaking engine (TAB 19 §19.3): pull every
 * eligible profile and listing, score each pairing, and place the candidates
 * above threshold in Admin's Match Approval Queue. Nothing here reaches a user
 * — release is Admin's decision (§19.3A).
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   The matching tables and onboarding JSON postdate the generated types. */
const mdb = (): any => supabaseAdmin as any;
type Sections = Record<string, Record<string, any>>;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface Applicant {
  user_id: string;
  role: string;
  s: Sections;
}

interface EventRow {
  id: string;
  name: string;
  organiser_id: string;
  event_type: string | null;
  primary_sector: string | null;
  secondary_sector: string | null;
  city: string | null;
  country: string | null;
  start_date: string | null;
  attendance_size: number | null;
  min_sponsorship_spend: number | null;
  currency: string | null;
  looking_to_connect_with: string[] | null;
}

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String).filter(Boolean) : v ? [String(v)] : [];

const ROLE_LABEL: Record<string, string> = {
  sponsor: "brand sponsor",
  organiser: "event organiser",
  media_partner: "media partner",
  referral_partner: "referral partner",
  partnerships_pro: "partnerships professional",
  creative_hub: "creative",
};

/** Default pairing weights; overridden by match_weight_config (§19.4). */
const DEFAULT_WEIGHTS: Record<
  PairingType,
  { primary: number; secondary: number; threshold: number }
> = {
  organiser_sponsor: { primary: 65, secondary: 35, threshold: 55 },
  referral_event: { primary: 55, secondary: 45, threshold: 55 },
  pro_event: { primary: 55, secondary: 45, threshold: 55 },
  media_event: { primary: 60, secondary: 40, threshold: 55 },
  creative_sponsor: { primary: 60, secondary: 40, threshold: 55 },
  service_booking: { primary: 70, secondary: 30, threshold: 55 },
};

/** Organiser wishlist items (TAB 3 §G) and the roles that can deliver them. */
const SERVICE_ROLE: Record<string, string[]> = {
  Videographer: ["media_partner", "creative_hub"],
  Photographer: ["media_partner", "creative_hub"],
  "Media/press team": ["media_partner"],
  "Media partners": ["media_partner"],
  "Design assets": ["creative_hub"],
  "MC/hosts": ["creative_hub"],
  "Sponsor intros": ["partnerships_pro", "referral_partner"],
  "Value-exchange partners": ["partnerships_pro"],
  "Project manager": ["partnerships_pro"],
};

interface Candidate {
  pairing: PairingType;
  subjectKind: "event" | "account";
  subjectId: string;
  subjectUserId: string;
  subjectRole: string;
  candidateUserId: string;
  candidateRole: string;
  result: ScoreResult;
  summaryForSubject: string;
  summaryForCandidate: string;
}

function sponsorSummary(a: Applicant): string {
  const industry = a.s.a?.industry;
  const band = a.s.c?.investment_range;
  return `A ${industry ? `${industry} ` : ""}brand sponsor${band ? ` with a typical investment range of ${band}` : ""}`;
}

function accountSummary(a: Applicant): string {
  const role = ROLE_LABEL[a.role] ?? "partner";
  const focus =
    arr(a.s.b?.sectors_of_expertise)[0] ??
    arr(a.s.b?.sectors_of_focus)[0] ??
    arr(a.s.b?.primary_beat)[0] ??
    arr(a.s.c?.project_types)[0];
  const where = a.s.a?.country;
  return `A ${role}${focus ? ` focused on ${focus}` : ""}${where ? `, based in ${where}` : ""}`;
}

/** Published events are public marketing content, so their name may be shown (§19.1A). */
function eventSummary(e: EventRow): string {
  const when = e.start_date
    ? new Date(e.start_date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;
  return `${e.name} — ${e.event_type ?? "event"}${e.city ? ` in ${e.city}` : ""}${when ? `, ${when}` : ""}`;
}

export async function loadWeights(): Promise<typeof DEFAULT_WEIGHTS> {
  const { data } = await mdb().from("match_weight_config").select("*");
  const out = { ...DEFAULT_WEIGHTS };
  for (const r of (data ?? []) as {
    pairing_type: PairingType;
    primary_weight: number;
    secondary_weight: number;
    threshold: number;
  }[]) {
    if (out[r.pairing_type]) {
      out[r.pairing_type] = {
        primary: r.primary_weight,
        secondary: r.secondary_weight,
        threshold: r.threshold,
      };
    }
  }
  return out;
}

export async function runMatchmaking(): Promise<{
  scored: number;
  queued: number;
  removed: number;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: apps }, { data: profiles }, { data: events }, { data: rate }, weights] =
    await Promise.all([
      mdb()
        .from("onboarding_applications")
        .select("user_id, role, sections")
        .in("role", [
          "organiser",
          "sponsor",
          "referral_partner",
          "media_partner",
          "partnerships_pro",
          "creative_hub",
        ]),
      mdb().from("profiles").select("id, matching_paused, is_suspended"),
      mdb()
        .from("events")
        .select(
          "id, name, organiser_id, event_type, primary_sector, secondary_sector, city, country, start_date, attendance_size, min_sponsorship_spend, currency, looking_to_connect_with, visibility, status",
        )
        .in("status", ["approved", "listed"])
        .eq("visibility", "published"),
      mdb()
        .from("exchange_rates")
        .select("ngn_rate, gbp_rate, eur_rate")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      loadWeights(),
    ]);

  // Paused or suspended accounts leave the candidate pool (§19.10).
  const blocked = new Set(
    ((profiles ?? []) as { id: string; matching_paused?: boolean; is_suspended?: boolean }[])
      .filter((p) => p.matching_paused || p.is_suspended)
      .map((p) => p.id),
  );
  const people = ((apps ?? []) as { user_id: string; role: string; sections: Sections }[])
    .filter((a) => !blocked.has(a.user_id))
    .map((a) => ({ user_id: a.user_id, role: a.role, s: a.sections ?? {} })) as Applicant[];
  const byRole = (role: string) => people.filter((p) => p.role === role);
  const appOf = new Map(people.map((p) => [p.user_id, p]));

  // Past events cannot be sponsored, so they leave the pool (§19.3 step 2).
  const liveEvents = ((events ?? []) as EventRow[]).filter(
    (e) => !blocked.has(e.organiser_id) && (!e.start_date || e.start_date >= today),
  );

  const rates = (rate ?? null) as Rates;
  const usd = (amount: number, cur: string) => toUsd(amount, cur || "USD", rates);
  const candidates: Candidate[] = [];

  const push = (
    pairing: PairingType,
    subject: {
      kind: "event" | "account";
      id: string;
      userId: string;
      role: string;
      summary: string;
    },
    cand: Applicant,
    signals: FieldSignal[],
  ) => {
    if (subject.userId === cand.user_id) return;
    const w = weights[pairing];
    const result = score(signals, w);
    if (result.composite < w.threshold) return;
    candidates.push({
      pairing,
      subjectKind: subject.kind,
      subjectId: subject.id,
      subjectUserId: subject.userId,
      subjectRole: subject.role,
      candidateUserId: cand.user_id,
      candidateRole: cand.role,
      result,
      summaryForSubject: cand.role === "sponsor" ? sponsorSummary(cand) : accountSummary(cand),
      summaryForCandidate: subject.summary,
    });
  };

  for (const e of liveEvents) {
    const org = appOf.get(e.organiser_id);
    const sectors = [
      e.primary_sector,
      e.secondary_sector,
      ...arr(org?.s.d?.sponsor_categories),
    ].filter(Boolean) as string[];
    const audience = arr(org?.s.c?.audience_industries);
    const geo = [e.country, ...arr(org?.s.c?.audience_geo)].filter(Boolean) as string[];
    // "Looking to connect with" decides which roles this listing is matched
    // to (§19.1A, v6.3). An older listing without it is looking for sponsors.
    const wants = new Set(
      e.looking_to_connect_with?.length ? e.looking_to_connect_with : ["sponsor"],
    );
    const subject = {
      kind: "event" as const,
      id: e.id,
      userId: e.organiser_id,
      role: "organiser",
      summary: eventSummary(e),
    };
    const eventBand =
      e.min_sponsorship_spend != null
        ? `${e.currency === "NGN" ? "₦" : "$"}${e.min_sponsorship_spend}`
        : "";

    if (wants.has("sponsor")) {
      for (const sp of byRole("sponsor")) {
        push("organiser_sponsor", subject, sp, [
          {
            field: "sector",
            label: "Sector",
            primary: true,
            subject: sectors,
            candidate: arr(sp.s.a?.industry),
          },
          {
            field: "event_type",
            label: "Event type",
            primary: true,
            subject: arr(e.event_type),
            candidate: arr(sp.s.b?.event_types_interested),
          },
          {
            field: "audience",
            label: "Audience",
            primary: false,
            subject: audience,
            candidate: arr(sp.s.b?.target_audience),
          },
          {
            field: "market",
            label: "Market",
            primary: false,
            subject: geo,
            candidate: arr(sp.s.b?.target_markets),
          },
          {
            field: "budget",
            label: "Budget fit",
            primary: false,
            subject: eventBand ? [eventBand] : [],
            candidate: arr(sp.s.c?.investment_range),
            compare: (a, b) => bandProximity(a[0], b[0], usd),
          },
        ]);
      }
    }
    if (wants.has("referral_partner")) {
      for (const rp of byRole("referral_partner")) {
        push("referral_event", subject, rp, [
          {
            field: "sector",
            label: "Sector",
            primary: true,
            subject: sectors,
            candidate: arr(rp.s.b?.sectors_of_expertise),
          },
          {
            field: "geography",
            label: "Geography",
            primary: true,
            subject: geo,
            candidate: arr(rp.s.b?.geographies_covered),
          },
          {
            field: "deal_size",
            label: "Deal size",
            primary: false,
            subject: eventBand ? [eventBand] : [],
            candidate: arr(rp.s.d?.target_deal_range),
            compare: (a, b) => bandProximity(a[0], b[0], usd),
          },
        ]);
      }
    }
    if (wants.has("partnerships_pro")) {
      for (const pro of byRole("partnerships_pro")) {
        push("pro_event", subject, pro, [
          {
            field: "client_type",
            label: "Client type",
            primary: true,
            subject: ["Event Organisers"],
            candidate: arr(pro.s.b?.client_types),
            compare: (_a, b) => (b.some((x) => /organis|brand|sponsor/i.test(x)) ? 1 : 0),
          },
          {
            field: "sector",
            label: "Sector",
            primary: true,
            subject: sectors,
            candidate: arr(pro.s.b?.sectors_of_focus),
          },
          {
            field: "partnership_type",
            label: "Partnership type",
            primary: false,
            subject: ["Event sponsorship"],
            candidate: arr(pro.s.b?.partnership_types),
          },
        ]);
      }
    }
    if (wants.has("media_partner")) {
      for (const mp of byRole("media_partner")) {
        push("media_event", subject, mp, [
          {
            field: "beat",
            label: "Beat",
            primary: true,
            subject: [...sectors, ...audience],
            candidate: arr(mp.s.b?.primary_beat),
          },
          {
            field: "geography",
            label: "Geography",
            primary: true,
            subject: geo,
            candidate: arr(mp.s.b?.geographies_covered),
          },
          {
            field: "coverage",
            label: "Coverage needed",
            primary: false,
            subject: arr(org?.s.g?.support_needed).filter((x) =>
              SERVICE_ROLE[x]?.includes("media_partner"),
            ),
            candidate: arr(mp.s.b?.media_types),
            compare: (a) => (a.length ? 1 : 0),
          },
        ]);
      }
    }
  }

  // Creative Hub ↔ Sponsor (subject: the creative's production profile).
  for (const cr of byRole("creative_hub")) {
    const subject = {
      kind: "account" as const,
      id: cr.user_id,
      userId: cr.user_id,
      role: "creative_hub",
      summary: `A ${cr.s.d?.format ?? "creative production"}${cr.s.d?.production_stage ? ` (${cr.s.d.production_stage})` : ""} seeking brand placement`,
    };
    const placements = [...arr(cr.s.c?.project_types), ...arr(cr.s.d?.placements)];
    for (const sp of byRole("sponsor")) {
      push("creative_sponsor", subject, sp, [
        {
          field: "placement",
          label: "Placement format",
          primary: true,
          subject: placements,
          candidate: arr(sp.s.b?.activation_formats),
          // Brand activation vocabulary and production vocabulary differ;
          // content, digital and naming formats are the honest crossovers.
          compare: (a, b) => {
            const wantsContent = b.some((x) =>
              /content|digital|social|ambassador|naming|title/i.test(x),
            );
            const offers = a.some((x) => /placement|integration|sponsor|co-branded|title/i.test(x));
            return wantsContent && offers ? 1 : 0;
          },
        },
        {
          field: "market",
          label: "Market",
          primary: true,
          subject: arr(cr.s.d?.target_markets),
          candidate: arr(sp.s.b?.target_markets),
        },
        {
          field: "budget",
          label: "Budget fit",
          primary: true,
          subject: arr(cr.s.c?.budget_band),
          candidate: arr(sp.s.c?.investment_range),
          compare: (a, b) => bandProximity(a[0], b[0], usd),
        },
        {
          field: "platform",
          label: "Platform",
          primary: false,
          subject: arr(cr.s.b?.primary_platforms),
          candidate: arr(sp.s.b?.activation_formats),
          compare: (a, b) => (a.length && b.some((x) => /digital|social|content/i.test(x)) ? 1 : 0),
        },
      ]);
    }
  }

  // Service booking: an organiser's wishlist ↔ people who deliver it (§19.2).
  for (const org of byRole("organiser")) {
    const needs = arr(org.s.g?.support_needed).filter((n) => SERVICE_ROLE[n]);
    if (!needs.length) continue;
    const subject = {
      kind: "account" as const,
      id: org.user_id,
      userId: org.user_id,
      role: "organiser",
      summary: `An event organiser${org.s.b?.event_city ? ` in ${org.s.b.event_city}` : ""} looking for ${needs.slice(0, 2).join(" and ").toLowerCase()}`,
    };
    for (const role of ["media_partner", "creative_hub", "partnerships_pro"]) {
      const roleNeeds = needs.filter((n) => SERVICE_ROLE[n].includes(role));
      if (!roleNeeds.length) continue;
      for (const c of byRole(role)) {
        const offers = [
          ...arr(c.s.b?.media_types),
          ...arr(c.s.d?.what_you_offer),
          ...arr(c.s.b?.client_types),
          ...arr(c.s.e?.can_offer),
          ROLE_LABEL[role],
        ];
        push("service_booking", subject, c, [
          {
            field: "service",
            label: "Service needed",
            primary: true,
            subject: roleNeeds,
            candidate: offers,
            // The role itself delivers these needs; the literal match is the
            // point (§19.4: "deliberately more literal").
            compare: () => 1,
          },
          {
            field: "geography",
            label: "Location",
            primary: false,
            subject: [org.s.b?.event_country ?? org.s.a?.country].filter(Boolean),
            candidate: [c.s.a?.country, ...arr(c.s.b?.geographies_covered)].filter(Boolean),
          },
        ]);
      }
    }
  }

  // ── Persist ────────────────────────────────────────────────────────────────
  const { data: existing } = await mdb()
    .from("match_scores")
    .select("id, pairing_type, subject_id, candidate_user_id, queue_status");
  const key = (p: string, s: string, c: string) => `${p}|${s}|${c}`;
  const existingByKey = new Map(
    (
      (existing ?? []) as {
        id: string;
        pairing_type: string;
        subject_id: string;
        candidate_user_id: string;
        queue_status: string;
      }[]
    ).map((r) => [key(r.pairing_type, r.subject_id, r.candidate_user_id), r]),
  );
  const seen = new Set<string>();
  let queued = 0;

  for (const c of candidates) {
    const k = key(c.pairing, c.subjectId, c.candidateUserId);
    seen.add(k);
    const prior = existingByKey.get(k);
    const row = {
      pairing_type: c.pairing,
      subject_kind: c.subjectKind,
      subject_id: c.subjectId,
      subject_user_id: c.subjectUserId,
      subject_role: c.subjectRole,
      candidate_user_id: c.candidateUserId,
      candidate_role: c.candidateRole,
      base_score: c.result.base,
      secondary_score: c.result.secondary,
      composite_score: c.result.composite,
      user_summary_for_subject: c.summaryForSubject,
      user_summary_for_candidate: c.summaryForCandidate,
      computed_at: new Date().toISOString(),
    };
    let id = prior?.id as string | undefined;
    if (prior) {
      // A decided match keeps its decision; only its numbers refresh.
      await mdb().from("match_scores").update(row).eq("id", prior.id);
      if (prior.queue_status !== "pending" && prior.queue_status !== "deferred") continue;
    } else {
      const { data: ins } = await mdb()
        .from("match_scores")
        .insert({ ...row, why_user_text: whyLine(c.result.explanations) })
        .select("id")
        .single();
      id = ins?.id;
      queued += 1;
    }
    if (!id) continue;
    await mdb().from("match_explanations").delete().eq("match_id", id);
    if (c.result.explanations.length) {
      await mdb()
        .from("match_explanations")
        .insert(
          c.result.explanations.map((x) => ({
            match_id: id,
            field_name: x.field,
            is_primary: x.primary,
            field_value_subject: x.subjectValue.slice(0, 500),
            field_value_candidate: x.candidateValue.slice(0, 500),
            contribution_weight: x.contribution,
            internal_display_text: x.internalText.slice(0, 500),
            user_facing_display_text: x.userText,
          })),
        );
    }
    if (prior) {
      await mdb()
        .from("match_scores")
        .update({ why_user_text: whyLine(c.result.explanations) })
        .eq("id", id);
    }
  }

  // Undecided candidates that no longer qualify (an event passed, a profile
  // changed or paused) leave the queue. Hand-made matches are never removed.
  const stale = (
    (existing ?? []) as {
      id: string;
      pairing_type: string;
      subject_id: string;
      candidate_user_id: string;
      queue_status: string;
    }[]
  ).filter(
    (r) =>
      (r.queue_status === "pending" || r.queue_status === "deferred") &&
      !seen.has(key(r.pairing_type, r.subject_id, r.candidate_user_id)),
  );
  if (stale.length) {
    await mdb()
      .from("match_scores")
      .delete()
      .in(
        "id",
        stale.map((r) => r.id),
      )
      .is("created_manually_by", null);
  }

  return { scored: candidates.length, queued, removed: stale.length };
}
