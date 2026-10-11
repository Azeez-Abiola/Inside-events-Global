import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { notifyAdmins } from "@/lib/admin-notify";

/**
 * Deliverable Matrix & Contract Compliance (TAB 4 §4.1 Module 5).
 *
 * Both sides of a deal see the same matrix; each line needs proof before it
 * can be Delivered. The exclusivity check runs whenever the matrix is opened,
 * so a conflict is caught before commitment, not after the logo goes up.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   these tables postdate the generated types. */
const ddb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const ITEM_STATUSES = ["promised", "in_progress", "delivered", "changed", "missed"] as const;
const LIVE_DEAL_STATUSES = [
  "in_negotiation",
  "verbal_commitment",
  "contract_sent",
  "contract_signed",
  "payment_received",
];

export interface DeliverableItem {
  id: string;
  deal_id: string;
  asset_type: string;
  quantity: number;
  placement_channel: string | null;
  due_date: string | null;
  owner_side: "organiser" | "sponsor";
  owner_name: string | null;
  status: (typeof ITEM_STATUSES)[number];
  proof_url: string | null;
  notes: string | null;
}

export interface ApprovalRequest {
  id: string;
  deal_id: string;
  item_id: string | null;
  title: string;
  content_url: string;
  approver_side: "organiser" | "sponsor";
  turnaround_due_at: string;
  status: "pending" | "approved" | "changes_requested" | "escalated";
  response_note: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface MatrixDeal {
  id: string;
  event_id: string;
  event_name: string;
  status: string;
  my_side: "organiser" | "sponsor";
  counterpart: string;
  value: number | null;
  currency: string | null;
  category: string | null;
}

/** Five business days from now (§Module 5 default turnaround). */
function addBusinessDays(from: Date, days: number) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) added += 1;
  }
  return d;
}

async function myDeal(userId: string, dealId: string) {
  const { data: d } = await ddb()
    .from("deals")
    .select("id, event_id, organiser_id, sponsor_user_id, status")
    .eq("id", dealId)
    .maybeSingle();
  if (!d || (d.organiser_id !== userId && d.sponsor_user_id !== userId))
    throw new Error("Deal not found.");
  return {
    deal: d,
    side: (d.organiser_id === userId ? "organiser" : "sponsor") as "organiser" | "sponsor",
  };
}

/** A sponsor's declared category: their onboarding industry (TAB 3 §3.6.2 A). */
async function sponsorCategories(userIds: string[]) {
  if (!userIds.length) return new Map<string, string>();
  const { data } = await ddb()
    .from("onboarding_applications")
    .select("user_id, sections")
    .in("user_id", userIds);
  return new Map(
    ((data ?? []) as { user_id: string; sections: { a?: { industry?: string } } }[])
      .filter((a) => a.sections?.a?.industry && a.sections.a.industry !== "Other")
      .map((a) => [a.user_id, a.sections.a!.industry!]),
  );
}

/**
 * Category Exclusivity Tracker: any two live deals on one event whose sponsors
 * declare the same category are flagged. Persisted so Admin's Deal Oversight
 * sees them (TAB 6 §6.4).
 */
async function checkExclusivity(eventIds: string[]) {
  if (!eventIds.length) return;
  const { data: deals } = await ddb()
    .from("deals")
    .select("id, event_id, sponsor_user_id, status")
    .in("event_id", eventIds)
    .in("status", LIVE_DEAL_STATUSES);
  const D = (deals ?? []) as { id: string; event_id: string; sponsor_user_id: string | null }[];
  const cats = await sponsorCategories(D.map((d) => d.sponsor_user_id).filter(Boolean) as string[]);
  const flags: Record<string, string>[] = [];
  for (const a of D) {
    for (const b of D) {
      if (a.id >= b.id || a.event_id !== b.event_id || a.sponsor_user_id === b.sponsor_user_id)
        continue;
      const ca = a.sponsor_user_id ? cats.get(a.sponsor_user_id) : null;
      const cb = b.sponsor_user_id ? cats.get(b.sponsor_user_id) : null;
      if (ca && cb && ca === cb) {
        flags.push({
          event_id: a.event_id,
          deal_id: b.id,
          conflicting_deal_id: a.id,
          declared_category: ca,
        });
      }
    }
  }
  for (const f of flags) {
    const { data: existing } = await ddb()
      .from("exclusivity_flags")
      .select("id")
      .eq("deal_id", f.deal_id)
      .eq("conflicting_deal_id", f.conflicting_deal_id)
      .maybeSingle();
    if (!existing) {
      await ddb().from("exclusivity_flags").insert(f);
      await notifyAdmins({
        type: "exclusivity_conflict",
        title: "Category exclusivity conflict",
        body: `Two live deals on the same event are both in ${f.declared_category}. Check the exclusivity terms before either commits.`,
        data: f,
      }).catch(() => {});
    }
  }
}

export const getDeliverableMatrix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const { data: deals } = await ddb()
      .from("deals")
      .select(
        "id, event_id, organiser_id, sponsor_user_id, status, deal_value_native, deal_currency, commitment_form_id",
      )
      .or(`organiser_id.eq.${uid},sponsor_user_id.eq.${uid}`)
      .in("status", LIVE_DEAL_STATUSES.concat(["deal_closed"]))
      .order("updated_at", { ascending: false });
    const D = (deals ?? []) as Record<string, string | number | null>[];
    if (!D.length)
      return {
        deals: [] as MatrixDeal[],
        items: [] as DeliverableItem[],
        approvals: [] as ApprovalRequest[],
        flags: [] as { deal_id: string; declared_category: string; conflicting_deal_id: string }[],
      };

    const eventIds = [...new Set(D.map((d) => d.event_id as string))];
    await checkExclusivity(eventIds).catch(() => {});

    const ids = D.map((d) => d.id as string);
    const [
      { data: events },
      { data: forms },
      { data: items },
      { data: approvals },
      { data: flags },
      cats,
    ] = await Promise.all([
      ddb().from("events").select("id, name").in("id", eventIds),
      ddb()
        .from("commitment_forms")
        .select("id, company_name")
        .in("id", D.map((d) => d.commitment_form_id).filter(Boolean)),
      ddb()
        .from("deliverable_items")
        .select("*")
        .in("deal_id", ids)
        .order("due_date", { nullsFirst: false }),
      ddb()
        .from("approval_requests")
        .select("*")
        .in("deal_id", ids)
        .order("created_at", { ascending: false }),
      ddb()
        .from("exclusivity_flags")
        .select("deal_id, conflicting_deal_id, declared_category, resolution_status")
        .or(`deal_id.in.(${ids.join(",")}),conflicting_deal_id.in.(${ids.join(",")})`)
        .eq("resolution_status", "open"),
      sponsorCategories(D.map((d) => d.sponsor_user_id).filter(Boolean) as string[]),
    ]);
    const evName = new Map(
      ((events ?? []) as { id: string; name: string }[]).map((e) => [e.id, e.name]),
    );
    const company = new Map(
      ((forms ?? []) as { id: string; company_name: string }[]).map((f) => [f.id, f.company_name]),
    );
    return {
      deals: D.map((d) => {
        const mySide = d.organiser_id === uid ? "organiser" : "sponsor";
        return {
          id: d.id as string,
          event_id: d.event_id as string,
          event_name: evName.get(d.event_id as string) ?? "Event",
          status: d.status as string,
          my_side: mySide,
          // A deal party already knows their counterpart — they negotiated it.
          counterpart:
            mySide === "organiser"
              ? (company.get(d.commitment_form_id as string) ?? "Sponsor")
              : (evName.get(d.event_id as string) ?? "Organiser"),
          value: d.deal_value_native != null ? Number(d.deal_value_native) : null,
          currency: (d.deal_currency as string) ?? null,
          category: d.sponsor_user_id ? (cats.get(d.sponsor_user_id as string) ?? null) : null,
        } satisfies MatrixDeal;
      }),
      items: (items ?? []) as DeliverableItem[],
      approvals: (approvals ?? []) as ApprovalRequest[],
      flags: (flags ?? []) as {
        deal_id: string;
        declared_category: string;
        conflicting_deal_id: string;
      }[],
    };
  });

const ItemInput = z.object({
  id: z.string().uuid().optional(),
  deal_id: z.string().uuid(),
  asset_type: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(0).max(100000).optional(),
  placement_channel: z.string().trim().max(200).optional(),
  due_date: z.string().max(20).nullish(),
  owner_side: z.enum(["organiser", "sponsor"]).optional(),
  owner_name: z.string().trim().max(200).optional(),
  status: z.enum(ITEM_STATUSES).optional(),
  proof_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional(),
});

export const upsertDeliverable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ItemInput.parse(d))
  .handler(async ({ data, context }) => {
    await myDeal(context.userId, data.deal_id);
    if (data.status === "delivered" && !data.proof_url) {
      throw new Error("Attach proof of delivery before marking a line Delivered.");
    }
    const row = {
      deal_id: data.deal_id,
      asset_type: data.asset_type,
      quantity: data.quantity ?? 1,
      placement_channel: data.placement_channel || null,
      due_date: data.due_date || null,
      owner_side: data.owner_side ?? "organiser",
      owner_name: data.owner_name || null,
      status: data.status ?? "promised",
      proof_url: data.proof_url || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await ddb()
          .from("deliverable_items")
          .update(row)
          .eq("id", data.id)
          .eq("deal_id", data.deal_id)
      : await ddb()
          .from("deliverable_items")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteDeliverable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), deal_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await myDeal(context.userId, data.deal_id);
    await ddb().from("deliverable_items").delete().eq("id", data.id).eq("deal_id", data.deal_id);
    return { ok: true as const };
  });

export const requestApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        deal_id: z.string().uuid(),
        item_id: z.string().uuid().nullish(),
        title: z.string().trim().min(1).max(200),
        content_url: z.string().trim().url().max(500),
        business_days: z.number().int().min(1).max(30).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { side } = await myDeal(context.userId, data.deal_id);
    const { error } = await ddb()
      .from("approval_requests")
      .insert({
        deal_id: data.deal_id,
        item_id: data.item_id ?? null,
        title: data.title,
        content_url: data.content_url,
        requested_by: context.userId,
        approver_side: side === "organiser" ? "sponsor" : "organiser",
        turnaround_due_at: addBusinessDays(new Date(), data.business_days ?? 5).toISOString(),
      });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const respondApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "changes_requested"]),
        note: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: r } = await ddb()
      .from("approval_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!r) throw new Error("Request not found.");
    const { side } = await myDeal(context.userId, r.deal_id);
    if (side !== r.approver_side)
      throw new Error("This request is waiting on the other side of the deal.");
    await ddb()
      .from("approval_requests")
      .update({
        status: data.decision,
        response_note: data.note ?? null,
        responded_at: new Date().toISOString(),
      })
      .eq("id", r.id);
    return { ok: true as const };
  });

/** Run by the daily job: unanswered requests past their window escalate to Admin. */
export async function escalateOverdueApprovals(): Promise<number> {
  const { data } = await ddb()
    .from("approval_requests")
    .update({ status: "escalated" })
    .eq("status", "pending")
    .lt("turnaround_due_at", new Date().toISOString())
    .select("id, title, deal_id");
  const rows = (data ?? []) as { id: string; title: string; deal_id: string }[];
  for (const r of rows) {
    await notifyAdmins({
      type: "approval_escalated",
      title: `Approval overdue: ${r.title}`,
      body: "A creative or content approval passed its turnaround window without an answer and has been escalated to Deal Oversight.",
      data: { approval_id: r.id, deal_id: r.deal_id },
    }).catch(() => {});
  }
  return rows.length;
}

// ─── Admin: Deal Oversight queues (TAB 6 §6.4) ───────────────────────────────

export const adminComplianceQueues = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminPermission(context.userId, "revenue");
    const [{ data: flags }, { data: escalated }] = await Promise.all([
      ddb()
        .from("exclusivity_flags")
        .select("*")
        .eq("resolution_status", "open")
        .order("flagged_at", { ascending: false }),
      ddb()
        .from("approval_requests")
        .select("*")
        .eq("status", "escalated")
        .order("turnaround_due_at"),
    ]);
    const eventIds = [...new Set(((flags ?? []) as { event_id: string }[]).map((f) => f.event_id))];
    const { data: events } = eventIds.length
      ? await ddb().from("events").select("id, name").in("id", eventIds)
      : { data: [] };
    return {
      flags: (
        (flags ?? []) as {
          id: string;
          event_id: string;
          deal_id: string;
          conflicting_deal_id: string;
          declared_category: string;
          flagged_at: string;
        }[]
      ).map((f) => ({
        ...f,
        event_name:
          ((events ?? []) as { id: string; name: string }[]).find((e) => e.id === f.event_id)
            ?.name ?? "Event",
      })),
      escalated: (escalated ?? []) as ApprovalRequest[],
    };
  });

export const adminResolveFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        resolution: z.enum(["resolved", "dismissed"]),
        note: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "revenue");
    await ddb()
      .from("exclusivity_flags")
      .update({
        resolution_status: data.resolution,
        resolution_note: data.note ?? null,
        resolved_by: context.userId,
      })
      .eq("id", data.id);
    return { ok: true as const };
  });
