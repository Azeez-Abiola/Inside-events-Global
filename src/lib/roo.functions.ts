import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { objectiveReturn, roiScore } from "@/lib/roo-score";

export { objectiveReturn, roiScore };

/**
 * Return on Objective engine (TAB 8 §8.3), the Sponsorship Setup Flow
 * (TAB 4 §4.1) and the data behind the Business Case and Investment Report.
 *
 * The ROO breakdown is the primary evidence; the IGE ROI Score is a single
 * composite for cross-event comparison, shown last and always described as
 * IGE's own methodology, never an independent certification (TAB 21 §21.5.6).
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   these tables postdate the generated types. */
const rdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const STANDARD_OBJECTIVES: { name: string; pillar: "money" | "brand" | "business" }[] = [
  { name: "Awareness", pillar: "brand" },
  { name: "Lead generation", pillar: "business" },
  { name: "Sales lift", pillar: "business" },
  { name: "Relationship-building", pillar: "business" },
  { name: "Talent recruitment", pillar: "business" },
  { name: "Community / ESG positioning", pillar: "brand" },
  { name: "Product trial", pillar: "brand" },
  { name: "Value for money", pillar: "money" },
];

export interface SectorPack {
  id: string;
  pack_name: string;
  default_objectives: string[];
  default_weights: number[];
  default_kpis: string[];
  pillar_emphasis: string;
  benchmark_note: string | null;
}

export interface Objective {
  objective_name: string;
  spend_weight_pct: number;
  pillar: "money" | "brand" | "business";
  kpi: string | null;
  target_value: number | null;
  achieved_value: number | null;
  is_self_reported: boolean;
}

export interface InvestmentReport {
  rights_fee: number | null;
  fair_market_value: number | null;
  attendees_reached: number | null;
  leads_captured: number | null;
  pipeline_value: number | null;
  awareness_lift_pct: number | null;
  sentiment_note: string | null;
  competitors_present: string | null;
  outlook_90_day: string | null;
  renewal_recommended: boolean | null;
  roi_score: number | null;
  generated_at: string | null;
}

export interface RoiDeal {
  id: string;
  status: string;
  my_side: "sponsor" | "organiser";
  value: number | null;
  currency: string | null;
  event: {
    id: string;
    name: string;
    event_type: string | null;
    start_date: string | null;
    end_date: string | null;
    city: string | null;
    country: string | null;
    attendance_size: number | null;
    primary_audience: string | null;
    primary_sector: string | null;
    audience_seniority: string | null;
    decision_makers_pct: number | null;
  } | null;
  setup: { sector_pack_id: string | null; locked_at: string | null } | null;
  objectives: Objective[];
  report: InvestmentReport | null;
  evidence: { kind: string; caption: string | null; attendance_count: number | null }[];
}

async function myDeal(userId: string, dealId: string) {
  const { data: d } = await rdb()
    .from("deals")
    .select("id, organiser_id, sponsor_user_id")
    .eq("id", dealId)
    .maybeSingle();
  if (!d || (d.organiser_id !== userId && d.sponsor_user_id !== userId))
    throw new Error("Deal not found.");
  return d.sponsor_user_id === userId ? "sponsor" : "organiser";
}

const num = (v: unknown) => (v == null ? null : Number(v));

export const getRoiWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const [{ data: deals }, { data: packs }] = await Promise.all([
      rdb()
        .from("deals")
        .select(
          "id, status, event_id, organiser_id, sponsor_user_id, deal_value_native, deal_currency",
        )
        .or(`sponsor_user_id.eq.${uid},organiser_id.eq.${uid}`)
        .in("status", [
          "verbal_commitment",
          "contract_sent",
          "contract_signed",
          "payment_received",
          "deal_closed",
        ])
        .order("updated_at", { ascending: false }),
      rdb().from("sector_packs").select("*").order("position"),
    ]);
    const D = (deals ?? []) as Record<string, string | number | null>[];
    if (!D.length) return { deals: [] as RoiDeal[], packs: (packs ?? []) as SectorPack[] };
    const ids = D.map((d) => d.id as string);
    const eventIds = [...new Set(D.map((d) => d.event_id as string))];
    const [
      { data: events },
      { data: setups },
      { data: weights },
      { data: reports },
      { data: acts },
    ] = await Promise.all([
      rdb()
        .from("events")
        .select(
          "id, name, event_type, start_date, end_date, city, country, attendance_size, primary_audience, primary_sector, audience_seniority, decision_makers_pct",
        )
        .in("id", eventIds),
      rdb().from("sponsorship_setups").select("*").in("deal_id", ids),
      rdb().from("objective_weights").select("*").in("deal_id", ids),
      rdb().from("investment_reports").select("*").in("deal_id", ids),
      // Activation evidence feeds the value-for-brand story (TAB 4 Module 4A).
      rdb().from("activations").select("id, event_id").in("event_id", eventIds),
    ]);
    const actIds = ((acts ?? []) as { id: string; event_id: string }[]).map((a) => a.id);
    const { data: evidence } = actIds.length
      ? await rdb()
          .from("activation_evidence")
          .select("activation_id, kind, caption, attendance_count")
          .in("activation_id", actIds)
      : { data: [] };
    const evOf = (eventId: string) =>
      ((acts ?? []) as { id: string; event_id: string }[])
        .filter((a) => a.event_id === eventId)
        .map((a) => a.id);

    return {
      packs: (packs ?? []) as SectorPack[],
      deals: D.map((d) => {
        const e =
          ((events ?? []) as Record<string, unknown>[]).find((x) => x.id === d.event_id) ?? null;
        const r =
          ((reports ?? []) as Record<string, unknown>[]).find((x) => x.deal_id === d.id) ?? null;
        const s =
          ((setups ?? []) as Record<string, string | null>[]).find((x) => x.deal_id === d.id) ??
          null;
        const mine = new Set(evOf(d.event_id as string));
        return {
          id: d.id as string,
          status: d.status as string,
          my_side: d.sponsor_user_id === uid ? "sponsor" : "organiser",
          value: num(d.deal_value_native),
          currency: (d.deal_currency as string) ?? null,
          event: e
            ? {
                id: e.id as string,
                name: e.name as string,
                event_type: (e.event_type as string) ?? null,
                start_date: (e.start_date as string) ?? null,
                end_date: (e.end_date as string) ?? null,
                city: (e.city as string) ?? null,
                country: (e.country as string) ?? null,
                attendance_size: num(e.attendance_size),
                primary_audience: e.primary_audience ? String(e.primary_audience) : null,
                primary_sector: (e.primary_sector as string) ?? null,
                audience_seniority: (e.audience_seniority as string) ?? null,
                decision_makers_pct: num(e.decision_makers_pct),
              }
            : null,
          setup: s ? { sector_pack_id: s.sector_pack_id, locked_at: s.locked_at } : null,
          objectives: ((weights ?? []) as Record<string, unknown>[])
            .filter((w) => w.deal_id === d.id)
            .map((w) => ({
              objective_name: w.objective_name as string,
              spend_weight_pct: Number(w.spend_weight_pct),
              pillar: w.pillar as Objective["pillar"],
              kpi: (w.kpi as string) ?? null,
              target_value: num(w.target_value),
              achieved_value: num(w.achieved_value),
              is_self_reported: !!w.is_self_reported,
            })),
          report: r
            ? {
                rights_fee: num(r.rights_fee),
                fair_market_value: num(r.fair_market_value),
                attendees_reached: num(r.attendees_reached),
                leads_captured: num(r.leads_captured),
                pipeline_value: num(r.pipeline_value),
                awareness_lift_pct: num(r.awareness_lift_pct),
                sentiment_note: (r.sentiment_note as string) ?? null,
                competitors_present: (r.competitors_present as string) ?? null,
                outlook_90_day: (r.outlook_90_day as string) ?? null,
                renewal_recommended: (r.renewal_recommended as boolean) ?? null,
                roi_score: num(r.roi_score),
                generated_at: (r.generated_at as string) ?? null,
              }
            : null,
          evidence: (
            (evidence ?? []) as {
              activation_id: string;
              kind: string;
              caption: string | null;
              attendance_count: number | null;
            }[]
          )
            .filter((x) => mine.has(x.activation_id))
            .map(({ kind, caption, attendance_count }) => ({ kind, caption, attendance_count })),
        } satisfies RoiDeal;
      }),
    };
  });

/** Steps 1–3 of the Sponsorship Setup Flow. Sponsor side only; refused once locked. */
export const saveSponsorshipSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        deal_id: z.string().uuid(),
        sector_pack_id: z.string().max(40).nullish(),
        objectives: z
          .array(
            z.object({
              objective_name: z.string().trim().min(1).max(120),
              spend_weight_pct: z.number().int().min(0).max(100),
              pillar: z.enum(["money", "brand", "business"]),
              kpi: z.string().trim().max(200).optional(),
              target_value: z.number().nonnegative().nullish(),
            }),
          )
          .min(1, "Pick at least one objective.")
          .max(12),
        lock: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const side = await myDeal(context.userId, data.deal_id);
    if (side !== "sponsor")
      throw new Error("The sponsor sets the objectives for their sponsorship.");
    const total = data.objectives.reduce((n, o) => n + o.spend_weight_pct, 0);
    // "Continue disabled until it reads exactly 100%."
    if (total !== 100)
      throw new Error(`Weights add up to ${total}%. They must total exactly 100%.`);
    const { data: setup } = await rdb()
      .from("sponsorship_setups")
      .select("locked_at")
      .eq("deal_id", data.deal_id)
      .maybeSingle();
    if (setup?.locked_at)
      throw new Error("These weights are locked. Ask IGE if they genuinely need to change.");

    const now = new Date().toISOString();
    await rdb()
      .from("sponsorship_setups")
      .upsert({
        deal_id: data.deal_id,
        sector_pack_id: data.sector_pack_id ?? null,
        updated_at: now,
        ...(data.lock ? { locked_at: now, locked_by: context.userId } : {}),
      });
    await rdb().from("objective_weights").delete().eq("deal_id", data.deal_id);
    const { error } = await rdb()
      .from("objective_weights")
      .insert(
        data.objectives.map((o) => ({
          deal_id: data.deal_id,
          objective_name: o.objective_name,
          spend_weight_pct: o.spend_weight_pct,
          pillar: o.pillar,
          kpi: o.kpi || null,
          target_value: o.target_value ?? null,
        })),
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Post-event results and Investment Report inputs. Either party may record them; both are labelled self-reported. */
export const saveInvestmentReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        deal_id: z.string().uuid(),
        achieved: z.record(z.string(), z.number().nonnegative().nullable()).optional(),
        rights_fee: z.number().nonnegative().nullish(),
        fair_market_value: z.number().nonnegative().nullish(),
        attendees_reached: z.number().int().nonnegative().nullish(),
        leads_captured: z.number().int().nonnegative().nullish(),
        pipeline_value: z.number().nonnegative().nullish(),
        awareness_lift_pct: z.number().min(-100).max(1000).nullish(),
        sentiment_note: z.string().trim().max(2000).optional(),
        competitors_present: z.string().trim().max(1000).optional(),
        outlook_90_day: z.string().trim().max(2000).optional(),
        renewal_recommended: z.boolean().nullish(),
        generate: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await myDeal(context.userId, data.deal_id);
    for (const [name, value] of Object.entries(data.achieved ?? {})) {
      await rdb()
        .from("objective_weights")
        .update({ achieved_value: value, is_self_reported: true })
        .eq("deal_id", data.deal_id)
        .eq("objective_name", name);
    }
    const { data: weights } = await rdb()
      .from("objective_weights")
      .select("*")
      .eq("deal_id", data.deal_id);
    const score = roiScore(
      ((weights ?? []) as Record<string, unknown>[]).map((w) => ({
        objective_name: w.objective_name as string,
        spend_weight_pct: Number(w.spend_weight_pct),
        pillar: w.pillar as Objective["pillar"],
        kpi: null,
        target_value: num(w.target_value),
        achieved_value: num(w.achieved_value),
        is_self_reported: true,
      })),
    );
    const now = new Date().toISOString();
    const { error } = await rdb()
      .from("investment_reports")
      .upsert(
        {
          deal_id: data.deal_id,
          rights_fee: data.rights_fee ?? null,
          fair_market_value: data.fair_market_value ?? null,
          attendees_reached: data.attendees_reached ?? null,
          leads_captured: data.leads_captured ?? null,
          pipeline_value: data.pipeline_value ?? null,
          awareness_lift_pct: data.awareness_lift_pct ?? null,
          sentiment_note: data.sentiment_note || null,
          competitors_present: data.competitors_present || null,
          outlook_90_day: data.outlook_90_day || null,
          renewal_recommended: data.renewal_recommended ?? null,
          roi_score: score,
          updated_at: now,
          ...(data.generate ? { generated_at: now } : {}),
        },
        { onConflict: "deal_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const, roi_score: score };
  });

/** Locked weights change only by a logged admin override (TAB 4 §4.1). */
export const adminUnlockWeights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ deal_id: z.string().uuid(), reason: z.string().trim().min(5).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "revenue");
    const { data: s } = await rdb()
      .from("sponsorship_setups")
      .select("override_log")
      .eq("deal_id", data.deal_id)
      .maybeSingle();
    const log = Array.isArray(s?.override_log) ? s.override_log : [];
    await rdb()
      .from("sponsorship_setups")
      .update({
        locked_at: null,
        override_log: [
          ...log,
          { by: context.userId, at: new Date().toISOString(), reason: data.reason },
        ],
      })
      .eq("deal_id", data.deal_id);
    await recordAdminAudit({
      actorId: context.userId,
      action: "user_profile_edited",
      summary: `Unlocked ROO weights on a deal: ${data.reason}`,
      resourceType: "deal",
      resourceId: data.deal_id,
    }).catch(() => {});
    return { ok: true as const };
  });
