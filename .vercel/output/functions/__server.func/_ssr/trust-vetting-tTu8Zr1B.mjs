import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { e as SiteHeader, d as SiteFooter } from "./router-4-w4Upb_.mjs";
import "../_libs/seroval.mjs";
import { F as FileCheckCorner, _ as Search, ab as UserCheck, a2 as ShieldCheck, a8 as TriangleAlert } from "../_libs/lucide-react.mjs";
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
import "./client-BhermGBt.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./server-Dl4ga8RB.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-DnNqQzIF.mjs";
import "../_libs/lovable.dev__webhooks-js.mjs";
import "./client.server-U_pH-Evd.mjs";
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
function TrustVettingPage() {
  const steps = [{
    icon: FileCheckCorner,
    title: "Identity & entity verification",
    desc: "Government ID, company registration, and beneficial ownership are verified for every organiser and sponsor account."
  }, {
    icon: Search,
    title: "Track record review",
    desc: "Past events, audience data, sponsor references, and financial standing are reviewed by the IGE vetting desk."
  }, {
    icon: UserCheck,
    title: "Partner accreditation",
    desc: "Referral partners complete an accreditation interview and sign a code of conduct before earning commission."
  }, {
    icon: ShieldCheck,
    title: "Continuous monitoring",
    desc: "Listings, deals, and partner activity are continuously monitored. Accounts can be suspended at any time for breach of standards."
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-4xl px-6 py-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "text-sm text-primary hover:underline", children: "← Home" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-6 font-display text-4xl font-bold tracking-tight md:text-5xl", children: "Trust & Vetting" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "Every organiser, sponsor, and referral partner on Inside Global Events 2026 is vetted before they can transact. Vetting is what makes the marketplace work." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mt-12 grid gap-6 md:grid-cols-2", children: steps.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/60 bg-card p-6 shadow-soft", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(s.icon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 font-display text-lg font-semibold", children: s.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: s.desc })
      ] }, s.title)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-12 space-y-4 text-sm leading-relaxed", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-semibold", children: "Compliance" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "IGE complies with applicable data protection law (including GDPR and the Nigeria Data Protection Act) and anti-money-laundering requirements. KYC and KYB records are retained for the period required by law." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Payments are processed through licensed providers (Stripe, Paystack) on organisers' own merchant accounts. IGE does not custody sponsor funds." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-semibold pt-6", children: "Disclaimers" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 rounded-lg border border-border/60 bg-muted/40 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 shrink-0 text-amber-600" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Vetting is a good-faith review based on the information available at the time of onboarding. It is not a guarantee of event outcomes, sponsor performance, or financial return. Sponsors and organisers remain responsible for their own due diligence on each deal." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 rounded-2xl bg-brand-gradient p-8 text-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-2xl font-semibold", children: "Concerned about a listing or partner?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-white/90", children: "Report it directly to the IGE trust desk." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", className: "mt-4 inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-foreground", children: "Contact trust desk" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
export {
  TrustVettingPage as component
};
