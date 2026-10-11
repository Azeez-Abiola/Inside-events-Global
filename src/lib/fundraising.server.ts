import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fromUsd, toUsd, type Rates } from "@/lib/currency";

/**
 * Fundraising Tracker maths (TAB 4 §4.2 Module 1), shared by the tracker
 * page and the organiser daily digest (TAB 18 §18.4).
 *
 * Gap remaining = target − committed − paid, shown against the days left to
 * the event. "Committed" is signed but unpaid; "paid" is money received —
 * from a platform deal or a payment the owner recorded in Vendors & Payments.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   event_funding_targets and workspace_payments postdate the last generated types. */
const fdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const COMMITTED = ["verbal_commitment", "contract_sent", "contract_signed"];

export interface TierFill {
  tier_name: string;
  slots_total: number | null;
  filled: number;
  price: number | null;
}

export interface FundraisingEvent {
  event_id: string;
  name: string;
  start_date: string | null;
  visibility: string | null;
  status: string | null;
  days_to_event: number | null;
  target: number | null;
  currency: string;
  committed: number;
  paid: number;
  gap: number | null;
  show_fill_to_sponsors: boolean;
  tiers: TierFill[];
  /** Amounts in currencies with no rate on IGE, left out rather than guessed. */
  unconverted: number;
}

const code = (c: string | null | undefined) => (c ?? "").split(" ")[0].toUpperCase() || "NGN";

/** Converts through USD at the latest stored rate; null if either side has no rate. */
function convert(amount: number, from: string, to: string, rates: Rates): number | null {
  if (code(from) === code(to)) return amount;
  const usd = toUsd(amount, code(from), rates);
  if (usd == null) return null;
  const target = code(to);
  if (target === "USD") return usd;
  if (target === "NGN" || target === "EUR") return fromUsd(usd, target, rates);
  if (target === "GBP") return usd * Number(rates?.gbp_rate ?? 0.79);
  return null;
}

export async function computeFundraising(userId: string): Promise<{ events: FundraisingEvent[] }> {
  const { data: events } = await fdb()
    .from("events")
    .select("id, name, start_date, end_date, visibility, status, currency")
    .eq("organiser_id", userId)
    .order("start_date", { ascending: true, nullsFirst: false });
  const E = (events ?? []) as Record<string, string | null>[];
  const ids = E.map((e) => e.id as string);
  if (!ids.length) return { events: [] as FundraisingEvent[] };

  const [targets, deals, tiers, payments, rate] = await Promise.all([
    fdb().from("event_funding_targets").select("*").in("event_id", ids),
    fdb()
      .from("deals")
      .select("event_id, status, deal_value_native, deal_currency")
      .in("event_id", ids),
    fdb()
      .from("event_sponsorship_tiers")
      .select("event_id, tier_name, slots_total, slots_remaining, price, display_order")
      .in("event_id", ids)
      .order("display_order"),
    fdb()
      .from("workspace_payments")
      .select("event_id, amount, currency, status")
      .eq("direction", "in")
      .in("event_id", ids),
    fdb()
      .from("exchange_rates")
      .select("ngn_rate, gbp_rate, eur_rate")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const rates = (rate.data ?? null) as Rates;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const out: FundraisingEvent[] = E.map((e) => {
    const id = e.id as string;
    const t = ((targets.data ?? []) as Record<string, unknown>[]).find((x) => x.event_id === id);
    const currency = code((t?.currency as string) ?? e.currency);
    let committed = 0;
    let paid = 0;
    let unconverted = 0;
    const add = (amount: number, cur: string, kind: "committed" | "paid") => {
      const v = convert(amount, cur, currency, rates);
      if (v == null) unconverted += 1;
      else if (kind === "paid") paid += v;
      else committed += v;
    };
    for (const d of (deals.data ?? []) as Record<string, string | number | null>[]) {
      if (d.event_id !== id) continue;
      const amt = Number(d.deal_value_native ?? 0);
      if (d.status === "payment_received") add(amt, String(d.deal_currency ?? currency), "paid");
      else if (COMMITTED.includes(String(d.status)))
        add(amt, String(d.deal_currency ?? currency), "committed");
    }
    for (const p of (payments.data ?? []) as Record<string, string | number | null>[]) {
      if (p.event_id !== id) continue;
      add(Number(p.amount ?? 0), String(p.currency), p.status === "paid" ? "paid" : "committed");
    }
    const target = t ? Number(t.target_amount) : null;
    const start = e.start_date ? Date.parse(`${e.start_date.slice(0, 10)}T00:00:00Z`) : null;
    return {
      event_id: id,
      name: e.name ?? "Untitled event",
      start_date: e.start_date ?? null,
      visibility: e.visibility ?? null,
      status: e.status ?? null,
      days_to_event: start != null ? Math.round((start - today.getTime()) / 86_400_000) : null,
      target,
      currency,
      committed: Math.round(committed),
      paid: Math.round(paid),
      gap: target != null ? Math.max(0, Math.round(target - committed - paid)) : null,
      show_fill_to_sponsors: !!t?.show_fill_to_sponsors,
      unconverted,
      tiers: ((tiers.data ?? []) as Record<string, string | number | null>[])
        .filter((x) => x.event_id === id)
        .map((x) => {
          const total = x.slots_total != null ? Number(x.slots_total) : null;
          const remaining = x.slots_remaining != null ? Number(x.slots_remaining) : total;
          return {
            tier_name: String(x.tier_name),
            slots_total: total,
            filled: total != null && remaining != null ? Math.max(0, total - remaining) : 0,
            price: x.price != null ? Number(x.price) : null,
          };
        }),
    };
  });
  return { events: out };
}
