import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function hmacSha512Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/public/webhooks/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        const body = await request.text();
        const header = request.headers.get("x-paystack-signature");
        if (secret) {
          const expected = await hmacSha512Hex(secret, body);
          if (header !== expected) return new Response("Invalid signature", { status: 401 });
        }
        let evt: any;
        try { evt = JSON.parse(body); } catch { return new Response("Bad payload", { status: 400 }); }

        if (evt.event === "charge.success") {
          const tx = evt.data;
          const dealId = tx?.metadata?.deal_id ?? tx?.metadata?.custom_fields?.find?.((f: any) => f.variable_name === "deal_id")?.value;
          const amountNgn = tx?.amount ? tx.amount / 100 : null;
          if (dealId) {
            await supabaseAdmin
              .from("deals")
              .update({
                status: "payment_received",
                paystack_reference: tx.reference,
                paid_at: new Date().toISOString(),
                ...(amountNgn ? { deal_value_native: amountNgn } : {}),
              } as never)
              .eq("id", dealId);
            await supabaseAdmin.from("deal_status_history").insert({
              deal_id: dealId,
              to_status: "payment_received",
              note: `Paystack ref ${tx.reference}`,
            });
          }
        }
        return new Response("ok");
      },
      OPTIONS: async () => new Response(null, { status: 204 }),
    },
  },
});
