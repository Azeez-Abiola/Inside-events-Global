import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SubmitInput = z.object({
  event_id: z.string().uuid(),
  contact_name: z.string().min(2).max(120),
  contact_title: z.string().max(120).optional().nullable(),
  company_name: z.string().min(1).max(160),
  company_linkedin_url: z
    .string()
    .url()
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  currency: z.enum(["NGN", "USD", "GBP", "EUR"]),
  budget_range_min: z.number().nonnegative().optional().nullable(),
  budget_range_max: z.number().nonnegative().optional().nullable(),
  package_brief: z.string().min(20).max(3000),
  deliverables_wanted: z.string().max(2000).optional().nullable(),
  timeline: z.string().max(500).optional().nullable(),
  referral_short_code: z.string().max(20).optional().nullable(),
});

export const submitCustomPackageRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => SubmitInput.parse(d))
  .handler(async ({ data }) => {
    const { data: ev, error: evErr } = await supabaseAdmin
      .from("events")
      .select("id, name, organiser_id, status")
      .eq("id", data.event_id)
      .single();
    if (evErr) throw new Error(evErr.message);
    if (!["approved", "listed"].includes(ev.status)) throw new Error("Event not accepting requests");

    let sponsor_user_id: string | null = null;
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const auth = getRequestHeader("Authorization");
      if (auth?.startsWith("Bearer ")) {
        const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
        sponsor_user_id = u.user?.id ?? null;
      }
    } catch {}

    let referral_link_id: string | null = null;
    let referral_partner_id: string | null = null;
    if (data.referral_short_code) {
      const { data: link } = await supabaseAdmin
        .from("referral_links")
        .select("id, referral_partner_id, status, event_id")
        .eq("short_code", data.referral_short_code)
        .maybeSingle();
      if (link && link.event_id === data.event_id && link.status === "active") {
        referral_link_id = link.id;
        referral_partner_id = link.referral_partner_id;
      }
    }

    const { data: row, error } = await supabaseAdmin
      .from("custom_package_requests" as never)
      .insert({
        event_id: data.event_id,
        sponsor_user_id,
        contact_name: data.contact_name,
        contact_title: data.contact_title,
        company_name: data.company_name,
        company_linkedin_url: data.company_linkedin_url,
        currency: data.currency,
        budget_range_min: data.budget_range_min,
        budget_range_max: data.budget_range_max,
        package_brief: data.package_brief,
        deliverables_wanted: data.deliverables_wanted,
        timeline: data.timeline,
        referral_link_id,
        referral_partner_id,
        status: "pending",
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const notifyIds = [ev.organiser_id].filter(Boolean) as string[];
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["abw_admin", "super_admin"]);
    for (const a of admins ?? []) notifyIds.push(a.user_id);

    if (notifyIds.length) {
      await supabaseAdmin.from("notifications").insert(
        Array.from(new Set(notifyIds)).map((uid) => ({
          user_id: uid,
          type: "custom_package_request",
          title: "Custom package request",
          body: `${data.company_name} requested a bespoke package for ${ev.name}.`,
          data: { event_id: ev.id, request_id: row.id },
        })),
      );
    }

    return { id: row.id };
  });

export const adminListCustomPackageRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");

    const { data } = await supabaseAdmin
      .from("custom_package_requests" as never)
      .select("*")
      .order("created_at", { ascending: false });
    return { requests: data ?? [] };
  });

export const adminUpdateCustomPackageStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "reviewed", "converted", "declined"]),
        admin_notes: z.string().max(1000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");

    const { error } = await supabaseAdmin
      .from("custom_package_requests" as never)
      .update({
        status: data.status,
        admin_notes: data.admin_notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
