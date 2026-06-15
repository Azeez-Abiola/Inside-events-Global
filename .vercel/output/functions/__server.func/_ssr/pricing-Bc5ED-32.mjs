import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { e as SiteHeader, d as SiteFooter } from "./router-BT27-cf7.mjs";
import "../_libs/ws.mjs";
import "../_libs/seroval.mjs";
import { m as CircleCheck } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "./client-gmdRS3ZG.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./server-CqdVJ_Eq.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-DeHWLdHU.mjs";
import "../_libs/lovable.dev__webhooks-js.mjs";
import "./client.server-BxqV6VTA.mjs";
import "../_libs/lovable.dev__email-js.mjs";
import "../_libs/react-email__render.mjs";
import "../_libs/prettier.mjs";
import "../_libs/html-to-text.mjs";
import "../_libs/selderee__plugin-htmlparser2.mjs";
import "../_libs/selderee.mjs";
import "../_libs/parseley.mjs";
import "../_libs/leac.mjs";
import "../_libs/peberminta.mjs";
import "../_libs/domhandler.mjs";
import "../_libs/domelementtype.mjs";
import "../_libs/htmlparser2.mjs";
import "../_libs/entities.mjs";
import "../_libs/deepmerge.mjs";
import "../_libs/dom-serializer.mjs";
import "../_libs/react-email__html.mjs";
import "../_libs/react-email__head.mjs";
import "../_libs/react-email__preview.mjs";
import "../_libs/react-email__body.mjs";
import "../_libs/react-email__container.mjs";
import "../_libs/react-email__heading.mjs";
import "../_libs/react-email__text.mjs";
import "../_libs/react-email__hr.mjs";
import "../_libs/react-email__link.mjs";
import "../_libs/react-email__button.mjs";
import "../_libs/zod.mjs";
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
function PricingPage() {
  const tiers = [{
    name: "Organisers",
    price: "Zero listing fee",
    desc: "List vetted events at no upfront cost. IGE takes a platform commission only when a sponsorship deal reaches payment received.",
    points: ["Free to create and submit a listing", "10% platform commission on closed deals", "Bring your own Stripe or Paystack account", "No charge if a deal does not close"]
  }, {
    name: "Sponsors",
    price: "Free to browse & deal",
    desc: "No fees for sponsors. You pay the organiser directly through their payment provider for the agreed sponsorship value.",
    points: ["Free vetted-organiser access", "No platform fee added to your invoice", "Pay the organiser directly", "Audit-ready deal records"],
    featured: true
  }, {
    name: "Referral partners",
    price: "Earn on every closed deal",
    desc: "Accredited partners earn a share of IGE's platform commission for every sponsorship they introduce that reaches payment.",
    points: ["Up to 20% of IGE's commission per deal", "Paid out of IGE commission, never added on top", "Transparent dashboard for tracked deals", "Monthly payouts once a deal settles"]
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-6xl px-6 py-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "text-sm text-primary hover:underline", children: "← Home" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-6 font-display text-4xl font-bold tracking-tight md:text-5xl", children: "Pricing & Commission" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-2xl text-lg text-muted-foreground", children: "IGE is a success-based marketplace. Listing is free. We only earn when a sponsorship deal actually closes." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-12 grid gap-6 md:grid-cols-3", children: tiers.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-2xl border p-7 shadow-soft ${t.featured ? "border-primary bg-brand-gradient text-white" : "border-border/60 bg-card"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-xs font-semibold uppercase tracking-[0.14em] ${t.featured ? "text-white/80" : "text-primary"}`, children: t.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-display text-2xl font-bold", children: t.price }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-2 text-sm ${t.featured ? "text-white/90" : "text-muted-foreground"}`, children: t.desc }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-5 space-y-2.5", children: t.points.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: `mt-0.5 h-4 w-4 shrink-0 ${t.featured ? "text-white" : "text-primary"}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: p })
        ] }, p)) })
      ] }, t.name)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-16 grid gap-8 rounded-2xl border border-border/60 bg-muted/30 p-8 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-semibold", children: "How commission works" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "When an organiser closes a sponsorship through IGE, the organiser collects the full sponsorship value via their connected payment provider. IGE invoices the platform commission on that value after payment is confirmed. If a referral partner introduced the deal, their share is paid out of IGE's commission." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-semibold", children: "No hidden fees" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "No subscription fees, no listing fees, no charge to browse. Payment processing fees charged by Stripe or Paystack are passed through at cost and never marked up by IGE." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signup", className: "inline-flex rounded-md bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-soft", children: "Get started for free" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
export {
  PricingPage as component
};
