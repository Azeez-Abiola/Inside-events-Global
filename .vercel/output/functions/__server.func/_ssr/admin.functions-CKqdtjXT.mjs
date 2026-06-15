import { f as createSsrRpc } from "./router-4-w4Upb_.mjs";
import { d as createServerFn } from "./server-Dl4ga8RB.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DnNqQzIF.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";
const listEventsForVetting = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("bda00c310fa4568441e620fa4b7901e1b8699194489e81ecf9bd779642b0b27d"));
const getEventForAdmin = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("773d8acef26731b95061f34b034599a7953aef266332f3e549f6bef17c96c138"));
const SetStatusInput = objectType({
  id: stringType().uuid(),
  to_status: enumType(["under_review", "revision_requested", "approved", "rejected", "listed", "closed", "archived"]),
  note: stringType().max(2e3).optional().nullable()
});
const setEventVettingStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => SetStatusInput.parse(d)).handler(createSsrRpc("a901d51839bdbcdf14cadafa26818c8fe62ee10b51bf69c9d8fa3674abbe2220"));
export {
  getEventForAdmin as g,
  listEventsForVetting as l,
  setEventVettingStatus as s
};
