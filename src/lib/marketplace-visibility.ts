import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Marketplace is public now that waitlist stage is over.
 * Set VITE_MARKETPLACE_PUBLIC=false only if you need to re-gate temporarily.
 */
export const MARKETPLACE_PUBLIC = import.meta.env.VITE_MARKETPLACE_PUBLIC !== "false";

/** Allow authenticated founding members when marketplace is gated. */
export async function ensureMarketplaceAccess() {
  if (MARKETPLACE_PUBLIC) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw redirect({ to: "/welcome" });
}
