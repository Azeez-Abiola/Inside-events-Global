import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function verifyStripeSignature(payload: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => { const [k, v] = kv.split("="); return [k, v]; }),
  ) as Record<string, string>;
  if (!parts.t || !parts.v1) return false;
  const signed = `${parts.t}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === parts.v1;
}

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook secret not configured", { status: 500 });
        const body = await request.text();
        const ok = await verifyStripeSignature(body, request.headers.get("stripe-signature"), secret);
        if (!ok) return new Response("Invalid signature", { status: 401 });
        let evt: any;
        try { evt = JSON.parse(body); } catch { return new Response("Bad payload", { status: 400 }); }

        if (evt.type === "payment_intent.succeeded") {
          const pi = evt.data?.object;
          const dealId = pi?.metadata?.deal_id;
          const amount = pi?.amount_received ? pi.amount_received / 100 : null;
          if (dealId) {
            await supabaseAdmin
              .from("deals")
              .update({
                status: "payment_received",
                stripe_payment_intent_id: pi.id,
                paid_at: new Date().toISOString(),
                ...(amount ? { deal_value_native: amount } : {}),
              } as never)
              .eq("id", dealId);
            await supabaseAdmin.from("deal_status_history").insert({
              deal_id: dealId,
              to_status: "payment_received",
              note: `Stripe payment_intent ${pi.id}`,
            });
          }
        }
        return new Response("ok");
      },
      OPTIONS: async () => new Response(null, { status: 204 }),
    },
  },
});
