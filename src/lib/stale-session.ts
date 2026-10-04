import { supabase } from "@/integrations/supabase/client";
import { clearSessionMarkers } from "@/lib/session-policy";

/**
 * A Supabase JWT keeps verifying after its account has been deleted —
 * `getClaims` checks the signature, not whether the user still exists. The
 * browser therefore looks signed in, every server function runs as a user id
 * that is gone, and the first write to hit a foreign key fails with a raw
 * Postgres error nobody can act on.
 *
 * `ensureSignupRole` translates that into STALE_SESSION_MESSAGE. Anything
 * that calls a server function during signup routes its failures through
 * here, so a dead session gets cleared instead of looped on.
 */
const MARKERS = ["no longer exists", "user_roles_user_id_fkey", "violates foreign key constraint"];

export function isStaleSessionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return MARKERS.some((m) => message.includes(m));
}

/** Clears the dead session. Returns true if it handled the error. */
export async function clearStaleSession(error: unknown): Promise<boolean> {
  if (!isStaleSessionError(error)) return false;
  clearSessionMarkers();
  // Local scope: there is no account left to revoke sessions on.
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  return true;
}
