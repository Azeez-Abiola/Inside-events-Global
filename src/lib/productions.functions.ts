import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { notifyAdmins } from "@/lib/admin-notify";
import { openInboxThread } from "@/lib/admin-inbox.server";

/**
 * Creative Hub productions and brand placement (TAB 5 §5.6, TAB 3 §3.6.6).
 *
 * A creative lists a production and the placement opportunities inside it.
 * Publishing sends it to Admin vetting; once approved, brands can discover it
 * and express interest — which goes to Admin, never to the creative directly
 * (TAB 19 §19.1A). The pitch deck stays private to the owner and Admin.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   productions postdates the generated types. */
const pdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface Placement {
  id: string;
  production_id: string;
  kind: string;
  description: string | null;
  price: number | null;
  currency: string;
  slots_total: number;
  slots_filled: number;
  brand_label: string | null;
  deliverable_due: string | null;
  proof_url: string | null;
  delivered_at: string | null;
  position: number;
}

export interface Production {
  id: string;
  owner_id: string;
  title: string;
  format: string | null;
  stage: string | null;
  logline: string | null;
  release_window: string | null;
  platforms: string[];
  target_markets: string[];
  amount_sought: number | null;
  currency: string;
  cover_image_url: string | null;
  pitch_deck_url: string | null;
  visibility: "private" | "published";
  looking_to_connect_with: string[];
  listing_status: string;
  reviewer_notes: string | null;
  updated_at: string;
}

// Postgres NUMERIC arrives as a string; the UI does arithmetic on these.
const toProduction = <T extends { amount_sought: number | null }>(p: T): T => ({
  ...p,
  amount_sought: p.amount_sought != null ? Number(p.amount_sought) : null,
});
const toPlacement = <T extends { price: number | null }>(p: T): T => ({
  ...p,
  price: p.price != null ? Number(p.price) : null,
});

async function owned(userId: string, id: string) {
  const { data } = await pdb().from("productions").select("*").eq("id", id).maybeSingle();
  if (!data || data.owner_id !== userId) throw new Error("Production not found.");
  return data as Production;
}

// ─── Owner ────────────────────────────────────────────────────────────────────

export const getMyProductions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: prods } = await pdb()
      .from("productions")
      .select("*")
      .eq("owner_id", context.userId)
      .order("updated_at", { ascending: false });
    const P = (prods ?? []) as Production[];
    const { data: places } = P.length
      ? await pdb()
          .from("production_placements")
          .select("*")
          .in(
            "production_id",
            P.map((p) => p.id),
          )
          .order("position")
      : { data: [] };
    // Onboarding Section D holds the first production; offer to bring it over.
    const { data: app } = await pdb()
      .from("onboarding_applications")
      .select("sections")
      .eq("user_id", context.userId)
      .maybeSingle();
    const d = app?.sections?.d ?? null;
    return {
      productions: P.map((p) => toProduction(p)),
      placements: ((places ?? []) as Placement[]).map((p) => toPlacement(p)),
      onboardingDraft:
        !P.length && d?.production_title
          ? {
              title: String(d.production_title),
              format: d.format ? String(d.format) : null,
              stage: d.production_stage ? String(d.production_stage) : null,
              release_window: d.release_window ? String(d.release_window) : null,
              placements: Array.isArray(d.placements) ? d.placements.map(String) : [],
              target_markets: Array.isArray(d.target_markets) ? d.target_markets.map(String) : [],
              amount_sought: d.amount_sought
                ? Number(String(d.amount_sought).replace(/[^\d.]/g, "")) || null
                : null,
              currency: d.amount_currency ? String(d.amount_currency).split(" ")[0] : "NGN",
            }
          : null,
    };
  });

const ProductionInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  format: z.string().trim().max(80).optional(),
  stage: z.string().trim().max(80).optional(),
  logline: z.string().trim().max(1000).optional(),
  release_window: z.string().trim().max(200).optional(),
  platforms: z.array(z.string().max(80)).max(20).optional(),
  target_markets: z.array(z.string().max(80)).max(40).optional(),
  amount_sought: z.number().nonnegative().nullish(),
  currency: z.string().trim().min(3).max(10).optional(),
  cover_image_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  pitch_deck_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  looking_to_connect_with: z.array(z.string().max(40)).max(6).optional(),
});

export const upsertProduction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ProductionInput.parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) await owned(context.userId, data.id);
    const row = {
      owner_id: context.userId,
      title: data.title,
      format: data.format || null,
      stage: data.stage || null,
      logline: data.logline || null,
      release_window: data.release_window || null,
      platforms: data.platforms ?? [],
      target_markets: data.target_markets ?? [],
      amount_sought: data.amount_sought ?? null,
      currency: data.currency || "NGN",
      cover_image_url: data.cover_image_url || null,
      pitch_deck_url: data.pitch_deck_url || null,
      looking_to_connect_with: data.looking_to_connect_with?.length
        ? data.looking_to_connect_with
        : ["sponsor"],
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await pdb().from("productions").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await pdb().from("productions").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { id: ins.id as string };
  });

export const deleteProduction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await owned(context.userId, data.id);
    await pdb().from("productions").delete().eq("id", data.id);
    return { ok: true as const };
  });

/** Publishing for sponsorship goes to Admin vetting (TAB 3 §3.1 step 8). */
export const publishProduction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), publish: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const p = await owned(context.userId, data.id);
    const now = new Date().toISOString();
    if (!data.publish) {
      await pdb()
        .from("productions")
        .update({ visibility: "private", listing_status: "draft", updated_at: now })
        .eq("id", p.id);
      return { ok: true as const };
    }
    const { count } = await pdb()
      .from("production_placements")
      .select("id", { count: "exact", head: true })
      .eq("production_id", p.id);
    if (!count) throw new Error("Add at least one placement opportunity before publishing.");
    await pdb()
      .from("productions")
      .update({
        visibility: "published",
        listing_status: "submitted",
        submitted_at: now,
        updated_at: now,
      })
      .eq("id", p.id);
    await notifyAdmins({
      type: "production_submitted",
      title: `Production submitted for vetting: ${p.title}`,
      body: `${p.title} (${p.format ?? "production"}) was published for sponsorship and is waiting in the production vetting queue.`,
      data: { user_id: context.userId, production_id: p.id },
    }).catch(() => {});
    return { ok: true as const };
  });

const PlacementInput = z.object({
  id: z.string().uuid().optional(),
  production_id: z.string().uuid(),
  kind: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional(),
  price: z.number().nonnegative().nullish(),
  currency: z.string().trim().min(3).max(10).optional(),
  slots_total: z.number().int().min(0).max(999).optional(),
  slots_filled: z.number().int().min(0).max(999).optional(),
  brand_label: z.string().trim().max(200).optional(),
  deliverable_due: z.string().max(20).nullish(),
  proof_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  delivered: z.boolean().optional(),
});

export const upsertPlacement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PlacementInput.parse(d))
  .handler(async ({ data, context }) => {
    await owned(context.userId, data.production_id);
    if ((data.slots_filled ?? 0) > (data.slots_total ?? 1)) {
      throw new Error("More slots filled than there are.");
    }
    const row = {
      production_id: data.production_id,
      kind: data.kind,
      description: data.description || null,
      price: data.price ?? null,
      currency: data.currency || "NGN",
      slots_total: data.slots_total ?? 1,
      slots_filled: data.slots_filled ?? 0,
      brand_label: data.brand_label || null,
      deliverable_due: data.deliverable_due || null,
      proof_url: data.proof_url || null,
      delivered_at: data.delivered ? new Date().toISOString() : null,
    };
    const { error } = data.id
      ? await pdb()
          .from("production_placements")
          .update(row)
          .eq("id", data.id)
          .eq("production_id", data.production_id)
      : await pdb().from("production_placements").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deletePlacement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), production_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await owned(context.userId, data.production_id);
    await pdb()
      .from("production_placements")
      .delete()
      .eq("id", data.id)
      .eq("production_id", data.production_id);
    return { ok: true as const };
  });

// ─── Brands: discover vetted productions ─────────────────────────────────────

export const discoverProductions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data: prods } = await pdb()
      .from("productions")
      // Never the pitch deck or the owner: summary and placements only.
      .select(
        "id, title, format, stage, logline, release_window, platforms, target_markets, amount_sought, currency, cover_image_url, looking_to_connect_with",
      )
      .eq("listing_status", "approved_live")
      .eq("visibility", "published")
      .order("updated_at", { ascending: false })
      .limit(200);
    const P = (prods ?? []) as Omit<Production, "owner_id" | "pitch_deck_url">[];
    const { data: places } = P.length
      ? await pdb()
          .from("production_placements")
          .select("production_id, kind, description, price, currency, slots_total, slots_filled")
          .in(
            "production_id",
            P.map((p) => p.id),
          )
          .order("position")
      : { data: [] };
    return {
      productions: P.map((p) => toProduction(p)),
      placements: ((places ?? []) as Placement[]).map((p) => toPlacement(p)),
    };
  });

export const expressProductionInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), note: z.string().trim().max(2000).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: p } = await pdb()
      .from("productions")
      .select("id, title, owner_id, listing_status")
      .eq("id", data.id)
      .maybeSingle();
    if (!p || p.listing_status !== "approved_live") throw new Error("Production not found.");
    if (p.owner_id === context.userId) throw new Error("This is your own production.");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", context.userId)
      .maybeSingle();
    await openInboxThread({
      source: "request",
      subject: `Brand interest in production: ${p.title}`,
      body:
        data.note || "Interested in brand placement in this production. Please review for a match.",
      userId: context.userId,
      contactName: profile?.display_name ?? null,
      contactEmail: profile?.email ?? null,
      payload: {
        production_id: p.id,
        production_title: p.title,
        production_owner_id: p.owner_id,
        via: "production_discovery",
      },
    });
    return { ok: true as const };
  });

// ─── Admin vetting ────────────────────────────────────────────────────────────

export const listProductionQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminPermission(context.userId, "vetting");
    const { data: prods } = await pdb()
      .from("productions")
      .select("*")
      .in("listing_status", ["submitted", "under_review", "changes_requested"])
      .order("submitted_at", { ascending: true });
    const P = (prods ?? []) as Production[];
    const [{ data: places }, { data: owners }] = await Promise.all([
      P.length
        ? pdb()
            .from("production_placements")
            .select("*")
            .in(
              "production_id",
              P.map((p) => p.id),
            )
        : Promise.resolve({ data: [] }),
      P.length
        ? supabaseAdmin
            .from("profiles")
            .select("id, display_name, email")
            .in(
              "id",
              P.map((p) => p.owner_id),
            )
        : Promise.resolve({ data: [] }),
    ]);
    return {
      productions: P.map((p) => ({
        ...toProduction(p),
        owner_name:
          (owners ?? []).find((o) => o.id === p.owner_id)?.display_name ??
          (owners ?? []).find((o) => o.id === p.owner_id)?.email ??
          "Unknown",
      })),
      placements: ((places ?? []) as Placement[]).map((p) => toPlacement(p)),
    };
  });

export const reviewProduction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved_live", "rejected", "changes_requested", "under_review"]),
        notes: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "vetting");
    const { data: p } = await pdb()
      .from("productions")
      .select("id, title, owner_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!p) throw new Error("Production not found.");
    const now = new Date().toISOString();
    await pdb()
      .from("productions")
      .update({
        listing_status: data.decision,
        reviewer_notes: data.notes ?? null,
        reviewed_by: context.userId,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", p.id);
    const message =
      data.decision === "approved_live"
        ? `${p.title} is approved and live for brands to discover.`
        : data.decision === "rejected"
          ? `${p.title} was not approved for sponsorship this time.${data.notes ? ` ${data.notes}` : ""}`
          : data.decision === "changes_requested"
            ? `IGE has asked for changes to ${p.title}: ${data.notes ?? "see your productions page."}`
            : `${p.title} is under review.`;
    await supabaseAdmin.from("notifications").insert({
      user_id: p.owner_id,
      type: "production_review",
      title: "Production review update",
      body: message,
      data: { production_id: p.id, link: "/dashboard/productions" },
    });
    await recordAdminAudit({
      actorId: context.userId,
      action: "event_vetting_updated",
      summary: `Production "${p.title}" → ${data.decision.replace(/_/g, " ")}`,
      resourceType: "production",
      resourceId: p.id,
      metadata: { notes: data.notes ?? null },
    }).catch(() => {});
    return { ok: true as const };
  });
