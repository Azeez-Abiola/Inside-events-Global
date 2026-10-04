import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Thrown when the signed-in account no longer exists. The client watches for
 * this exact string to clear the dead session rather than looping on it.
 */
export const STALE_SESSION_MESSAGE =
  "Your session points at an account that no longer exists. Sign out and sign up again.";

const SignupRoleSchema = z.enum([
  "organiser",
  "sponsor",
  "referral_partner",
  "media_partner",
  "partnerships_pro",
  "creative_hub",
]);

/** Assign signup role via service role — client INSERT is blocked by RLS; trigger may already have run. */
export const ensureSignupRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ role: SignupRoleSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: rows, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    const roles = (rows ?? []).map((r) => r.role as string);
    if (roles.includes(data.role)) return { ok: true, role: data.role };

    const existingSignup = roles.find((r) => SignupRoleSchema.safeParse(r).success);
    if (existingSignup) return { ok: true, role: existingSignup };

    const { error: insErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: data.role,
    } as never);
    if (insErr && !insErr.message.toLowerCase().includes("duplicate")) {
      // A JWT stays signature-valid after its account is deleted, and
      // getClaims only verifies the signature — it never asks whether the
      // user still exists. The foreign key is where that surfaces, as a raw
      // Postgres error the person cannot act on. Translate it into the one
      // thing that actually fixes it.
      if (insErr.message.includes("user_roles_user_id_fkey")) {
        throw new Error(STALE_SESSION_MESSAGE);
      }
      throw new Error(insErr.message);
    }

    return { ok: true, role: data.role };
  });
