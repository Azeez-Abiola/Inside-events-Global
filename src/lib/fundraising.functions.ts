import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeFundraising } from "@/lib/fundraising.server";
export type { FundraisingEvent, TierFill } from "@/lib/fundraising.server";

/**
 * Fundraising Tracker (TAB 4 §4.2 Module 1).
 *
 * Gap remaining = target − committed − paid, shown against the days left to
 * the event. "Committed" is signed but unpaid; "paid" is money received —
 * from a platform deal or a payment the owner recorded in Vendors & Payments.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- event_funding_targets postdates the generated types.
const fdb = (): any => supabaseAdmin as any;

export const getFundraising = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return computeFundraising(context.userId);
  });

export const setFundraisingTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        event_id: z.string().uuid(),
        target_amount: z.number().nonnegative(),
        currency: z.enum(["NGN", "USD", "GBP", "EUR"]),
        show_fill_to_sponsors: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: ev } = await fdb()
      .from("events")
      .select("organiser_id")
      .eq("id", data.event_id)
      .maybeSingle();
    if (!ev || ev.organiser_id !== context.userId) {
      throw new Error("Only the event owner can set its sponsorship target.");
    }
    const { error } = await fdb()
      .from("event_funding_targets")
      .upsert(
        {
          event_id: data.event_id,
          owner_id: context.userId,
          target_amount: data.target_amount,
          currency: data.currency,
          show_fill_to_sponsors: data.show_fill_to_sponsors ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
