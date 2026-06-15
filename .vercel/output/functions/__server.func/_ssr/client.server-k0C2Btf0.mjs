import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
import { W as WebSocket } from "../_libs/ws.mjs";
import { b as getSupabaseUrl, a as getSupabaseServiceRoleKey, g as getSupabaseAnonKey } from "./supabase-env-Di-uc-dX.mjs";
function ensureNodeWebSocket() {
  if (typeof globalThis.WebSocket === "undefined") {
    globalThis.WebSocket = WebSocket;
  }
}
function createSupabaseAdminClient() {
  ensureNodeWebSocket();
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_SERVICE_ROLE_KEY = getSupabaseServiceRoleKey();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [
      ...[],
      ...!SUPABASE_SERVICE_ROLE_KEY ? ["SUPABASE_SERVICE_ROLE_KEY"] : []
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: void 0,
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
function createSupabasePublicClient() {
  ensureNodeWebSocket();
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_PUBLISHABLE_KEY = getSupabaseAnonKey();
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: void 0,
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
let _supabaseAdmin;
let _supabasePublic;
const supabaseAdmin = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  }
});
const supabasePublic = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabasePublic) _supabasePublic = createSupabasePublicClient();
    return Reflect.get(_supabasePublic, prop, receiver);
  }
});
export {
  supabasePublic as a,
  supabaseAdmin as s
};
