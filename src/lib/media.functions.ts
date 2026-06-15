import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RequestInput = z.object({
  event_id: z.string().uuid(),
  request_type: z.enum(["coverage", "press_credentials", "content"]).default("coverage"),
  message: z.string().trim().max(1000).optional().nullable(),
});

// Media partner submits a coverage / press-credentials request for an event.
export const submitMediaRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RequestInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "media_partner")) {
      throw new Error("Only media partners can request coverage");
    }

    // media_requests is newer than the generated types — cast to bypass stale typings.
    const { error } = await (supabase as any)
      .from("media_requests")
      .upsert(
        {
          event_id: data.event_id,
          media_partner_id: userId,
          request_type: data.request_type,
          message: data.message ?? null,
          status: "pending",
        },
        { onConflict: "event_id,media_partner_id,request_type" },
      );
    if (error) throw new Error(error.message);

    // Notify admins (best effort).
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["abw_admin", "super_admin"]);
    if (admins?.length) {
      await supabaseAdmin.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.user_id,
          type: "media_request",
          title: "New media coverage request",
          body: `A media partner requested ${data.request_type.replace(/_/g, " ")}.`,
          data: { event_id: data.event_id },
        })),
      );
    }

    return { ok: true };
  });

// Media partner's own requests, with event info.
export const getMyMediaRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: reqs } = await (supabase as any)
      .from("media_requests")
      .select("id, event_id, request_type, message, status, created_at")
      .eq("media_partner_id", userId)
      .order("created_at", { ascending: false });

    const eventIds = Array.from(new Set((reqs ?? []).map((r: any) => r.event_id).filter(Boolean))) as string[];
    let eventMap: Record<string, any> = {};
    if (eventIds.length) {
      const { data: evs } = await supabaseAdmin
        .from("events")
        .select("id, name, slug, city, country")
        .in("id", eventIds);
      for (const e of evs ?? []) eventMap[e.id] = e;
    }
    return { requests: reqs ?? [], events: eventMap };
  });
