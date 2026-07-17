import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function notifyAdmins(input: {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const { data: admins } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .in("role", ["abw_admin", "super_admin"]);
  if (!admins?.length) return;

  await supabaseAdmin.from("notifications").insert(
    admins.map((a) => ({
      user_id: a.user_id,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    })),
  );
}
