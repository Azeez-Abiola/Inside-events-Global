import { c as createServerRpc } from "./createServerRpc-BtR2InOc.mjs";
import { d as createServerFn } from "./server-DRh9RfeA.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-t0GaQtdd.mjs";
import { s as supabaseAdmin } from "./client.server-k0C2Btf0.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/ws.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./supabase-env-Di-uc-dX.mjs";
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
const deleteMyAccount_createServerFn_handler = createServerRpc({
  id: "27301031363e284184ead21ac910c33ebfbe9159435c975f26319c6a65fade88",
  name: "deleteMyAccount",
  filename: "src/lib/account.functions.ts"
}, (opts) => deleteMyAccount.__executeServer(opts));
const deleteMyAccount = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(deleteMyAccount_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  const anonEmail = `deleted_${userId}@deleted.ige`;
  await supabaseAdmin.from("profiles").update({
    email: anonEmail,
    email_domain: "deleted.ige",
    linkedin_url: null,
    linkedin_employer: null,
    is_active: false
  }).eq("id", userId);
  const {
    error
  } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  return {
    success: true
  };
});
export {
  deleteMyAccount_createServerFn_handler
};
