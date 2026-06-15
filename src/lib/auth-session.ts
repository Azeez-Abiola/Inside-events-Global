import { supabase } from "@/integrations/supabase/client";

/** Returns a valid access token, refreshing if needed. Clears stale sessions on failure. */
export async function ensureAccessToken(): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError?.message?.toLowerCase().includes("refresh")) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error("Your session expired. Please sign in again.");
  }

  let session = sessionData.session;
  if (!session?.access_token) {
    throw new Error("Please sign in to continue.");
  }

  const expiresAt = session.expires_at ?? 0;
  const expiresSoon = expiresAt * 1000 < Date.now() + 60_000;
  if (expiresSoon) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session?.access_token) {
      await supabase.auth.signOut({ scope: "local" });
      throw new Error("Your session expired. Please sign in again.");
    }
    session = refreshed.session;
  }

  return session.access_token;
}

export function isAuthError(message: string) {
  const m = message.toLowerCase();
  return m.includes("unauthorized") || m.includes("session") || m.includes("sign in");
}
