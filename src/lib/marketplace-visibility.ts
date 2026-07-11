import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Public marketplace is off until launch. Set VITE_MARKETPLACE_PUBLIC=true in .env for local dev.
 */
export const MARKETPLACE_PUBLIC = import.meta.env.VITE_MARKETPLACE_PUBLIC === "true";

/** Allow authenticated founding members when marketplace is gated. */
export async function ensureMarketplaceAccess() {
  if (MARKETPLACE_PUBLIC) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw redirect({ to: "/welcome" });
}
