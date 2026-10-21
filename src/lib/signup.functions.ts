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

/**
 * Give the account a signup role — or several (multi-role accounts). Runs on
 * the service role because RLS blocks client inserts into user_roles, and the
 * signup trigger may already have added some of them. `role` is the primary
 * pick: it becomes the active dashboard unless the account already has one.
 * Also how "Add a role" works from the dashboard.
 */
export const ensureSignupRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        role: SignupRoleSchema,
        extraRoles: z.array(SignupRoleSchema).max(6).optional(),
        makeActive: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: rows, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    const held = new Set((rows ?? []).map((r) => r.role as string));
    const wanted = [data.role, ...(data.extraRoles ?? [])].filter((r) => !held.has(r));
    for (const role of new Set(wanted)) {
      const { error: insErr } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role,
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
    }

    // Point the dashboard at the primary pick when asked to, or when the
    // account has no active role yet. `active_role` postdates the generated
    // types. Non-fatal: the client falls back to role priority.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdb = supabaseAdmin as any;
      const { data: prof } = await pdb
        .from("profiles")
        .select("active_role")
        .eq("id", userId)
        .maybeSingle();
      if (data.makeActive || !prof?.active_role) {
        await pdb.from("profiles").update({ active_role: data.role }).eq("id", userId);
      }
    } catch {
      /* see above */
    }

    return { ok: true, role: data.role };
  });

/** Switch which role's dashboard the account sees (sidebar role switcher). */
export const setMyActiveRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ role: SignupRoleSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: rows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", data.role as never);
    if (!(rows ?? []).length) throw new Error("Add this role to your account first.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- active_role postdates the generated types.
    const { error } = await (supabaseAdmin as any)
      .from("profiles")
      .update({ active_role: data.role })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Recover an account's role when the app finds none. Signup records the
 * chosen role on the account (user metadata) and in the onboarding
 * application as well as in user_roles, so a missing user_roles row — or a
 * client read that came back empty — should never strand someone on the
 * role picker. Returns the role, or null when none is recorded anywhere.
 */
export const recoverMyRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: rows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const existing = (rows ?? [])
      .map((r) => r.role as string)
      .find((r) => SignupRoleSchema.safeParse(r).success);
    if (existing) return { role: existing };

    const { data: auth } = await supabaseAdmin.auth.admin.getUserById(userId);
    const metaRole = (auth.user?.user_metadata as Record<string, unknown> | undefined)?.role;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- onboarding_applications postdates the generated types.
    const { data: app } = await (supabaseAdmin as any)
      .from("onboarding_applications")
      .select("role")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const candidate = [metaRole, app?.role].find((r) => SignupRoleSchema.safeParse(r).success) as
      string | undefined;
    if (!candidate) return { role: null };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: candidate } as never);
    if (error && !error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
    return { role: candidate };
  });
