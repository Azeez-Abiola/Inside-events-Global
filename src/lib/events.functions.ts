import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ───────────────────────────────────────────────────────────────
// Status state machine — server-side enforcement
// ───────────────────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["under_review"],
  under_review: ["revision_requested", "approved", "rejected"],
  revision_requested: ["submitted"],
  approved: ["listed"],
  listed: ["closed", "archived"],
};

// ───────────────────────────────────────────────────────────────
// Organiser: my events
// ───────────────────────────────────────────────────────────────
export const getMyEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("events")
      .select("id, name, slug, status, start_date, end_date, city, country, event_type, view_count, save_count, inquiry_count, ige_vetted, created_at, updated_at")
      .eq("organiser_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { events: data ?? [] };
  });

// ───────────────────────────────────────────────────────────────
// Create draft
// ───────────────────────────────────────────────────────────────
export const createEventDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("events")
      .insert({
        organiser_id: userId,
        name: "Untitled event",
        status: "draft",
        form_step_completed: 0,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

// ───────────────────────────────────────────────────────────────
// Get single event for editing
// ───────────────────────────────────────────────────────────────
export const getEventForEdit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: ev, error }, { data: tiers }] = await Promise.all([
      supabase.from("events").select("*").eq("id", data.id).single(),
      supabase
        .from("event_sponsorship_tiers")
        .select("*")
        .eq("event_id", data.id)
        .order("display_order"),
    ]);
    if (error) throw new Error(error.message);
    return { event: ev, tiers: tiers ?? [] };
  });

// ───────────────────────────────────────────────────────────────
// Autosave
// ───────────────────────────────────────────────────────────────
const AutosaveInput = z.object({
  id: z.string().uuid(),
  step: z.number().int().min(0).max(9),
  patch: z.record(z.string(), z.any()),
});

export const autosaveEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => AutosaveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify ownership + status allows edit
    const { data: ev, error: e1 } = await supabase
      .from("events")
      .select("organiser_id, status")
      .eq("id", data.id)
      .single();
    if (e1) throw new Error(e1.message);
    if (ev.organiser_id !== userId) throw new Error("Forbidden");
    if (!["draft", "revision_requested"].includes(ev.status)) {
      throw new Error("Event can no longer be edited in current status");
    }
    const payload = {
      ...data.patch,
      form_step_completed: Math.max(data.step, 0),
      updated_at: new Date().toISOString(),
    } as never;
    const { error } = await supabase.from("events").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, savedAt: new Date().toISOString() };
  });

// ───────────────────────────────────────────────────────────────
// Tier management
// ───────────────────────────────────────────────────────────────
const TierInput = z.object({
  id: z.string().uuid().optional(),
  event_id: z.string().uuid(),
  tier_name: z.string().min(1).max(80),
  price: z.number().nonnegative(),
  currency: z.string().min(3).max(3),
  assets: z.array(z.string()).default([]),
  slots_total: z.number().int().min(1).default(1),
  is_exclusive: z.boolean().default(false),
  custom_options: z.string().max(500).optional().nullable(),
  display_order: z.number().int().default(0),
});

export const upsertTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => TierInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ev } = await supabase
      .from("events")
      .select("organiser_id")
      .eq("id", data.event_id)
      .single();
    if (!ev || ev.organiser_id !== userId) throw new Error("Forbidden");
    const payload = { ...data, assets: data.assets as any };
    const { data: row, error } = await supabase
      .from("event_sponsorship_tiers")
      .upsert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { tier: row };
  });

export const deleteTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("event_sponsorship_tiers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ───────────────────────────────────────────────────────────────
// Submit event (draft → submitted)
// ───────────────────────────────────────────────────────────────
export const submitEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ev, error } = await supabase
      .from("events")
      .select("id, organiser_id, status, name, city, slug, consent_given, sponsorship_deck_url, banner_image_url")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (ev.organiser_id !== userId) throw new Error("Forbidden");
    const allowed = VALID_TRANSITIONS[ev.status] ?? [];
    if (!allowed.includes("submitted")) {
      throw new Error(`Cannot submit from status '${ev.status}'`);
    }
    if (!ev.consent_given) throw new Error("Consent must be confirmed before submitting");
    if (!ev.sponsorship_deck_url) throw new Error("Sponsorship deck PDF is required");
    if (!ev.banner_image_url) throw new Error("Banner image is required");

    // Tier check
    const { count: tierCount } = await supabase
      .from("event_sponsorship_tiers")
      .select("*", { count: "exact", head: true })
      .eq("event_id", ev.id);
    if (!tierCount || tierCount < 1) throw new Error("At least one sponsorship tier is required");

    // Generate slug if missing — use admin RPC
    let slug = ev.slug;
    if (!slug) {
      const { data: slugData, error: slugErr } = await supabaseAdmin.rpc("generate_event_slug", {
        p_name: ev.name,
        p_city: ev.city ?? "",
      });
      if (slugErr) throw new Error(slugErr.message);
      slug = slugData as string;
    }

    const { error: upErr } = await supabase
      .from("events")
      .update({
        status: "submitted",
        slug,
        consent_given_at: new Date().toISOString(),
      })
      .eq("id", ev.id);
    if (upErr) throw new Error(upErr.message);

    return { ok: true, slug };
  });

// ───────────────────────────────────────────────────────────────
// Delete draft
// ───────────────────────────────────────────────────────────────
export const deleteDraftEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("events").delete().eq("id", data.id).eq("status", "draft");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
