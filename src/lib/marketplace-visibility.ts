import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * The marketplace is for signed-in users only (TAB 1 §1.5, v6.3/v6.4):
 * "Only signed-in users can see the marketplace; visitors are asked to sign up
 *  by choosing a user type."
 *
 * Set VITE_MARKETPLACE_PUBLIC=true to open it back up — for a demo, or if ABW
 * decides to run an open window during a GTM push.
 */
export const MARKETPLACE_PUBLIC = import.meta.env.VITE_MARKETPLACE_PUBLIC === "true";

/** Sends visitors to the role picker, which is where the spec wants them. */
export async function ensureMarketplaceAccess() {
  if (MARKETPLACE_PUBLIC) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw redirect({ to: "/signup" });
}
