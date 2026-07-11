import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";

const SITE_URL = process.env.VITE_SITE_URL || "https://www.insideglobalevents.com";

async function ensureAdmin(supabase: any, userId: string) {
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r: any) => r.role === "abw_admin" || r.role === "super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
}

function stripeAmountCents(amount: number, currency: string) {
  const zeroDecimal = new Set(["jpy"]);
  if (zeroDecimal.has(currency.toLowerCase())) return Math.round(amount);
  return Math.round(amount * 100);
}

async function createStripeCheckoutLink(opts: {
  dealId: string;
  amount: number;
  currency: string;
  eventName: string;
  sponsorEmail: string;
}) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");

  const currency = opts.currency.toLowerCase();
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("customer_email", opts.sponsorEmail);
  params.set("success_url", `${SITE_URL}/dashboard/pipeline?payment=success&deal=${opts.dealId}`);
  params.set("cancel_url", `${SITE_URL}/dashboard/pipeline?payment=cancelled&deal=${opts.dealId}`);
  params.set("metadata[deal_id]", opts.dealId);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", currency);
  params.set("line_items[0][price_data][unit_amount]", String(stripeAmountCents(opts.amount, currency)));
  params.set(
    "line_items[0][price_data][product_data][name]",
    `IGE sponsorship — ${opts.eventName}`.slice(0, 120),
  );

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Stripe checkout failed");
  return { url: json.url as string, provider: "stripe" as const, expiresAt: null as string | null };
}

async function createPaystackLink(opts: {
  dealId: string;
  amount: number;
  sponsorEmail: string;
  eventName: string;
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack is not configured (PAYSTACK_SECRET_KEY missing)");

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: opts.sponsorEmail,
      amount: Math.round(opts.amount * 100),
      currency: "NGN",
      callback_url: `${SITE_URL}/dashboard/pipeline?payment=success&deal=${opts.dealId}`,
      metadata: { deal_id: opts.dealId, event_name: opts.eventName },
    }),
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message ?? "Paystack initialize failed");
  return {
    url: json.data.authorization_url as string,
    provider: "paystack" as const,
    expiresAt: null as string | null,
  };
}

export const generateDealPaymentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ deal_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const { data: deal, error } = await supabaseAdmin
      .from("deals")
      .select(
        "id, event_id, deal_value_native, deal_currency, status, sponsor_user_id, payment_link_url, stripe_payment_intent_id, paystack_reference",
      )
      .eq("id", data.deal_id)
      .single();
    if (error || !deal) throw new Error("Deal not found");
    if (deal.status === "payment_received") throw new Error("Deal is already paid");
    const amount = Number(deal.deal_value_native ?? 0);
    if (!amount || amount <= 0) throw new Error("Set a deal value before generating a payment link");

    const [{ data: ev }, { data: sponsorProfile }] = await Promise.all([
      supabaseAdmin.from("events").select("name").eq("id", deal.event_id).single(),
      deal.sponsor_user_id
        ? supabaseAdmin.from("profiles").select("email").eq("id", deal.sponsor_user_id).single()
        : Promise.resolve({ data: null }),
    ]);
    const sponsorEmail = sponsorProfile?.email;
    if (!sponsorEmail) throw new Error("Deal has no sponsor email — assign a sponsor user first");

    const currency = (deal.deal_currency ?? "USD").toUpperCase();
    const link =
      currency === "NGN"
        ? await createPaystackLink({
            dealId: deal.id,
            amount,
            sponsorEmail,
            eventName: ev?.name ?? "Event sponsorship",
          })
        : await createStripeCheckoutLink({
            dealId: deal.id,
            amount,
            currency,
            eventName: ev?.name ?? "Event sponsorship",
            sponsorEmail,
          });

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("deals")
      .update({
        payment_link_url: link.url,
        payment_link_provider: link.provider,
        payment_link_created_at: now,
        payment_link_expires_at: link.expiresAt,
      } as never)
      .eq("id", deal.id);

    // Notify sponsor + email (best effort)
    if (deal.sponsor_user_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: deal.sponsor_user_id,
        type: "payment_link",
        title: "Payment link ready",
        body: `Complete your sponsorship payment for ${ev?.name ?? "your event"}.`,
        data: { deal_id: deal.id, url: link.url },
      });
      try {
        await sendTransactionalEmailServer({
          templateName: "payment-link",
          recipientEmail: sponsorEmail,
          idempotencyKey: `payment-link-${deal.id}-${now.slice(0, 10)}`,
          templateData: {
            eventName: ev?.name ?? "your event",
            amount: `${currency} ${amount.toLocaleString()}`,
            paymentUrl: link.url,
            dashboardUrl: `${SITE_URL}/dashboard/pipeline`,
          },
        });
      } catch (e) {
        console.error("[generateDealPaymentLink] email failed", e);
      }
    }

    return { url: link.url, provider: link.provider };
  });

export const getMyDealPaymentLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("deals")
      .select("id, event_id, deal_value_native, deal_currency, status, payment_link_url, payment_link_provider, payment_link_created_at")
      .or(`sponsor_user_id.eq.${userId},organiser_id.eq.${userId}`)
      .not("payment_link_url", "is", null)
      .order("payment_link_created_at", { ascending: false })
      .limit(20);
    const eventIds = Array.from(new Set((data ?? []).map((d) => d.event_id)));
    const events: Record<string, string> = {};
    if (eventIds.length) {
      const { data: evs } = await supabaseAdmin.from("events").select("id, name").in("id", eventIds);
      for (const e of evs ?? []) events[e.id] = e.name;
    }
    return { deals: data ?? [], events };
  });
