import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// market_budgets is newer than the generated types — cast to bypass stale typings.
const db = (c: any) => c as any;

function toUsd(n: number, currency: string, rate: any) {
  const c = (currency || "USD").toUpperCase();
  if (c === "USD") return n;
  if (c === "NGN") return n / Number(rate?.ngn_rate ?? 1650);
  if (c === "GBP") return n / Number(rate?.gbp_rate ?? 0.79);
  if (c === "EUR") return n / Number(rate?.eur_rate ?? 0.92);
  return n;
}

// Committed = signed but not yet paid. Paid = payment received.
const COMMITTED_STATUSES = ["contract_sent", "contract_signed"];

export const getSponsorBudgets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: markets }, { data: deals }, { data: rate }] = await Promise.all([
      db(supabase)
        .from("market_budgets")
        .select("*")
        .eq("sponsor_user_id", userId)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("deals")
        .select(
          "status, deal_value_native, deal_currency, deal_value_usd, created_at, updated_at, paid_at",
        )
        .eq("sponsor_user_id", userId),
      supabaseAdmin
        .from("exchange_rates")
        .select("ngn_rate, gbp_rate, eur_rate")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    let committedUsd = 0;
    let paidUsd = 0;
    // Dated spend, so the planner can bucket it into the brand's own fiscal
    // quarters and work out pace (Module 1, Burn Rate & Pace Indicator).
    const spend: { date: string; usd: number; kind: "committed" | "paid" }[] = [];
    for (const d of deals ?? []) {
      if (d.status === "payment_received") {
        const usd =
          Number(d.deal_value_usd ?? 0) ||
          toUsd(Number(d.deal_value_native ?? 0), d.deal_currency, rate);
        paidUsd += usd;
        spend.push({
          date: (d.paid_at ?? d.updated_at ?? d.created_at) as string,
          usd,
          kind: "paid",
        });
      } else if (COMMITTED_STATUSES.includes(d.status)) {
        const usd = toUsd(Number(d.deal_value_native ?? 0), d.deal_currency, rate);
        committedUsd += usd;
        spend.push({ date: (d.updated_at ?? d.created_at) as string, usd, kind: "committed" });
      }
    }

    const totalUsd = (markets ?? []).reduce(
      (acc: number, m: any) => acc + toUsd(Number(m.total_annual ?? 0), m.currency, rate),
      0,
    );
    const remainingUsd = Math.max(0, totalUsd - committedUsd - paidUsd);

    return {
      markets: markets ?? [],
      spend,
      rate: rate ?? null,
      portfolio: {
        totalUsd,
        committedUsd,
        paidUsd,
        remainingUsd,
      },
    };
  });

const BudgetInput = z.object({
  id: z.string().uuid().optional(),
  region: z.string().trim().min(1).max(80),
  budget_name: z.string().trim().min(1).max(120),
  currency: z.enum(["USD", "NGN", "GBP", "EUR"]).default("USD"),
  fiscal_year_start_month: z.number().int().min(1).max(12).default(1),
  total_annual: z.number().nonnegative().default(0),
  q1_allocation: z.number().nonnegative().default(0),
  q2_allocation: z.number().nonnegative().default(0),
  q3_allocation: z.number().nonnegative().default(0),
  q4_allocation: z.number().nonnegative().default(0),
  sector_tags: z.array(z.string().max(80)).max(40).optional(),
  event_type_tags: z.array(z.string().max(80)).max(40).optional(),
});

export const upsertMarketBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => BudgetInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const market_name = `${data.budget_name} (${data.region})`;
    // Tag columns arrive with 20261011130000_budget_tags.sql. The client only
    // sends tags once the column exists or the user picked some, so saving
    // keeps working on a database that has not run it yet.
    const { sector_tags, event_type_tags, ...rest } = data;
    const row = {
      ...rest,
      market_name,
      sponsor_user_id: userId,
      ...(sector_tags !== undefined || event_type_tags !== undefined
        ? { sector_tags: sector_tags ?? [], event_type_tags: event_type_tags ?? [] }
        : {}),
    };
    const { error } = await db(supabase)
      .from("market_budgets")
      .upsert(row, { onConflict: "sponsor_user_id,market_name" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMarketBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await db(supabase)
      .from("market_budgets")
      .delete()
      .eq("id", data.id)
      .eq("sponsor_user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
