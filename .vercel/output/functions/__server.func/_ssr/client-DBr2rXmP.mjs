import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
import { W as WebSocket } from "../_libs/ws.mjs";
import { b as getSupabaseUrl, g as getSupabaseAnonKey } from "./supabase-env-Di-uc-dX.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
import "crypto";
import "stream";
import "../_libs/react.mjs";
import "util";
function ensureNodeWebSocket() {
  if (typeof window !== "undefined") return;
  if (typeof globalThis.WebSocket === "undefined") {
    globalThis.WebSocket = WebSocket;
  }
}
function createSupabaseClient() {
  ensureNodeWebSocket();
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_PUBLISHABLE_KEY = getSupabaseAnonKey();
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
export {
  supabase
};
