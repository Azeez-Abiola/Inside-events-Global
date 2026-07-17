import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { DashboardTourRole } from "@/lib/dashboard-tours";

export const getDashboardTourStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("dashboard_tours_completed")
      .eq("id", context.userId)
      .single();
    if (error) throw new Error(error.message);
    const completed = (data?.dashboard_tours_completed as Record<string, boolean> | null) ?? {};
    return { completed };
  });

export const markDashboardTourComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tour_role: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("dashboard_tours_completed")
      .eq("id", context.userId)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    const current = (profile?.dashboard_tours_completed as Record<string, boolean> | null) ?? {};
    const updated = { ...current, [data.tour_role as DashboardTourRole]: true };

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ dashboard_tours_completed: updated } as never)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    return { ok: true, completed: updated };
  });
