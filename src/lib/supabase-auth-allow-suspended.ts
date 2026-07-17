import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { WebSocket as NodeWebSocket } from "ws";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase-env";

function ensureNodeWebSocket() {
  if (typeof globalThis.WebSocket === "undefined") {
    (globalThis as typeof globalThis & { WebSocket: typeof WebSocket }).WebSocket =
      NodeWebSocket as unknown as typeof WebSocket;
  }
}

/** Auth middleware that does not reject suspended accounts (e.g. complaint submission). */
export const requireSupabaseAuthAllowSuspended = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    ensureNodeWebSocket();

    const SUPABASE_URL = getSupabaseUrl();
    const SUPABASE_PUBLISHABLE_KEY = getSupabaseAnonKey();
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    const request = getRequest();
    if (!request?.headers) throw new Error("Unauthorized: No request headers available");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Unauthorized: No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized: No token provided");

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) throw new Error("Unauthorized: Invalid token");

    const userId = data.claims.sub as string;
    return next({ context: { supabase, userId, claims: data.claims } });
  },
);
