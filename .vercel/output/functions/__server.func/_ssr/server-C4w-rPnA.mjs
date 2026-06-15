import { k as getRequestHeader, S as StartServer } from "./server-CqdVJ_Eq.mjs";
import { H, c, a, e, f, g, h, i, j, l, m, n, o, p, q, r, s, t, v, w, x, y, z, B, C, D, E, F, G, I } from "./server-CqdVJ_Eq.mjs";
import { k as defineHandlerCallback } from "../_libs/tanstack__router-core.mjs";
import { c as c2, g as g2, N, O } from "../_libs/tanstack__router-core.mjs";
import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as renderRouterToString } from "../_libs/tanstack__react-router.mjs";
import "../_libs/seroval.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
var defaultRenderHandler = defineHandlerCallback(({ router, responseHeaders }) => renderRouterToString({
  router,
  responseHeaders,
  children: /* @__PURE__ */ jsxRuntimeExports.jsx(StartServer, { router })
}));
var VIRTUAL_MODULES = {
  startManifest: "tanstack-start-manifest:v",
  serverFnResolver: "#tanstack-start-server-fn-resolver",
  pluginAdapters: "#tanstack-start-plugin-adapters"
};
export {
  H as HEADERS,
  StartServer,
  VIRTUAL_MODULES,
  c2 as attachRouterServerSsrUtils,
  c as clearResponseHeaders,
  a as clearSession,
  g2 as createRequestHandler,
  e as createStartHandler,
  defaultRenderHandler,
  f as defaultStreamHandler,
  defineHandlerCallback,
  g as deleteCookie,
  h as getCookie,
  i as getCookies,
  j as getRequest,
  getRequestHeader,
  l as getRequestHeaders,
  m as getRequestHost,
  n as getRequestIP,
  o as getRequestProtocol,
  p as getRequestUrl,
  q as getResponse,
  r as getResponseHeader,
  s as getResponseHeaders,
  t as getResponseStatus,
  v as getSession,
  w as getValidatedQuery,
  x as removeResponseHeader,
  y as requestHandler,
  z as sealSession,
  B as setCookie,
  C as setResponseHeader,
  D as setResponseHeaders,
  E as setResponseStatus,
  N as transformPipeableStreamWithRouter,
  O as transformReadableStreamWithRouter,
  F as unsealSession,
  G as updateSession,
  I as useSession
};
