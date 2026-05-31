import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["under_review"],
  under_review: ["revision_requested", "approved", "rejected"],
  revision_requested: ["submitted"],
  approved: ["listed"],
  listed: ["closed", "archived"],
};

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("abw_admin") && !roles.includes("super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
}

export const listEventsForVetting = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, name, slug, status, event_type, start_date, city, country, created_at, updated_at, organiser_id, vetting_notes, rejection_reason"
      )
      .in("status", ["submitted", "under_review", "revision_requested", "approved", "rejected"])
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Pull organiser email per event
    const ids = Array.from(new Set((data ?? []).map((e: any) => e.organiser_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p.email]));
    return {
      events: (data ?? []).map((e: any) => ({
        ...e,
        organiser_email: map.get(e.organiser_id) ?? null,
      })),
    };
  });

export const getEventForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const [{ data: ev, error }, { data: tiers }] = await Promise.all([
      supabase.from("events").select("*").eq("id", data.id).single(),
      supabase
        .from("event_sponsorship_tiers")
        .select("*")
        .eq("event_id", data.id)
        .order("display_order"),
    ]);
    if (error) throw new Error(error.message);
    const { data: profile } = ev.organiser_id
      ? await supabase
          .from("profiles")
          .select("id, email")
          .eq("id", ev.organiser_id)
          .single()
      : { data: null };
    return { event: ev, tiers: tiers ?? [], organiser: profile };
  });

const SetStatusInput = z.object({
  id: z.string().uuid(),
  to_status: z.enum([
    "under_review",
    "revision_requested",
    "approved",
    "rejected",
    "listed",
    "closed",
    "archived",
  ]),
  note: z.string().max(2000).optional().nullable(),
});

export const setEventVettingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SetStatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const { data: ev, error } = await supabase
      .from("events")
      .select("id, status")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const allowed = ALLOWED_TRANSITIONS[ev.status] ?? [];
    if (!allowed.includes(data.to_status)) {
      throw new Error(
        `Invalid transition '${ev.status}' → '${data.to_status}'. Allowed: ${allowed.join(", ") || "none"}`
      );
    }

    const patch: Record<string, any> = {
      status: data.to_status,
      vetted_at: new Date().toISOString(),
      vetted_by: userId,
    };
    if (data.to_status === "approved" || data.to_status === "listed") {
      patch.ige_vetted = true;
    }
    if (data.to_status === "revision_requested") {
      patch.vetting_notes = data.note ?? null;
    }
    if (data.to_status === "rejected") {
      patch.rejection_reason = data.note ?? null;
    }

    const { error: upErr } = await supabase.from("events").update(patch as never).eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    return { ok: true, status: data.to_status };
  });
