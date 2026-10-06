import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashShortOtp, SHORT_OTP_MAX_ATTEMPTS } from "@/lib/email/short-otp";

/**
 * Redeem a short verification code for the Supabase token it stands in for.
 *
 * The person types the 4 digits we emailed. This checks them, and on success
 * hands back the `token_hash` Supabase issued for the same action, which the
 * client passes to `verifyOtp`. Supabase still decides whether the email is
 * confirmed and still mints the session — the short code only changes what
 * was printed in the email.
 *
 * Unauthenticated by necessity: the whole point is that the person has no
 * session yet. Everything that protects it is below.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   `email_otp_aliases` postdates the last `supabase gen types` run; same cast
   convention as odb()/adb() elsewhere. */
const edb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface AliasRow {
  id: string;
  token_hash: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
  consumed_at: string | null;
}

/**
 * One message for every failure. A code that is wrong, expired, already used,
 * or out of attempts must look identical from outside — otherwise the
 * responses tell an attacker which addresses have a live code waiting.
 */
const GENERIC_FAILURE = "That code is wrong or has expired. Request a new one.";

export const redeemEmailOtp = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        code: z
          .string()
          .trim()
          .regex(/^\d{4,10}$/, "Enter the digits from your email."),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();

    const { data: rows } = await edb()
      .from("email_otp_aliases")
      .select("id, token_hash, code_hash, attempts, expires_at, consumed_at")
      .ilike("email", email)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    const alias = ((rows ?? []) as AliasRow[])[0];
    if (!alias) throw new Error(GENERIC_FAILURE);

    if (new Date(alias.expires_at).getTime() < Date.now()) {
      throw new Error(GENERIC_FAILURE);
    }

    // Count the attempt before comparing, so a crash between the two cannot
    // hand an attacker a free guess.
    const attempts = alias.attempts + 1;
    await edb().from("email_otp_aliases").update({ attempts }).eq("id", alias.id);

    if (attempts > SHORT_OTP_MAX_ATTEMPTS) {
      // Burn it. Four digits is 10,000 values; unlimited guessing would walk
      // it in minutes.
      await edb()
        .from("email_otp_aliases")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", alias.id);
      throw new Error(GENERIC_FAILURE);
    }

    if (hashShortOtp(data.code) !== alias.code_hash) {
      throw new Error(GENERIC_FAILURE);
    }

    // Single use. Marked before returning, so a replayed request finds it
    // consumed even if the caller never completes verifyOtp.
    await edb()
      .from("email_otp_aliases")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", alias.id);

    return { ok: true as const, tokenHash: alias.token_hash };
  });
