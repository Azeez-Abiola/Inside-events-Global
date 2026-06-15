import { Q as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider, b as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { b as createRouter, a as createRootRouteWithContext, f as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, c as createFileRoute, l as lazyRouteComponent, u as useLocation, e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { I as redirect, C as isRedirect } from "../_libs/tanstack__router-core.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { s as supabase } from "./client-gmdRS3ZG.mjs";
import { d as createServerFn, T as TSS_SERVER_FUNCTION, u as getServerFnById } from "./server-CqdVJ_Eq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DeHWLdHU.mjs";
import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
import { v as verifyWebhookRequest, W as WebhookError } from "../_libs/lovable.dev__webhooks-js.mjs";
import { s as supabaseAdmin } from "./client.server-BxqV6VTA.mjs";
import { s as sendLovableEmail, p as parseEmailWebhookPayload } from "../_libs/lovable.dev__email-js.mjs";
import { r as render } from "../_libs/react-email__render.mjs";
import { H as Html } from "../_libs/react-email__html.mjs";
import { H as Head } from "../_libs/react-email__head.mjs";
import { P as Preview } from "../_libs/react-email__preview.mjs";
import { B as Body } from "../_libs/react-email__body.mjs";
import { C as Container } from "../_libs/react-email__container.mjs";
import { H as Heading } from "../_libs/react-email__heading.mjs";
import { T as Text } from "../_libs/react-email__text.mjs";
import { H as Hr } from "../_libs/react-email__hr.mjs";
import { L as Link$1 } from "../_libs/react-email__link.mjs";
import { B as Button } from "../_libs/react-email__button.mjs";
import { a4 as Sparkles, a as ArrowRight, a2 as ShieldCheck, E as Earth, H as Handshake, C as Calendar, P as MapPin, ad as Users, Q as Megaphone, m as CircleCheck, a8 as TrendingUp } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, l as literalType, n as numberType, e as enumType, c as booleanType, b as arrayType } from "../_libs/zod.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/ws.mjs";
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
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
function useServerFn(serverFn) {
  const router2 = useRouter();
  return reactExports.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router2.stores.location.get();
        return router2.navigate(router2.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router2, serverFn]);
}
const appCss = "/assets/styles-DGjhRts3.css";
const DEV_AUTH_ENABLED = false;
(/* @__PURE__ */ new Date("2026-07-01T00:00:00Z")).getTime();
function WaitlistGate({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [checked, setChecked] = reactExports.useState(false);
  const [allowed, setAllowed] = reactExports.useState(true);
  reactExports.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!cancelled) {
        setAllowed(true);
        setChecked(true);
      }
      return;
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);
  if (!checked) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" }) });
  }
  if (!allowed) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
}
const Ctx = reactExports.createContext({
  session: null,
  user: null,
  roles: [],
  loading: true,
  signOut: async () => {
  }
});
function AuthProvider({ children }) {
  const [session, setSession] = reactExports.useState(null);
  const [roles, setRoles] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const router2 = useRouter();
  const queryClient = useQueryClient();
  const [devRoles, setDevRolesState] = reactExports.useState(null);
  reactExports.useEffect(() => {
    return;
  }, []);
  const devActive = DEV_AUTH_ENABLED;
  reactExports.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => {
          supabase.from("user_roles").select("role").eq("user_id", s.user.id).then(({ data }) => {
            setRoles((data ?? []).map((r) => r.role));
          });
        }, 0);
      } else {
        setRoles([]);
      }
      router2.invalidate();
      queryClient.invalidateQueries();
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        supabase.from("user_roles").select("role").eq("user_id", data.session.user.id).then(({ data: rolesData }) => {
          setRoles((rolesData ?? []).map((r) => r.role));
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [router2, queryClient, devActive]);
  const signOut = async () => {
    await supabase.auth.signOut();
    await router2.navigate({ to: "/" });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Ctx.Provider,
    {
      value: {
        session,
        user: session?.user ?? null,
        roles,
        loading,
        signOut
      },
      children
    }
  );
}
function useAuth() {
  return reactExports.useContext(Ctx);
}
function DevRoleSwitcher() {
  return null;
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$$ = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "IGE — Event Sponsorship Marketplace | Find Sponsors, Sponsor B2B Events" },
      { name: "description", content: "Inside Global Events (IGE) is the vetted event sponsorship marketplace connecting B2B event organisers, corporate sponsors, and referral partners across the Africa–Europe corridor and globally." },
      { name: "author", content: "Inside Global Events" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:site_name", content: "Inside Global Events" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6410c0bf-c8c9-4d1e-b048-e98ce84ec6a2/id-preview-04099da8--0d1f4683-f826-450c-927b-386eaca7e044.lovable.app-1779749582346.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6410c0bf-c8c9-4d1e-b048-e98ce84ec6a2/id-preview-04099da8--0d1f4683-f826-450c-927b-386eaca7e044.lovable.app-1779749582346.png" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
      },
      { rel: "stylesheet", href: appCss }
    ],
    scripts: [
      {
        src: "https://plausible.io/js/script.js",
        defer: true,
        "data-domain": "insideglobalevents.com"
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Inside Global Events",
          alternateName: "IGE",
          url: "https://www.insideglobalevents.com",
          logo: "https://www.insideglobalevents.com/ige-icon-512.png",
          description: "Vetted event sponsorship marketplace connecting B2B event organisers, corporate sponsors, and referral partners.",
          sameAs: ["https://www.instagram.com/insideglobalevents"]
        })
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Inside Global Events",
          url: "https://www.insideglobalevents.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.insideglobalevents.com/marketplace?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$$.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(WaitlistGate, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DevRoleSwitcher, {})
  ] }) });
}
const $$splitComponentImporter$I = () => import("./welcome-tQwB66pb.mjs");
const Route$_ = createFileRoute("/welcome")({
  head: () => ({
    meta: [{
      title: "Welcome to IGE · Inside Global Events 2026"
    }, {
      name: "description",
      content: "Inside Global Events 2026 (IGE) connects event organisers, brand sponsors, and partnerships professionals across the Africa–Europe corridor. Waitlist launching soon."
    }, {
      property: "og:title",
      content: "Welcome to Inside Global Events 2026"
    }, {
      property: "og:description",
      content: "Event intelligence + sponsorship marketplace. Waitlist launching soon — featuring the Itsekiri Global Homecoming."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$I, "component")
});
const $$splitComponentImporter$H = () => import("./waitlist-DIcjPZps.mjs");
const Route$Z = createFileRoute("/waitlist")({
  head: () => ({
    meta: [{
      title: "Join the waitlist · Inside Global Events 2026"
    }, {
      name: "description",
      content: "Get founding-member access to Inside Global Events 2026. Waitlist opens for organisers, sponsors, and referral partners ahead of the 1 July launch."
    }, {
      property: "og:title",
      content: "Join the IGE waitlist"
    }, {
      property: "og:description",
      content: "Founding-member access, locked-in rates, and priority matching before the 1 July launch."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$H, "component")
});
const $$splitComponentImporter$G = () => import("./unsubscribe-CReyHFjN.mjs");
const Route$Y = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [{
      title: "Unsubscribe — Inside Global Events 2026"
    }, {
      name: "robots",
      content: "noindex"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$G, "component"),
  validateSearch: (s) => ({
    token: typeof s.token === "string" ? s.token : ""
  })
});
const $$splitComponentImporter$F = () => import("./trust-vetting-DWYxCaNk.mjs");
const Route$X = createFileRoute("/trust-vetting")({
  head: () => ({
    meta: [{
      title: "Sponsorship Trust & Vetting — How IGE Verifies Every Deal"
    }, {
      name: "description",
      content: "How IGE vets organisers, sponsors, and referral partners. Identity checks, track record review, partner accreditation, and continuous monitoring make IGE the trust layer for B2B event sponsorship."
    }, {
      name: "keywords",
      content: "vetted event sponsorship, sponsorship due diligence, sponsorship red flags, sponsorship trust, verified sponsors, verified event organisers"
    }, {
      property: "og:title",
      content: "Sponsorship Trust & Vetting — IGE"
    }, {
      property: "og:description",
      content: "Every organiser, sponsor, and partner is vetted before any deal is brokered."
    }, {
      property: "og:url",
      content: "https://www.insideglobalevents.com/trust-vetting"
    }],
    links: [{
      rel: "canonical",
      href: "https://www.insideglobalevents.com/trust-vetting"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$F, "component")
});
const $$splitComponentImporter$E = () => import("./terms-Cl411bw3.mjs");
const Route$W = createFileRoute("/terms")({
  head: () => ({
    meta: [{
      title: "Terms of Service - Inside Global Events 2026"
    }, {
      name: "description",
      content: "Terms governing use of the IGE sponsorship marketplace."
    }],
    links: [{
      rel: "canonical",
      href: "/terms"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$E, "component")
});
const $$splitComponentImporter$D = () => import("./sponsors-D262z_Mb.mjs");
const Route$V = createFileRoute("/sponsors")({
  head: () => ({
    meta: [{
      title: "Sponsor B2B Events — Vetted Event Sponsorship Opportunities | IGE"
    }, {
      name: "description",
      content: "Sponsor vetted B2B events your buyers actually attend. Compare sponsorship tiers, audience data, and ROI signals. Discover corporate event sponsorship opportunities across the Africa–Europe corridor and globally."
    }, {
      name: "keywords",
      content: "sponsor B2B events, event sponsorship opportunities, corporate sponsorship, how to choose events to sponsor, sponsorship ROI, B2B conference sponsorship, sponsorship tiers, vetted sponsorship marketplace"
    }, {
      property: "og:title",
      content: "Sponsor B2B Events — IGE for Sponsors"
    }, {
      property: "og:description",
      content: "Discover vetted event sponsorship opportunities and commit with confidence."
    }, {
      property: "og:url",
      content: "https://www.insideglobalevents.com/sponsors"
    }],
    links: [{
      rel: "canonical",
      href: "https://www.insideglobalevents.com/sponsors"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$D, "component")
});
const BASE_URL = "https://www.insideglobalevents.com";
const Route$U = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/marketplace", changefreq: "daily", priority: "0.9" },
          { path: "/organisers", changefreq: "monthly", priority: "0.9" },
          { path: "/sponsors", changefreq: "monthly", priority: "0.9" },
          { path: "/partners", changefreq: "monthly", priority: "0.8" },
          { path: "/how-it-works", changefreq: "monthly", priority: "0.8" },
          { path: "/pricing", changefreq: "monthly", priority: "0.8" },
          { path: "/trust-vetting", changefreq: "monthly", priority: "0.7" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/faq", changefreq: "monthly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/waitlist", changefreq: "monthly", priority: "0.5" },
          { path: "/signup", changefreq: "yearly", priority: "0.4" },
          { path: "/login", changefreq: "yearly", priority: "0.3" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" }
        ];
        const urls = entries.map(
          (e) => [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`
          ].filter(Boolean).join("\n")
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600"
          }
        });
      }
    }
  }
});
const $$splitComponentImporter$C = () => import("./signup-UDBFa08T.mjs");
const Route$T = createFileRoute("/signup")({
  head: () => ({
    meta: [{
      title: "Create your IGE account"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$C, "component")
});
const $$splitComponentImporter$B = () => import("./reset-password-cHYyhLPl.mjs");
const Route$S = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{
      title: "Set new password - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$B, "component")
});
const $$splitComponentImporter$A = () => import("./privacy-D6fMcPVY.mjs");
const Route$R = createFileRoute("/privacy")({
  head: () => ({
    meta: [{
      title: "Privacy Policy - Inside Global Events 2026"
    }, {
      name: "description",
      content: "How IGE collects, uses, and protects your data under NDPR and GDPR."
    }, {
      property: "og:title",
      content: "Privacy Policy - Inside Global Events 2026"
    }, {
      property: "og:description",
      content: "How IGE collects, uses, and protects your data."
    }],
    links: [{
      rel: "canonical",
      href: "/privacy"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$A, "component")
});
const $$splitComponentImporter$z = () => import("./pricing-Bc5ED-32.mjs");
const Route$Q = createFileRoute("/pricing")({
  head: () => ({
    meta: [{
      title: "Event Sponsorship Pricing & Commission — IGE"
    }, {
      name: "description",
      content: "Transparent event sponsorship pricing: free listing for organisers, no fees for sponsors, 10% platform commission only when a sponsorship deal closes. Referral partners earn up to 20%."
    }, {
      name: "keywords",
      content: "event sponsorship pricing, sponsorship commission, sponsorship platform fees, sponsorship marketplace cost"
    }, {
      property: "og:title",
      content: "Event Sponsorship Pricing — IGE"
    }, {
      property: "og:description",
      content: "Free to list. Commission only when sponsorship deals close."
    }, {
      property: "og:url",
      content: "https://www.insideglobalevents.com/pricing"
    }],
    links: [{
      rel: "canonical",
      href: "https://www.insideglobalevents.com/pricing"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$z, "component")
});
const $$splitComponentImporter$y = () => import("./partners-B4MifsqO.mjs");
const Route$P = createFileRoute("/partners")({
  head: () => ({
    meta: [{
      title: "Earn Sponsorship Referral Commission — IGE Partner Program"
    }, {
      name: "description",
      content: "Turn your network into recurring revenue. Refer event sponsorship deals on IGE, track conversions, and earn up to 20% transparent commission on every closed sponsorship."
    }, {
      name: "keywords",
      content: "sponsorship referral, event sponsorship affiliate, sponsorship commission, refer sponsors, partnership marketing, B2B sponsorship referral program"
    }, {
      property: "og:title",
      content: "Earn Sponsorship Referral Commission — IGE Partners"
    }, {
      property: "og:description",
      content: "Refer sponsorship deals, earn transparent commission, get paid in your currency."
    }, {
      property: "og:url",
      content: "https://www.insideglobalevents.com/partners"
    }],
    links: [{
      rel: "canonical",
      href: "https://www.insideglobalevents.com/partners"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$y, "component")
});
const $$splitComponentImporter$x = () => import("./organisers-BKb5dXmo.mjs");
const Route$O = createFileRoute("/organisers")({
  head: () => ({
    meta: [{
      title: "Find Event Sponsors — List Your B2B Event on IGE"
    }, {
      name: "description",
      content: "Find event sponsors fast. List your B2B event on IGE's vetted sponsorship marketplace, build sponsorship packages, pitch verified corporate sponsors, and close sponsorship deals. Zero listing fees."
    }, {
      name: "keywords",
      content: "find event sponsors, how to get event sponsorship, list your event for sponsorship, sponsorship packages, sponsorship proposal, attract sponsors, event sponsorship platform for organisers"
    }, {
      property: "og:title",
      content: "Find Event Sponsors — IGE for Organisers"
    }, {
      property: "og:description",
      content: "List your B2B event and reach verified sponsors actively looking for your audience."
    }, {
      property: "og:url",
      content: "https://www.insideglobalevents.com/organisers"
    }],
    links: [{
      rel: "canonical",
      href: "https://www.insideglobalevents.com/organisers"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$x, "component")
});
const $$splitComponentImporter$w = () => import("./onboarding-oA99IX7z.mjs");
const Route$N = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{
      title: "Welcome to IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$w, "component")
});
const $$splitComponentImporter$v = () => import("./marketplace-DjKBJa_j.mjs");
const Route$M = createFileRoute("/marketplace")({
  head: () => ({
    meta: [{
      title: "Event Sponsorship Marketplace — Browse Vetted B2B Events | IGE"
    }, {
      name: "description",
      content: "Browse the IGE event sponsorship marketplace. Filter vetted B2B events by sector, audience, country, and format. Find sponsorship opportunities that match your buyers."
    }, {
      name: "keywords",
      content: "event sponsorship marketplace, sponsorship opportunities, B2B events to sponsor, vetted sponsorship listings, find events to sponsor"
    }, {
      property: "og:title",
      content: "Event Sponsorship Marketplace — IGE"
    }, {
      property: "og:description",
      content: "Discover IGE-vetted sponsorship opportunities across the Africa–Europe corridor and globally."
    }, {
      property: "og:url",
      content: "https://www.insideglobalevents.com/marketplace"
    }],
    links: [{
      rel: "canonical",
      href: "https://www.insideglobalevents.com/marketplace"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$v, "component")
});
const $$splitComponentImporter$u = () => import("./login-D9rGRwu8.mjs");
const search = objectType({
  redirect: stringType().optional()
});
const Route$L = createFileRoute("/login")({
  validateSearch: search,
  head: () => ({
    meta: [{
      title: "Sign in - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$u, "component")
});
const $$splitComponentImporter$t = () => import("./how-it-works-DFIINTSp.mjs");
const Route$K = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [{
      title: "How Event Sponsorship Works on IGE — From Pitch to Paid"
    }, {
      name: "description",
      content: "See how IGE structures B2B event sponsorship deals end-to-end: vetting, sponsorship packages, sponsor matching, contracts, payment, and ROI tracking. From signup to signed sponsorship in days."
    }, {
      name: "keywords",
      content: "how event sponsorship works, sponsorship process, sponsorship deal flow, sponsorship contract, sponsorship activation, sponsorship payment"
    }, {
      property: "og:title",
      content: "How Event Sponsorship Works on IGE"
    }, {
      property: "og:description",
      content: "From signup to signed sponsorship in days, not quarters."
    }, {
      property: "og:url",
      content: "https://www.insideglobalevents.com/how-it-works"
    }],
    links: [{
      rel: "canonical",
      href: "https://www.insideglobalevents.com/how-it-works"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$t, "component")
});
const $$splitComponentImporter$s = () => import("./forgot-password-Tpb7G1_6.mjs");
const Route$J = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{
      title: "Reset password - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const $$splitComponentImporter$r = () => import("./faq-C67aE7ea.mjs");
const Route$I = createFileRoute("/faq")({
  head: () => ({
    meta: [{
      title: "Event Sponsorship FAQ — Vetting, ROI, Commission & Payouts | IGE"
    }, {
      name: "description",
      content: "Answers to the most common event sponsorship questions: how vetting works, sponsorship ROI, commission rates, payouts, contracts, and referral partner earnings."
    }, {
      name: "keywords",
      content: "event sponsorship FAQ, sponsorship ROI, sponsorship commission, sponsorship vetting, sponsorship payouts, referral commission"
    }, {
      property: "og:title",
      content: "Event Sponsorship FAQ — IGE"
    }, {
      property: "og:description",
      content: "Vetting, ROI, commission, and payouts — answered."
    }, {
      property: "og:url",
      content: "https://www.insideglobalevents.com/faq"
    }],
    links: [{
      rel: "canonical",
      href: "https://www.insideglobalevents.com/faq"
    }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [{
          "@type": "Question",
          name: "How long does vetting take?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most listings and accounts are reviewed within 2 to 5 business days once required documents are submitted."
          }
        }, {
          "@type": "Question",
          name: "How much commission does IGE charge?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "IGE charges 10% platform commission on closed sponsorship deals. Sponsors pay no fees."
          }
        }]
      })
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./contact-DuDq5cwO.mjs");
const Route$H = createFileRoute("/contact")({
  head: () => ({
    meta: [{
      title: "Contact IGE — Talk to the Event Sponsorship Team"
    }, {
      name: "description",
      content: "Contact Inside Global Events about sponsorship opportunities, listing your event, partnerships, or vetting. Email, phone, and offices in Lagos and Paris."
    }, {
      property: "og:title",
      content: "Contact IGE — Event Sponsorship Marketplace"
    }, {
      property: "og:description",
      content: "Talk to the IGE team about sponsorships, partnerships, and trust enquiries."
    }, {
      property: "og:url",
      content: "https://www.insideglobalevents.com/contact"
    }],
    links: [{
      rel: "canonical",
      href: "https://www.insideglobalevents.com/contact"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitComponentImporter$p = () => import("./about-Bwger06_.mjs");
const Route$G = createFileRoute("/about")({
  head: () => ({
    meta: [{
      title: "About IGE — The Trust Layer for Event Sponsorship"
    }, {
      name: "description",
      content: "Inside Global Events (IGE) is a vertically integrated event sponsorship marketplace and event intelligence platform built for the Africa–Europe corridor and the global events economy."
    }, {
      name: "keywords",
      content: "about IGE, event sponsorship marketplace, event intelligence, B2B sponsorship platform, Africa Europe events"
    }, {
      property: "og:title",
      content: "About IGE — Event Sponsorship Marketplace"
    }, {
      property: "og:description",
      content: "Commercial infrastructure for B2B event sponsorship: vetted organisers, verified sponsors, accredited referral partners."
    }, {
      property: "og:url",
      content: "https://www.insideglobalevents.com/about"
    }],
    links: [{
      rel: "canonical",
      href: "https://www.insideglobalevents.com/about"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$p, "component")
});
const $$splitComponentImporter$o = () => import("../_authenticated-BFsOu0JM.mjs");
const Route$F = createFileRoute("/_authenticated")({
  beforeLoad: async ({
    location
  }) => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href
        }
      });
    }
  },
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const logo = "/assets/ige-logo-G5cv-1b7.jpeg";
function SiteHeader() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex h-16 max-w-7xl items-center justify-between px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: logo,
          alt: "IGE",
          className: "h-9 w-9 rounded-md object-cover mix-blend-multiply dark:mix-blend-screen"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display italic font-semibold text-brand-gradient text-base sm:text-lg", children: "Inside Global Events 2026" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketplace", className: "transition-colors hover:text-foreground", children: "Marketplace" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/about", className: "transition-colors hover:text-foreground", children: "About" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/how-it-works", className: "transition-colors hover:text-foreground", children: "How it works" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/login",
          className: "hidden rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted sm:inline-flex",
          children: "Sign in"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/signup",
          className: "inline-flex items-center justify-center rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5",
          children: "Sign up"
        }
      )
    ] })
  ] }) });
}
function SiteFooter() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t border-border/60 bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logo, alt: "", "aria-hidden": "true", className: "h-8 w-8 rounded-md object-cover" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-base font-bold tracking-tight", children: "Inside Global Events 2026" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-sm text-sm text-muted-foreground", children: "The vetted marketplace where B2B event organisers, sponsors, and trusted referral partners actually close deals, not just exchange brochures." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-xs text-muted-foreground", children: "Inside Global Events 2026" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-foreground", children: "Platform" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-4 space-y-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/organisers", className: "hover:text-foreground", children: "For Organisers" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/sponsors", className: "hover:text-foreground", children: "For Sponsors" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/partners", className: "hover:text-foreground", children: "Referral Partners" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/how-it-works", className: "hover:text-foreground", children: "How it works" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/pricing", className: "hover:text-foreground", children: "Pricing" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-foreground", children: "Company" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-4 space-y-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/about", className: "hover:text-foreground", children: "About IGE" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/trust-vetting", className: "hover:text-foreground", children: "Trust & vetting" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/faq", className: "hover:text-foreground", children: "FAQ" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/waitlist", className: "hover:text-foreground", children: "Join the waitlist" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", className: "hover:text-foreground", children: "Contact" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/privacy", className: "hover:text-foreground", children: "Privacy" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/terms", className: "hover:text-foreground", children: "Terms" }) })
      ] })
    ] })
  ] }) });
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const FilterInput = objectType({
  q: stringType().max(120).optional(),
  event_types: arrayType(stringType()).max(40).optional(),
  sectors: arrayType(stringType()).max(40).optional(),
  countries: arrayType(stringType()).max(60).optional(),
  city: stringType().max(80).optional(),
  format: enumType(["all", "in_person", "virtual", "hybrid"]).default("all"),
  date_from: stringType().optional(),
  date_to: stringType().optional(),
  audience_min: numberType().int().min(0).optional(),
  audience_max: numberType().int().min(0).optional(),
  vetted_only: booleanType().default(true),
  decision_makers: booleanType().default(false),
  sort: enumType(["newest", "soonest", "audience"]).default("newest"),
  page: numberType().int().min(1).default(1),
  per_page: numberType().int().min(1).max(48).default(12)
});
const FacetInput = objectType({
  vetted_only: booleanType().default(true),
  decision_makers: booleanType().default(false)
});
const getMarketplaceFilterOptions = createServerFn({
  method: "POST"
}).inputValidator((d) => FacetInput.parse(d ?? {})).handler(createSsrRpc("c1172298adadc561e270e73aa1ba7c4f4f1645af6c4b0e9e61f4d9b93e224cb0"));
const listMarketplaceEvents = createServerFn({
  method: "POST"
}).inputValidator((d) => FilterInput.parse(d)).handler(createSsrRpc("9256a6366373c9ce46a2ca6417d26f9458c300a6d5624549a687d46a0e3d94ce"));
const getPublicEventBySlug = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  slug: stringType().min(1).max(200)
}).parse(d)).handler(createSsrRpc("1668ff3b3e1c42130c27c0ae4c888add310a9d691e81f3b3cceaffef25eddc54"));
const getCurrentRates = createServerFn({
  method: "GET"
}).handler(createSsrRpc("4d46fbbb87fad19441d3c5b936df4fab5118283cd438d6ae2d190fa2fc811cb7"));
const CommitInput = objectType({
  event_id: stringType().uuid(),
  readiness_confirmed: literalType(true),
  contact_name: stringType().min(2).max(120),
  contact_title: stringType().max(120).optional().nullable(),
  company_name: stringType().min(1).max(160),
  company_linkedin_url: stringType().url().max(300),
  brand_region: stringType().max(80).optional().nullable(),
  currency: enumType(["NGN", "USD", "GBP", "EUR"]),
  partnership_type: enumType(["cash", "in_kind", "co_creation", "jv"]).optional().nullable(),
  budget_range_min: numberType().nonnegative().optional().nullable(),
  budget_range_max: numberType().nonnegative().optional().nullable(),
  expected_roi: stringType().max(1500).optional().nullable(),
  proposed_start_date: stringType().optional().nullable(),
  tier_id: stringType().uuid().optional().nullable(),
  custom_requirements: stringType().max(2e3).optional().nullable(),
  referral_short_code: stringType().max(20).optional().nullable()
});
const submitCommitmentForm = createServerFn({
  method: "POST"
}).inputValidator((d) => CommitInput.parse(d)).handler(createSsrRpc("d6eb976c170ad97ee3e2f91bd93df565f5b6661cbc351838e1bb4bbf17e6f45a"));
const toggleSaveEvent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  event_id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("26a484c867491ff5af90f0fef8baab21a5583140c090936932aba3722de28566"));
function useScrollReveal(options) {
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const observed = /* @__PURE__ */ new Set();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.dataset.visible = "true";
            io.unobserve(entry.target);
            observed.delete(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px", ...options }
    );
    const updateObservers = () => {
      const targets = root.querySelectorAll("[data-reveal]");
      targets.forEach((el) => {
        if (!observed.has(el) && el.dataset.visible !== "true") {
          observed.add(el);
          io.observe(el);
        }
      });
    };
    updateObservers();
    const observer = new MutationObserver(() => {
      updateObservers();
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      observer.disconnect();
    };
  }, []);
  return ref;
}
const ogImage = "/assets/og-image-DblJ25U2.jpg";
const featuredImg = "/assets/featured-itsekiri-Bh6_OiHl.png";
const Route$E = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IGE — Event Sponsorship Marketplace | Find Sponsors & Sponsor B2B Events" },
      {
        name: "description",
        content: "Inside Global Events (IGE) is the vetted event sponsorship marketplace. Find sponsors for your event, discover B2B events to sponsor, measure sponsorship ROI, and earn referral commission. Africa–Europe corridor and global."
      },
      {
        name: "keywords",
        content: "event sponsorship, event sponsorship marketplace, B2B event sponsorship, find event sponsors, sponsor B2B events, corporate event sponsorship, sponsorship ROI, sponsorship packages, sponsorship platform, vetted sponsors, referral commission, Africa Europe events, conference sponsorship"
      },
      { property: "og:title", content: "IGE — The Event Sponsorship Marketplace" },
      {
        property: "og:description",
        content: "Find sponsors, sponsor vetted B2B events, and earn referral commission on closed sponsorship deals."
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.insideglobalevents.com/" },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage }
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/" }]
  }),
  component: Landing
});
function Landing() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Hero, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stats, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MarketplacePreview, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ThreeSides, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(HowItWorks, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Trust, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(FinalCta, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
function MarketplacePreview() {
  const fetchEvents = useServerFn(listMarketplaceEvents);
  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-preview"],
    queryFn: () => fetchEvents({ data: { vetted_only: false, sort: "newest", per_page: 6 } })
  });
  const events = data?.events ?? [];
  const ref = useScrollReveal();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { ref, className: "border-t border-border/60 bg-muted/20 py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-primary-deep", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3.5 w-3.5" }),
          " The Marketplace"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl", children: "Vetted events looking for your brand." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-xl text-muted-foreground", children: "Browse IGE-vetted sponsorship opportunities. Filter by sector, audience, and budget — no login needed." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/marketplace",
          className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted",
          children: [
            "View full marketplace ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3", children: isLoading ? Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72 animate-pulse rounded-xl bg-muted" }, i)) : events.slice(0, 6).map((e, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to: "/events/$slug",
        params: { slug: e.slug },
        "data-reveal": true,
        "data-delay": String(Math.min(i + 1, 6)),
        className: "group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg",
        style: { borderLeft: "4px solid hsl(var(--primary))" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative aspect-video bg-muted", children: [
            e.banner_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { loading: "lazy", src: e.banner_image_url, alt: e.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-muted text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-10 w-10" }) }),
            e.ige_vetted && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase text-white shadow", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3 w-3" }),
              " Vetted"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-primary-deep", children: e.event_type ?? "Event" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "line-clamp-2 font-display text-base font-bold leading-tight", children: e.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-3 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3" }),
                e.city ?? "-",
                ", ",
                e.country ?? "-"
              ] }),
              e.start_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3 w-3" }),
                new Date(e.start_date).toLocaleDateString()
              ] })
            ] }),
            e.attendance_size && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-3 w-3" }),
              Number(e.attendance_size).toLocaleString(),
              "+ attendees"
            ] })
          ] })
        ]
      },
      e.id
    )) }),
    !isLoading && events.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground", children: [
      "No events listed yet. Check back soon — or ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signup", className: "text-primary hover:underline", children: "list yours" }),
      "."
    ] })
  ] }) });
}
function Hero() {
  const ref = useScrollReveal();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { ref, className: "relative overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "aria-hidden": true,
        className: "pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl",
        style: { background: "var(--gradient-brand-diag)" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "aria-hidden": true,
        className: "pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl",
        style: {
          background: "radial-gradient(circle, oklch(0.55 0.14 162 / 0.6), transparent 70%)"
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-16 lg:grid-cols-12 lg:gap-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-7", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { "data-reveal": true, "data-delay": "1", className: "inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5 text-primary" }),
          "Now live · Vetted events · Verified sponsors"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { "data-reveal": true, "data-delay": "2", className: "mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl", children: [
          "Where B2B events",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-brand-gradient", children: "actually get sponsored." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { "data-reveal": true, "data-delay": "3", className: "mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground", children: "IGE is the vetted marketplace connecting event organisers, brand sponsors, and trusted referral partners. List your event, find your audience, get paid, without the spreadsheets, cold inbound, or broker noise." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, "data-delay": "4", className: "mt-9 flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/signup",
              className: "group inline-flex items-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5",
              children: [
                "List your event",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 transition-transform group-hover:translate-x-0.5" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/marketplace",
              className: "inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted",
              children: "Browse sponsorships"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, "data-delay": "5", className: "mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { icon: ShieldCheck, children: "Every event IGE-vetted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { icon: Earth, children: "Global · 40+ markets" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { icon: Handshake, children: "Commission only, no listing fees" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-reveal": true, "data-delay": "3", className: "relative lg:col-span-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeroVisual, {}) })
    ] }) })
  ] });
}
function Badge({ icon: Icon, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-secondary" }),
    children
  ] });
}
function HeroVisual() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto aspect-[4/5] w-full max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 rotate-[-2deg] overflow-hidden rounded-2xl border border-border bg-card shadow-brand", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-44 w-full overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: featuredImg,
            alt: "Itsekiri Global HomeComing 2026",
            className: "h-full w-full object-cover"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-3 top-3 inline-flex items-center rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur", children: "Featured" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-lg font-bold leading-tight", children: "Itsekiri Global HomeComing 2026" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "Warri Kingdom, Delta State · 17 to 21 Aug 2026" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Attendance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "20,000+ expected" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "From" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "₦5,000,000" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-medium text-secondary-deep", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3 w-3" }),
            " IGE Vetted"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary-deep", children: "Royal Patronage" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-6 -left-6 w-56 rotate-[4deg] rounded-xl border border-border bg-card p-4 shadow-soft", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/15 text-secondary-deep", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Deal closed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: "+₦18,000,000" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-4 -right-4 w-52 -rotate-[5deg] rounded-xl border border-border bg-card p-4 shadow-soft", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary-deep", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "New inquiry" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: "Verified sponsor" })
      ] })
    ] }) })
  ] });
}
function Stats() {
  const ref = useScrollReveal();
  const stats = [
    { v: "100%", l: "of events vetted before going live" },
    { v: "40+", l: "markets, from Paris to Dubai to Singapore" },
    { v: "Zero", l: "listing fees, we earn when you do" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { ref, className: "border-y border-border bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-3", children: stats.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, "data-delay": String(i + 1), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-3xl font-bold text-brand-gradient md:text-4xl", children: s.v }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-sm text-muted-foreground", children: s.l })
  ] }, s.l)) }) });
}
function ThreeSides() {
  const ref = useScrollReveal();
  const sides = [
    {
      id: "organisers",
      tag: "Organisers",
      icon: Megaphone,
      title: "List once. Reach every sponsor who matters.",
      desc: "Build a complete sponsorship pack in a guided 9-step flow. Once IGE-vetted, your event is surfaced to verified sponsors and partners actively looking for your audience.",
      bullets: [
        "Guided event submission with auto-save drafts",
        "Sponsorship tiers, decks, floor plans, all in one place",
        "Optional IGE-managed sales if you want a hands-off run"
      ],
      cta: "List your event",
      to: "/signup"
    },
    {
      id: "sponsors",
      tag: "Sponsors",
      icon: Earth,
      title: "Discover events your buyers are already attending.",
      desc: "Search a curated catalogue of vetted B2B events worldwide. Filter by audience seniority, sector, geography, and budget, then commit with confidence.",
      bullets: [
        "Every event manually IGE-vetted before going live",
        "Side-by-side comparison of tiers, audience and ROI signals",
        "Direct messaging with verified organisers"
      ],
      cta: "Browse events",
      to: "/marketplace"
    },
    {
      id: "partners",
      tag: "Referral Partners",
      icon: Handshake,
      title: "Turn your network into recurring commission.",
      desc: "If you know the brands who sponsor in your sector, IGE pays you for the intro. Generate unique referral links, track deals, and earn transparent commission on every closed sponsorship.",
      bullets: [
        "Personal referral links per event, trackable end-to-end",
        "Tiered commission, paid in your preferred currency",
        "IGB Partner badge once you close your first deal"
      ],
      cta: "Become a partner",
      to: "/signup"
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { ref, className: "mx-auto max-w-7xl px-6 py-24 md:py-32", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, className: "max-w-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep", children: "Built for three sides" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl", children: [
        "One marketplace.",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-brand-gradient", children: "Three ways to win." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-lg text-muted-foreground", children: "IGE is not a directory. It's a working marketplace where organisers list, sponsors discover, and partners earn, all under one vetted roof." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-14 grid gap-6 lg:grid-cols-3", children: sides.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "article",
      {
        id: s.id,
        "data-reveal": true,
        "data-delay": String(i + 1),
        className: "group relative flex flex-col rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-soft",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(s.icon, { className: "h-5 w-5 text-primary" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground", children: s.tag })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-5 font-display text-2xl font-bold leading-tight", children: s.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted-foreground", children: s.desc }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-6 space-y-3", children: s.bullets.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2.5 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground/85", children: b })
          ] }, b)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: s.to,
              className: "mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors group-hover:text-primary-deep",
              children: [
                s.cta,
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
              ]
            }
          )
        ]
      },
      s.id
    )) })
  ] });
}
function HowItWorks() {
  const ref = useScrollReveal();
  const steps = [
    {
      n: "01",
      title: "Sign up & verify",
      desc: "Pick your side, organiser, sponsor, or referral partner. Verify with your work email or LinkedIn so the marketplace stays clean."
    },
    {
      n: "02",
      title: "List, browse, or refer",
      desc: "Organisers publish events through a guided 9-step flow. Sponsors discover and shortlist. Partners generate trackable referral links."
    },
    {
      n: "03",
      title: "Get vetted",
      desc: "Every event passes IGE's manual vetting before going live. No ghost listings, no fake attendance numbers, no surprises."
    },
    {
      n: "04",
      title: "Connect & commit",
      desc: "Verified sponsors message organisers directly. Commit through structured forms, pay securely, and partners get paid commission on close."
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { ref, id: "how", className: "border-t border-border bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6 py-24 md:py-32", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, className: "max-w-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep", children: "How it works" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl", children: "From signup to signed sponsorship, in days, not quarters." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4", children: steps.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "li",
      {
        "data-reveal": true,
        "data-delay": String(i + 1),
        className: "relative rounded-2xl border border-border bg-card p-7",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-sm font-bold text-brand-gradient", children: s.n }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-3 font-display text-lg font-bold", children: s.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: s.desc })
        ]
      },
      s.n
    )) })
  ] }) });
}
function Trust() {
  const ref = useScrollReveal();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { ref, className: "mx-auto max-w-7xl px-6 py-24 md:py-32", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid items-center gap-12 lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep", children: "Trust by design" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl", children: [
        "Vetted humans.",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-brand-gradient", children: "Verified events." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-lg leading-relaxed text-muted-foreground", children: "We built IGE because B2B sponsorship is full of inflated decks, ghost organisers, and brokers chasing finder's fees. So we made vetting non-negotiable, for every event, every sponsor, every partner on the platform." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-8 space-y-4", children: [
        "Every event manually reviewed by IGE before going live",
        "Sponsor accounts verified via business email + LinkedIn",
        "Referral partners scored on track record and disclosure",
        "Fraud signals monitored continuously, bad actors removed"
      ].map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { "data-reveal": true, "data-delay": String(i + 1), className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground/85", children: t })
      ] }, t)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-reveal": true, "data-delay": "2", className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-8 shadow-soft", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-6 w-6" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-lg font-bold", children: "IGE-Vetted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Earned, not bought." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 space-y-4 text-sm", children: [
        ["Identity", "Founder & org verified"],
        ["Track record", "Past editions confirmed"],
        ["Audience", "Attendance & seniority validated"],
        ["Commercials", "Sponsorship pricing reviewed"]
      ].map(([k, v]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: k }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 font-medium text-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-secondary" }),
              v
            ] })
          ]
        },
        k
      )) })
    ] }) })
  ] }) });
}
function FinalCta() {
  const ref = useScrollReveal();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { ref, className: "px-6 pb-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, className: "relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-gradient-diag px-8 py-16 text-white shadow-brand md:px-16 md:py-20", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "aria-hidden": true,
        className: "absolute inset-0 opacity-30",
        style: {
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 50%)"
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl", children: "Ready to make your next sponsorship deal a quiet one?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-lg opacity-90", children: "Join organisers, sponsors and partners already working inside IGE. Zero listing fees. Vetted from day one." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/signup",
            className: "inline-flex items-center gap-2 rounded-md bg-white px-6 py-3.5 text-sm font-semibold text-primary-deep transition-transform hover:-translate-y-0.5",
            children: [
              "Create your account",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "a",
          {
            href: "mailto:Hi@insideglobalevents.com",
            className: "inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20",
            children: "Talk to the team"
          }
        )
      ] })
    ] })
  ] }) });
}
const generateReferralLink = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  event_id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("ead3463169d1c6c2301a516c0ab25d4ea7cb5d4f520ae2fb014b945fedea69fc"));
const trackReferralClick = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  short_code: stringType().min(1).max(20),
  ua: stringType().max(500).optional(),
  referrer: stringType().max(500).optional()
}).parse(d)).handler(createSsrRpc("ed05c36660f54791bd4e669cb26f36e3ed11715414ab442a8da7583e2eacbdb7"));
const getReferralDashboard = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("b4149100c84f1bf3fbb7367f903a1e8d2dc8c9da0e3f6f598728b27ff9ace4f8"));
const $$splitComponentImporter$n = () => import("./r._code-BTU5dmpx.mjs");
const Route$D = createFileRoute("/r/$code")({
  beforeLoad: async ({
    params
  }) => {
    try {
      const res = await trackReferralClick({
        data: {
          short_code: params.code
        }
      });
      if (res.ok && res.slug) {
        throw redirect({
          to: "/events/$slug",
          params: {
            slug: res.slug
          },
          search: {
            ref: params.code
          }
        });
      }
    } catch (e) {
      if (e?.isRedirect) throw e;
    }
    throw redirect({
      to: "/marketplace"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const $$splitComponentImporter$m = () => import("./onboarding.profile-esitc0y4.mjs");
const Route$C = createFileRoute("/onboarding/profile")({
  head: () => ({
    meta: [{
      title: "Complete your profile - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$m, "component")
});
function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mb-1.5 block text-sm font-medium", children: [
      label,
      required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: " *" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type, required, value, placeholder, onChange: (e) => onChange(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" })
  ] });
}
function SelectField({
  label,
  value,
  onChange,
  options
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-sm font-medium", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value, onChange: (e) => onChange(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select…" }),
      options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: o, children: o }, o))
    ] })
  ] });
}
function ChipMulti({
  label,
  options,
  value,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-sm font-medium", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: options.map((o) => {
      const on = value.includes(o);
      return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onChange(on ? value.filter((x) => x !== o) : [...value, o]), className: `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${on ? "border-primary bg-brand-soft text-primary-deep" : "border-border bg-card text-muted-foreground hover:bg-muted"}`, children: o }, o);
    }) })
  ] });
}
function Checkbox({
  label,
  checked,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-2.5 text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked, onChange: (e) => onChange(e.target.checked), className: "h-4 w-4 rounded border-input" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label })
  ] });
}
const $$splitComponentImporter$l = () => import("./events._slug-C3b-syRe.mjs");
const searchSchema$1 = objectType({
  ref: stringType().max(20).optional()
});
const Route$B = createFileRoute("/events/$slug")({
  validateSearch: searchSchema$1,
  head: ({
    params
  }) => ({
    meta: [{
      title: `${params.slug} · IGE`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
function redactEmail$2(email) {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}
const Route$A = createFileRoute("/email/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabaseUrl = "https://behwdpsrczmqsyaysidv.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (!token) {
          return Response.json({ error: "Token is required" }, { status: 400 });
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const { data: tokenRecord, error: lookupError } = await supabase2.from("email_unsubscribe_tokens").select("*").eq("token", token).maybeSingle();
        if (lookupError || !tokenRecord) {
          return Response.json({ error: "Invalid or expired token" }, { status: 404 });
        }
        if (tokenRecord.used_at) {
          return Response.json({ valid: false, reason: "already_unsubscribed" });
        }
        return Response.json({ valid: true });
      },
      POST: async ({ request }) => {
        const supabaseUrl = "https://behwdpsrczmqsyaysidv.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        const url = new URL(request.url);
        let token = url.searchParams.get("token");
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("application/x-www-form-urlencoded")) {
          const formText = await request.text();
          const params = new URLSearchParams(formText);
          if (!params.get("List-Unsubscribe")) {
            const formToken = params.get("token");
            if (formToken) {
              token = formToken;
            }
          }
        } else {
          try {
            const body2 = await request.json();
            if (body2.token) {
              token = body2.token;
            }
          } catch {
          }
        }
        if (!token) {
          return Response.json({ error: "Token is required" }, { status: 400 });
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const { data: tokenRecord, error: lookupError } = await supabase2.from("email_unsubscribe_tokens").select("*").eq("token", token).maybeSingle();
        if (lookupError || !tokenRecord) {
          return Response.json({ error: "Invalid or expired token" }, { status: 404 });
        }
        if (tokenRecord.used_at) {
          return Response.json({ success: false, reason: "already_unsubscribed" });
        }
        const { data: updated, error: updateError } = await supabase2.from("email_unsubscribe_tokens").update({ used_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("token", token).is("used_at", null).select().maybeSingle();
        if (updateError) {
          console.error("Failed to mark token as used", { error: updateError, token });
          return Response.json({ error: "Failed to process unsubscribe" }, { status: 500 });
        }
        if (!updated) {
          return Response.json({ success: false, reason: "already_unsubscribed" });
        }
        const { error: suppressError } = await supabase2.from("suppressed_emails").upsert(
          { email: tokenRecord.email.toLowerCase(), reason: "unsubscribe" },
          { onConflict: "email" }
        );
        if (suppressError) {
          console.error("Failed to suppress email", {
            error: suppressError,
            email_redacted: redactEmail$2(tokenRecord.email)
          });
          return Response.json({ error: "Failed to process unsubscribe" }, { status: 500 });
        }
        console.log("Email unsubscribed", {
          email_redacted: redactEmail$2(tokenRecord.email)
        });
        return Response.json({ success: true });
      }
    }
  }
});
const $$splitComponentImporter$k = () => import("./settings-DMPjOH-d.mjs");
const Route$z = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{
      title: "Account settings - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const Route$y = createFileRoute("/_authenticated/referrals")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/referrals" });
  }
});
const Route$x = createFileRoute("/_authenticated/pipeline")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/pipeline" });
  }
});
const $$splitComponentImporter$j = () => import("./messages-DKxDMdov.mjs");
const searchSchema = objectType({
  thread: stringType().uuid().optional(),
  to: stringType().uuid().optional(),
  event_id: stringType().uuid().optional()
});
const Route$w = createFileRoute("/_authenticated/messages")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{
      title: "Messages - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./events-BFsOu0JM.mjs");
const Route$v = createFileRoute("/_authenticated/events")({
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./deals-E1j5xXGz.mjs");
const Route$u = createFileRoute("/_authenticated/deals")({
  head: () => ({
    meta: [{
      title: "My deals - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./dashboard-BFsOu0JM.mjs");
const Route$t = createFileRoute("/_authenticated/dashboard")({
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./events.index-yiHUSD_Z.mjs");
const Route$s = createFileRoute("/_authenticated/events/")({
  head: () => ({
    meta: [{
      title: "My events - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./dashboard.index-D7qu1q15.mjs");
const Route$r = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [{
      title: "Dashboard - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
function parseSuppressionPayload(body2) {
  const parsed = JSON.parse(body2);
  if (!parsed.data) {
    throw new Error("Missing data field in payload");
  }
  const data = parsed.data;
  if (!data.email || !data.reason) {
    throw new Error("Missing required fields: email, reason");
  }
  return data;
}
function mapReasonToStatus(reason) {
  switch (reason) {
    case "bounce":
      return "bounced";
    case "complaint":
      return "complained";
    default:
      return "suppressed";
  }
}
function mapReasonToMessage(reason) {
  switch (reason) {
    case "bounce":
      return "Permanent bounce — email address is invalid or rejected";
    case "complaint":
      return "Spam complaint — recipient marked email as spam";
    case "unsubscribe":
      return "Recipient unsubscribed";
    default:
      return "Email suppressed";
  }
}
const Route$q = createFileRoute("/lovable/email/suppression")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        const supabaseUrl = "https://behwdpsrczmqsyaysidv.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
          console.error("Missing required environment variables");
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        let payload;
        try {
          const verified = await verifyWebhookRequest({
            req: request,
            secret: apiKey,
            parser: parseSuppressionPayload
          });
          payload = verified.payload;
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case "invalid_signature":
                console.error("Invalid webhook signature");
                return Response.json({ error: "Invalid signature" }, { status: 401 });
              case "stale_timestamp":
                console.error("Stale webhook timestamp");
                return Response.json({ error: "Stale timestamp" }, { status: 401 });
              case "invalid_payload":
              case "invalid_json":
                console.error("Invalid payload", { code: error.code });
                return Response.json({ error: "Invalid payload" }, { status: 400 });
              default:
                console.error("Webhook verification failed", {
                  code: error.code,
                  message: error.message
                });
                return Response.json({ error: "Verification failed" }, { status: 401 });
            }
          }
          console.error("Unexpected error during verification", { error });
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const normalizedEmail = payload.email.toLowerCase();
        const { error: suppressError } = await supabase2.from("suppressed_emails").upsert(
          {
            email: normalizedEmail,
            reason: payload.reason,
            metadata: payload.metadata ?? null
          },
          { onConflict: "email" }
        );
        if (suppressError) {
          console.error("Failed to upsert suppressed email", {
            error: suppressError,
            email_redacted: normalizedEmail[0] + "***@" + normalizedEmail.split("@")[1]
          });
          return Response.json({ error: "Failed to write suppression" }, { status: 500 });
        }
        const sendLogStatus = mapReasonToStatus(payload.reason);
        const sendLogMessage = mapReasonToMessage(payload.reason);
        const { error: insertError } = await supabase2.from("email_send_log").insert({
          message_id: payload.message_id ?? null,
          template_name: "system",
          recipient_email: normalizedEmail,
          status: sendLogStatus,
          error_message: sendLogMessage,
          metadata: payload.metadata ?? null
        });
        if (insertError) {
          console.warn("Failed to insert email_send_log", {
            error: insertError
          });
        }
        console.log("Suppression processed", {
          email_redacted: normalizedEmail[0] + "***@" + normalizedEmail.split("@")[1],
          reason: payload.reason,
          is_retry: payload.is_retry,
          retry_count: payload.retry_count,
          has_message_id: !!payload.message_id
        });
        return Response.json({ success: true });
      }
    }
  }
});
const SITE_NAME$4 = "Inside Global Events 2026";
const ContactConfirmationEmail = ({ name, subject }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Preview, { children: "We received your message — IGE will be in touch shortly." }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$8, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$8, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$8, children: name ? `Thanks, ${name}.` : "Thanks for reaching out." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: text$6, children: [
      "We've received your message",
      subject ? ` regarding "${subject}"` : "",
      " and the ",
      SITE_NAME$4,
      " team will get back to you within one business day."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: text$6, children: "If your enquiry is urgent, reply to this email or call +234 903 091 5964." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: footer$6, children: [
      "— The ",
      SITE_NAME$4,
      " team"
    ] })
  ] }) })
] });
const template$2 = {
  component: ContactConfirmationEmail,
  subject: "We received your message",
  displayName: "Contact confirmation",
  previewData: { name: "Jane", subject: "Sponsorship enquiry" }
};
const main$8 = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container$8 = { padding: "32px 28px", maxWidth: "560px" };
const h1$8 = { fontSize: "22px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 18px" };
const text$6 = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", margin: "0 0 16px" };
const footer$6 = { fontSize: "12px", color: "#71717a", margin: "28px 0 0" };
const ContactInternalEmail = ({ name, email, company, subject, message }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
    "New contact form submission",
    name ? ` from ${name}` : ""
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$7, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$7, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$7, children: "New contact submission" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv$1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Name:" }),
      " ",
      name ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv$1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Email:" }),
      " ",
      email ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv$1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Company:" }),
      " ",
      company ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv$1, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Subject:" }),
      " ",
      subject ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Hr, { style: hr$1 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: body$1, children: message ?? "(no message)" })
  ] }) })
] });
const template$1 = {
  component: ContactInternalEmail,
  subject: (d) => `Contact form: ${d.subject ?? "New message"}`,
  displayName: "Contact form — internal",
  previewData: { name: "Jane Doe", email: "jane@brand.com", company: "Acme", subject: "Sponsorship enquiry", message: "Hi, we'd love to learn more about your events." }
};
const main$7 = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container$7 = { padding: "32px 28px", maxWidth: "560px" };
const h1$7 = { fontSize: "20px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 18px" };
const kv$1 = { fontSize: "14px", color: "#27272a", margin: "0 0 6px" };
const body$1 = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", whiteSpace: "pre-wrap" };
const hr$1 = { borderColor: "#e4e4e7", margin: "16px 0" };
const WaitlistInternalEmail = ({ audience, name, email, company, role, country, phone, notes }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
    "New waitlist signup",
    name ? ` — ${name}` : ""
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$6, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$6, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$6, children: "New waitlist signup" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Audience:" }),
      " ",
      audience ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Name:" }),
      " ",
      name ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Email:" }),
      " ",
      email ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Company:" }),
      " ",
      company ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Role:" }),
      " ",
      role ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Country:" }),
      " ",
      country ?? "—"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: kv, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "Phone:" }),
      " ",
      phone ?? "—"
    ] }),
    notes ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Hr, { style: hr }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: body, children: notes })
    ] }) : null
  ] }) })
] });
const template = {
  component: WaitlistInternalEmail,
  subject: (d) => `Waitlist: ${d.audience ?? "signup"} — ${d.name ?? d.email ?? ""}`,
  displayName: "Waitlist — internal",
  previewData: { audience: "organiser", name: "Jane", email: "jane@brand.com", company: "Acme", role: "Founder", country: "Nigeria" }
};
const main$6 = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container$6 = { padding: "32px 28px", maxWidth: "560px" };
const h1$6 = { fontSize: "20px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 18px" };
const kv = { fontSize: "14px", color: "#27272a", margin: "0 0 6px" };
const body = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", whiteSpace: "pre-wrap" };
const hr = { borderColor: "#e4e4e7", margin: "16px 0" };
const TEMPLATES = {
  "contact-confirmation": template$2,
  "contact-internal": template$1,
  "waitlist-internal": template
};
const SITE_NAME$3 = "Inside Global Events 2026";
const SENDER_DOMAIN$2 = "notify.www.insideglobalevents.com";
const FROM_DOMAIN$2 = "notify.www.insideglobalevents.com";
function generateToken$1() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sendTransactionalEmailServer(params) {
  const { templateName, templateData = {} } = params;
  const template2 = TEMPLATES[templateName];
  if (!template2) throw new Error(`Template '${templateName}' not found`);
  const effectiveRecipient = template2.to || params.recipientEmail;
  if (!effectiveRecipient) throw new Error("recipientEmail required");
  const normalized = effectiveRecipient.toLowerCase();
  const messageId = crypto.randomUUID();
  const idempotencyKey = params.idempotencyKey || messageId;
  const { data: suppressed } = await supabaseAdmin.from("suppressed_emails").select("id").eq("email", normalized).maybeSingle();
  if (suppressed) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: "suppressed"
    });
    return { success: false, reason: "suppressed" };
  }
  let unsubscribeToken;
  const { data: existing } = await supabaseAdmin.from("email_unsubscribe_tokens").select("token, used_at").eq("email", normalized).maybeSingle();
  if (existing && !existing.used_at) {
    unsubscribeToken = existing.token;
  } else {
    unsubscribeToken = generateToken$1();
    await supabaseAdmin.from("email_unsubscribe_tokens").upsert({ token: unsubscribeToken, email: normalized }, { onConflict: "email", ignoreDuplicates: true });
    const { data: stored } = await supabaseAdmin.from("email_unsubscribe_tokens").select("token").eq("email", normalized).maybeSingle();
    if (stored) unsubscribeToken = stored.token;
  }
  const element = reactExports.createElement(template2.component, templateData);
  const html = await render(element);
  const text2 = await render(element, { plainText: true });
  const subject = typeof template2.subject === "function" ? template2.subject(templateData) : template2.subject;
  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: "pending"
  });
  const { error } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME$3} <noreply@${FROM_DOMAIN$2}>`,
      sender_domain: SENDER_DOMAIN$2,
      subject,
      html,
      text: text2,
      purpose: "transactional",
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  if (error) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: "failed",
      error_message: error.message
    });
    throw new Error(`Failed to enqueue: ${error.message}`);
  }
  return { success: true, messageId };
}
const HI_EMAIL$1 = "hi@insideglobalevents.com";
const Schema$1 = objectType({
  audience: stringType().max(80),
  name: stringType().max(200),
  email: stringType().email().max(320),
  company: stringType().max(200).optional().nullable(),
  role: stringType().max(200).optional().nullable(),
  country: stringType().max(200).optional().nullable(),
  phone: stringType().max(80).optional().nullable(),
  notes: stringType().max(2e3).optional().nullable()
});
const Route$p = createFileRoute("/api/public/waitlist-notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body2;
        try {
          body2 = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = Schema$1.safeParse(body2);
        if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
        const d = parsed.data;
        try {
          await sendTransactionalEmailServer({
            templateName: "waitlist-internal",
            recipientEmail: HI_EMAIL$1,
            idempotencyKey: `waitlist-${d.email}-${Date.now()}`,
            templateData: d
          });
        } catch (e) {
          console.error("waitlist email failed", e);
          return Response.json({ success: false }, { status: 200 });
        }
        return Response.json({ success: true });
      }
    }
  }
});
const HI_EMAIL = "hi@insideglobalevents.com";
const Schema = objectType({
  name: stringType().trim().min(1).max(100),
  email: stringType().trim().email().max(255),
  company: stringType().trim().max(150).optional().or(literalType("")),
  subject: stringType().trim().min(1).max(150),
  message: stringType().trim().min(10).max(2e3)
});
const Route$o = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body2;
        try {
          body2 = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = Schema.safeParse(body2);
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
        }
        const data = parsed.data;
        const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || null;
        const { data: row, error } = await supabaseAdmin.from("contact_submissions").insert({
          name: data.name,
          email: data.email,
          company: data.company || null,
          subject: data.subject,
          message: data.message,
          ip_address: ip
        }).select("id").single();
        if (error) {
          console.error("contact insert failed", error);
          return Response.json({ error: "Failed to save submission" }, { status: 500 });
        }
        try {
          await Promise.all([
            sendTransactionalEmailServer({
              templateName: "contact-internal",
              recipientEmail: HI_EMAIL,
              idempotencyKey: `contact-internal-${row.id}`,
              templateData: {
                name: data.name,
                email: data.email,
                company: data.company || "",
                subject: data.subject,
                message: data.message
              }
            }),
            sendTransactionalEmailServer({
              templateName: "contact-confirmation",
              recipientEmail: data.email,
              idempotencyKey: `contact-confirm-${row.id}`,
              templateData: { name: data.name, subject: data.subject }
            })
          ]);
        } catch (e) {
          console.error("contact email enqueue failed", e);
        }
        return Response.json({ success: true });
      }
    }
  }
});
const $$splitComponentImporter$d = () => import("./dashboard.vetting-Ci2goPqa.mjs");
const Route$n = createFileRoute("/_authenticated/dashboard/vetting")({
  head: () => ({
    meta: [{
      title: "Event queue - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./dashboard.submissions-Bvs-yFIc.mjs");
const Route$m = createFileRoute("/_authenticated/dashboard/submissions")({
  head: () => ({
    meta: [{
      title: "Submissions - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./dashboard.saved-xOhGxsTn.mjs");
const Route$l = createFileRoute("/_authenticated/dashboard/saved")({
  head: () => ({
    meta: [{
      title: "Saved events - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./dashboard.revenue-D3bL6p7-.mjs");
const Route$k = createFileRoute("/_authenticated/dashboard/revenue")({
  head: () => ({
    meta: [{
      title: "Revenue & deals - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./dashboard.requests-BaCzb0hJ.mjs");
const Route$j = createFileRoute("/_authenticated/dashboard/requests")({
  head: () => ({
    meta: [{
      title: "My requests - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./dashboard.referrals-pLtZufwt.mjs");
const Route$i = createFileRoute("/_authenticated/dashboard/referrals")({
  head: () => ({
    meta: [{
      title: "My referrals - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./dashboard.pipeline-BXm1I2nx.mjs");
const Route$h = createFileRoute("/_authenticated/dashboard/pipeline")({
  head: () => ({
    meta: [{
      title: "Pipeline - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./dashboard.explore-1dIyrNpY.mjs");
const Route$g = createFileRoute("/_authenticated/dashboard/explore")({
  head: () => ({
    meta: [{
      title: "Explore - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./dashboard.discover-BqguqqYH.mjs");
const Route$f = createFileRoute("/_authenticated/dashboard/discover")({
  head: () => ({
    meta: [{
      title: "Discover - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./dashboard.deals-Bhg6rFkW.mjs");
const Route$e = createFileRoute("/_authenticated/dashboard/deals")({
  head: () => ({
    meta: [{
      title: "Commission pipeline - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./dashboard.controls-CfqME-E2.mjs");
const Route$d = createFileRoute("/_authenticated/dashboard/controls")({
  head: () => ({
    meta: [{
      title: "Fraud & rates - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./dashboard.commitments-DOUbU2aP.mjs");
const Route$c = createFileRoute("/_authenticated/dashboard/commitments")({
  head: () => ({
    meta: [{
      title: "My commitments - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./dashboard.analytics-AqmgzzKw.mjs");
const Route$b = createFileRoute("/_authenticated/dashboard/analytics")({
  head: () => ({
    meta: [{
      title: "Analytics - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const Route$a = createFileRoute("/_authenticated/admin/vetting")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/vetting" });
  }
});
const Route$9 = createFileRoute("/_authenticated/admin/submissions")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/submissions" });
  }
});
const Route$8 = createFileRoute("/_authenticated/admin/revenue")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/revenue" });
  }
});
const SITE_NAME$2 = "connect-sponsor-earn";
const SENDER_DOMAIN$1 = "notify.www.insideglobalevents.com";
const FROM_DOMAIN$1 = "notify.www.insideglobalevents.com";
function redactEmail$1(email) {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}
function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const Route$7 = createFileRoute("/lovable/email/transactional/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = "https://behwdpsrczmqsyaysidv.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
          console.error("Missing required environment variables");
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user }, error: authError } = await supabase2.auth.getUser(token);
        if (authError || !user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        let templateName;
        let recipientEmail;
        let idempotencyKey;
        let messageId;
        let templateData = {};
        try {
          const body2 = await request.json();
          templateName = body2.templateName || body2.template_name;
          recipientEmail = body2.recipientEmail || body2.recipient_email;
          messageId = crypto.randomUUID();
          idempotencyKey = body2.idempotencyKey || body2.idempotency_key || messageId;
          if (body2.templateData && typeof body2.templateData === "object") {
            templateData = body2.templateData;
          }
        } catch {
          return Response.json(
            { error: "Invalid JSON in request body" },
            { status: 400 }
          );
        }
        if (!templateName) {
          return Response.json(
            { error: "templateName is required" },
            { status: 400 }
          );
        }
        const template2 = TEMPLATES[templateName];
        if (!template2) {
          console.error("Template not found in registry", { templateName });
          return Response.json(
            {
              error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}`
            },
            { status: 404 }
          );
        }
        const effectiveRecipient = template2.to || recipientEmail;
        if (!effectiveRecipient) {
          return Response.json(
            {
              error: "recipientEmail is required (unless the template defines a fixed recipient)"
            },
            { status: 400 }
          );
        }
        const { data: suppressed, error: suppressionError } = await supabase2.from("suppressed_emails").select("id").eq("email", effectiveRecipient.toLowerCase()).maybeSingle();
        if (suppressionError) {
          console.error("Suppression check failed — refusing to send", {
            error: suppressionError,
            recipient_redacted: redactEmail$1(effectiveRecipient)
          });
          return Response.json(
            { error: "Failed to verify suppression status" },
            { status: 500 }
          );
        }
        if (suppressed) {
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            status: "suppressed"
          });
          console.log("Email suppressed", {
            templateName,
            recipient_redacted: redactEmail$1(effectiveRecipient)
          });
          return Response.json({ success: false, reason: "email_suppressed" });
        }
        const normalizedEmail = effectiveRecipient.toLowerCase();
        let unsubscribeToken;
        const { data: existingToken, error: tokenLookupError } = await supabase2.from("email_unsubscribe_tokens").select("token, used_at").eq("email", normalizedEmail).maybeSingle();
        if (tokenLookupError) {
          console.error("Token lookup failed", {
            error: tokenLookupError,
            email_redacted: redactEmail$1(normalizedEmail)
          });
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            status: "failed",
            error_message: "Failed to look up unsubscribe token"
          });
          return Response.json(
            { error: "Failed to prepare email" },
            { status: 500 }
          );
        }
        if (existingToken && !existingToken.used_at) {
          unsubscribeToken = existingToken.token;
        } else if (!existingToken) {
          unsubscribeToken = generateToken();
          const { error: tokenError } = await supabase2.from("email_unsubscribe_tokens").upsert(
            { token: unsubscribeToken, email: normalizedEmail },
            { onConflict: "email", ignoreDuplicates: true }
          );
          if (tokenError) {
            console.error("Failed to create unsubscribe token", {
              error: tokenError
            });
            await supabase2.from("email_send_log").insert({
              message_id: messageId,
              template_name: templateName,
              recipient_email: effectiveRecipient,
              status: "failed",
              error_message: "Failed to create unsubscribe token"
            });
            return Response.json(
              { error: "Failed to prepare email" },
              { status: 500 }
            );
          }
          const { data: storedToken, error: reReadError } = await supabase2.from("email_unsubscribe_tokens").select("token").eq("email", normalizedEmail).maybeSingle();
          if (reReadError || !storedToken) {
            console.error("Failed to read back unsubscribe token after upsert", {
              error: reReadError,
              email_redacted: redactEmail$1(normalizedEmail)
            });
            await supabase2.from("email_send_log").insert({
              message_id: messageId,
              template_name: templateName,
              recipient_email: effectiveRecipient,
              status: "failed",
              error_message: "Failed to confirm unsubscribe token storage"
            });
            return Response.json(
              { error: "Failed to prepare email" },
              { status: 500 }
            );
          }
          unsubscribeToken = storedToken.token;
        } else {
          console.warn("Unsubscribe token already used but email not suppressed", {
            email_redacted: redactEmail$1(normalizedEmail)
          });
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            status: "suppressed",
            error_message: "Unsubscribe token used but email missing from suppressed list"
          });
          return Response.json({ success: false, reason: "email_suppressed" });
        }
        const element = reactExports.createElement(template2.component, templateData);
        const html = await render(element);
        const plainText = await render(element, { plainText: true });
        const resolvedSubject = typeof template2.subject === "function" ? template2.subject(templateData) : template2.subject;
        await supabase2.from("email_send_log").insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: effectiveRecipient,
          status: "pending"
        });
        const { error: enqueueError } = await supabase2.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: effectiveRecipient,
            from: `${SITE_NAME$2} <noreply@${FROM_DOMAIN$1}>`,
            sender_domain: SENDER_DOMAIN$1,
            subject: resolvedSubject,
            html,
            text: plainText,
            purpose: "transactional",
            label: templateName,
            idempotency_key: idempotencyKey,
            unsubscribe_token: unsubscribeToken,
            queued_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        if (enqueueError) {
          console.error("Failed to enqueue email", {
            error: enqueueError,
            templateName,
            recipient_redacted: redactEmail$1(effectiveRecipient)
          });
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: templateName,
            recipient_email: effectiveRecipient,
            status: "failed",
            error_message: "Failed to enqueue email"
          });
          return Response.json(
            { error: "Failed to enqueue email" },
            { status: 500 }
          );
        }
        console.log("Transactional email enqueued", {
          templateName,
          recipient_redacted: redactEmail$1(effectiveRecipient)
        });
        return Response.json({ success: true, queued: true });
      }
    }
  }
});
const Route$6 = createFileRoute("/lovable/email/transactional/preview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.replace(/^Bearer\s+/i, "");
        if (token !== apiKey) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const templateNames = Object.keys(TEMPLATES);
        const results = [];
        for (const name of templateNames) {
          const entry = TEMPLATES[name];
          const displayName = entry.displayName || name;
          if (!entry.previewData) {
            results.push({
              templateName: name,
              displayName,
              subject: "",
              html: "",
              status: "preview_data_required"
            });
            continue;
          }
          try {
            const html = await render(
              reactExports.createElement(entry.component, entry.previewData)
            );
            const resolvedSubject = typeof entry.subject === "function" ? entry.subject(entry.previewData) : entry.subject;
            results.push({
              templateName: name,
              displayName,
              subject: resolvedSubject,
              html,
              status: "ready"
            });
          } catch (err) {
            console.error("Failed to render template for preview", {
              template: name,
              error: err
            });
            results.push({
              templateName: name,
              displayName,
              subject: "",
              html: "",
              status: "render_failed",
              errorMessage: err instanceof Error ? err.message : String(err)
            });
          }
        }
        return Response.json({ templates: results });
      }
    }
  }
});
const MAX_RETRIES = 5;
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_SEND_DELAY_MS = 200;
const DEFAULT_AUTH_TTL_MINUTES = 15;
const DEFAULT_TRANSACTIONAL_TTL_MINUTES = 60;
function isRateLimited(error) {
  if (error && typeof error === "object" && "status" in error) {
    return error.status === 429;
  }
  return error instanceof Error && error.message.includes("429");
}
function isForbidden(error) {
  if (error && typeof error === "object" && "status" in error) {
    return error.status === 403;
  }
  return error instanceof Error && error.message.includes("403");
}
function getRetryAfterSeconds(error) {
  if (error && typeof error === "object" && "retryAfterSeconds" in error) {
    return error.retryAfterSeconds ?? 60;
  }
  return 60;
}
async function moveToDlq(supabase2, queue, msg, reason) {
  const payload = msg.message;
  await supabase2.from("email_send_log").insert({
    message_id: payload.message_id,
    template_name: payload.label || queue,
    recipient_email: payload.to,
    status: "dlq",
    error_message: reason
  });
  const { error } = await supabase2.rpc("move_to_dlq", {
    source_queue: queue,
    dlq_name: `${queue}_dlq`,
    message_id: msg.msg_id,
    payload
  });
  if (error) {
    console.error("Failed to move message to DLQ", { queue, msg_id: msg.msg_id, reason, error });
  }
}
const Route$5 = createFileRoute("/lovable/email/queue/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        const supabaseUrl = "https://behwdpsrczmqsyaysidv.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
          console.error("Missing required environment variables");
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (token !== supabaseServiceKey) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const { data: state } = await supabase2.from("email_send_state").select("retry_after_until, batch_size, send_delay_ms, auth_email_ttl_minutes, transactional_email_ttl_minutes").single();
        if (state?.retry_after_until && new Date(state.retry_after_until) > /* @__PURE__ */ new Date()) {
          return Response.json({ skipped: true, reason: "rate_limited" });
        }
        const batchSize = state?.batch_size ?? DEFAULT_BATCH_SIZE;
        const sendDelayMs = state?.send_delay_ms ?? DEFAULT_SEND_DELAY_MS;
        const ttlMinutes = {
          auth_emails: state?.auth_email_ttl_minutes ?? DEFAULT_AUTH_TTL_MINUTES,
          transactional_emails: state?.transactional_email_ttl_minutes ?? DEFAULT_TRANSACTIONAL_TTL_MINUTES
        };
        let totalProcessed = 0;
        for (const queue of ["auth_emails", "transactional_emails"]) {
          const { data: messages, error: readError } = await supabase2.rpc("read_email_batch", {
            queue_name: queue,
            batch_size: batchSize,
            vt: 30
          });
          if (readError) {
            console.error("Failed to read email batch", { queue, error: readError });
            continue;
          }
          if (!messages?.length) continue;
          const messageIds = Array.from(
            new Set(
              messages.map(
                (msg) => msg?.message?.message_id && typeof msg.message.message_id === "string" ? msg.message.message_id : null
              ).filter((id) => Boolean(id))
            )
          );
          const failedAttemptsByMessageId = /* @__PURE__ */ new Map();
          if (messageIds.length > 0) {
            const { data: failedRows, error: failedRowsError } = await supabase2.from("email_send_log").select("message_id").in("message_id", messageIds).eq("status", "failed");
            if (failedRowsError) {
              console.error("Failed to load failed-attempt counters", {
                queue,
                error: failedRowsError
              });
            } else {
              for (const row of failedRows ?? []) {
                const messageId = row?.message_id;
                if (typeof messageId !== "string" || !messageId) continue;
                failedAttemptsByMessageId.set(
                  messageId,
                  (failedAttemptsByMessageId.get(messageId) ?? 0) + 1
                );
              }
            }
          }
          for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const payload = msg.message;
            const failedAttempts = payload?.message_id && typeof payload.message_id === "string" ? failedAttemptsByMessageId.get(payload.message_id) ?? 0 : msg.read_ct ?? 0;
            const queuedAt = payload.queued_at ?? msg.enqueued_at;
            if (queuedAt) {
              const ageMs = Date.now() - new Date(queuedAt).getTime();
              const maxAgeMs = ttlMinutes[queue] * 60 * 1e3;
              if (ageMs > maxAgeMs) {
                console.warn("Email expired (TTL exceeded)", {
                  queue,
                  msg_id: msg.msg_id,
                  queued_at: queuedAt,
                  ttl_minutes: ttlMinutes[queue]
                });
                await moveToDlq(supabase2, queue, msg, `TTL exceeded (${ttlMinutes[queue]} minutes)`);
                continue;
              }
            }
            if (failedAttempts >= MAX_RETRIES) {
              await moveToDlq(supabase2, queue, msg, `Max retries (${MAX_RETRIES}) exceeded (attempted ${failedAttempts} times)`);
              continue;
            }
            if (payload.message_id) {
              const { data: alreadySent } = await supabase2.from("email_send_log").select("id").eq("message_id", payload.message_id).eq("status", "sent").maybeSingle();
              if (alreadySent) {
                console.warn("Skipping duplicate send (already sent)", {
                  queue,
                  msg_id: msg.msg_id,
                  message_id: payload.message_id
                });
                const { error: dupDelError } = await supabase2.rpc("delete_email", {
                  queue_name: queue,
                  message_id: msg.msg_id
                });
                if (dupDelError) {
                  console.error("Failed to delete duplicate message from queue", { queue, msg_id: msg.msg_id, error: dupDelError });
                }
                continue;
              }
            }
            try {
              await sendLovableEmail(
                {
                  run_id: payload.run_id,
                  to: payload.to,
                  from: payload.from,
                  sender_domain: payload.sender_domain,
                  subject: payload.subject,
                  html: payload.html,
                  text: payload.text,
                  purpose: payload.purpose,
                  label: payload.label,
                  idempotency_key: payload.idempotency_key,
                  unsubscribe_token: payload.unsubscribe_token,
                  message_id: payload.message_id
                },
                { apiKey, sendUrl: process.env.LOVABLE_SEND_URL }
              );
              await supabase2.from("email_send_log").insert({
                message_id: payload.message_id,
                template_name: payload.label || queue,
                recipient_email: payload.to,
                status: "sent"
              });
              const { error: delError } = await supabase2.rpc("delete_email", {
                queue_name: queue,
                message_id: msg.msg_id
              });
              if (delError) {
                console.error("Failed to delete sent message from queue", { queue, msg_id: msg.msg_id, error: delError });
              }
              totalProcessed++;
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              console.error("Email send failed", {
                queue,
                msg_id: msg.msg_id,
                read_ct: msg.read_ct,
                failed_attempts: failedAttempts,
                error: errorMsg
              });
              if (isRateLimited(error)) {
                await supabase2.from("email_send_log").insert({
                  message_id: payload.message_id,
                  template_name: payload.label || queue,
                  recipient_email: payload.to,
                  status: "failed",
                  error_message: errorMsg.slice(0, 1e3)
                });
                const retryAfterSecs = getRetryAfterSeconds(error);
                await supabase2.from("email_send_state").update({
                  retry_after_until: new Date(
                    Date.now() + retryAfterSecs * 1e3
                  ).toISOString(),
                  updated_at: (/* @__PURE__ */ new Date()).toISOString()
                }).eq("id", 1);
                return Response.json({ processed: totalProcessed, stopped: "rate_limited" });
              }
              if (isForbidden(error)) {
                await moveToDlq(supabase2, queue, msg, errorMsg.slice(0, 1e3));
                return Response.json({ processed: totalProcessed, stopped: "forbidden" });
              }
              await supabase2.from("email_send_log").insert({
                message_id: payload.message_id,
                template_name: payload.label || queue,
                recipient_email: payload.to,
                status: "failed",
                error_message: errorMsg.slice(0, 1e3)
              });
              if (payload?.message_id && typeof payload.message_id === "string") {
                failedAttemptsByMessageId.set(payload.message_id, failedAttempts + 1);
              }
            }
            if (i < messages.length - 1) {
              await new Promise((r) => setTimeout(r, sendDelayMs));
            }
          }
        }
        return Response.json({ processed: totalProcessed });
      }
    }
  }
});
const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
    "Confirm your email for ",
    siteName
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$5, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$5, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$5, children: "Confirm your email" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: text$5, children: [
      "Thanks for signing up for",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link$1, { href: siteUrl, style: link$2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: siteName }) }),
      "!"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: text$5, children: [
      "Please confirm your email address (",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link$1, { href: `mailto:${recipient}`, style: link$2, children: recipient }),
      ") by clicking the button below:"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { style: button$4, href: confirmationUrl, children: "Verify Email" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: footer$5, children: "If you didn't create an account, you can safely ignore this email." })
  ] }) })
] });
const main$5 = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container$5 = { padding: "20px 25px" };
const h1$5 = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#000000",
  margin: "0 0 20px"
};
const text$5 = {
  fontSize: "14px",
  color: "#55575d",
  lineHeight: "1.5",
  margin: "0 0 25px"
};
const link$2 = { color: "inherit", textDecoration: "underline" };
const button$4 = {
  backgroundColor: "#000000",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none"
};
const footer$5 = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
    "You've been invited to join ",
    siteName
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$4, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$4, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$4, children: "You've been invited" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: text$4, children: [
      "You've been invited to join",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link$1, { href: siteUrl, style: link$1, children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: siteName }) }),
      ". Click the button below to accept the invitation and create your account."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { style: button$3, href: confirmationUrl, children: "Accept Invitation" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: footer$4, children: "If you weren't expecting this invitation, you can safely ignore this email." })
  ] }) })
] });
const main$4 = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container$4 = { padding: "20px 25px" };
const h1$4 = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#000000",
  margin: "0 0 20px"
};
const text$4 = {
  fontSize: "14px",
  color: "#55575d",
  lineHeight: "1.5",
  margin: "0 0 25px"
};
const link$1 = { color: "inherit", textDecoration: "underline" };
const button$3 = {
  backgroundColor: "#000000",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none"
};
const footer$4 = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const MagicLinkEmail = ({
  siteName,
  confirmationUrl
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
    "Your login link for ",
    siteName
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$3, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$3, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$3, children: "Your login link" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: text$3, children: [
      "Click the button below to log in to ",
      siteName,
      ". This link will expire shortly."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { style: button$2, href: confirmationUrl, children: "Log In" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: footer$3, children: "If you didn't request this link, you can safely ignore this email." })
  ] }) })
] });
const main$3 = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container$3 = { padding: "20px 25px" };
const h1$3 = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#000000",
  margin: "0 0 20px"
};
const text$3 = {
  fontSize: "14px",
  color: "#55575d",
  lineHeight: "1.5",
  margin: "0 0 25px"
};
const button$2 = {
  backgroundColor: "#000000",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none"
};
const footer$3 = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const RecoveryEmail = ({
  siteName,
  confirmationUrl
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
    "Reset your password for ",
    siteName
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$2, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$2, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$2, children: "Reset your password" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: text$2, children: [
      "We received a request to reset your password for ",
      siteName,
      ". Click the button below to choose a new password."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { style: button$1, href: confirmationUrl, children: "Reset Password" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: footer$2, children: "If you didn't request a password reset, you can safely ignore this email. Your password will not be changed." })
  ] }) })
] });
const main$2 = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container$2 = { padding: "20px 25px" };
const h1$2 = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#000000",
  margin: "0 0 20px"
};
const text$2 = {
  fontSize: "14px",
  color: "#55575d",
  lineHeight: "1.5",
  margin: "0 0 25px"
};
const button$1 = {
  backgroundColor: "#000000",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none"
};
const footer$2 = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(Preview, { children: [
    "Confirm your email change for ",
    siteName
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main$1, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container$1, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1$1, children: "Confirm your email change" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: text$1, children: [
      "You requested to change your email address for ",
      siteName,
      " from",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link$1, { href: `mailto:${oldEmail}`, style: link, children: oldEmail }),
      " ",
      "to",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link$1, { href: `mailto:${newEmail}`, style: link, children: newEmail }),
      "."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: text$1, children: "Click the button below to confirm this change:" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { style: button, href: confirmationUrl, children: "Confirm Email Change" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: footer$1, children: "If you didn't request this change, please secure your account immediately." })
  ] }) })
] });
const main$1 = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container$1 = { padding: "20px 25px" };
const h1$1 = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#000000",
  margin: "0 0 20px"
};
const text$1 = {
  fontSize: "14px",
  color: "#55575d",
  lineHeight: "1.5",
  margin: "0 0 25px"
};
const link = { color: "inherit", textDecoration: "underline" };
const button = {
  backgroundColor: "#000000",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none"
};
const footer$1 = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const ReauthenticationEmail = ({ token }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "en", dir: "ltr", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Preview, { children: "Your verification code" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: main, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: container, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: h1, children: "Confirm reauthentication" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: text, children: "Use the code below to confirm your identity:" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: codeStyle, children: token }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: footer, children: "This code will expire shortly. If you didn't request this, you can safely ignore this email." })
  ] }) })
] });
const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "20px 25px" };
const h1 = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#000000",
  margin: "0 0 20px"
};
const text = {
  fontSize: "14px",
  color: "#55575d",
  lineHeight: "1.5",
  margin: "0 0 25px"
};
const codeStyle = {
  fontFamily: "Courier, monospace",
  fontSize: "22px",
  fontWeight: "bold",
  color: "#000000",
  margin: "0 0 30px"
};
const footer = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
const EMAIL_SUBJECTS = {
  signup: "Confirm your email",
  invite: "You've been invited",
  magiclink: "Your login link",
  recovery: "Reset your password",
  email_change: "Confirm your new email",
  reauthentication: "Your verification code"
};
const EMAIL_TEMPLATES$1 = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail
};
const SITE_NAME$1 = "connect-sponsor-earn";
const SENDER_DOMAIN = "notify.www.insideglobalevents.com";
const ROOT_DOMAIN = "www.insideglobalevents.com";
const FROM_DOMAIN = "notify.www.insideglobalevents.com";
function redactEmail(email) {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}
const Route$4 = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          console.error("LOVABLE_API_KEY not configured");
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        let payload;
        let run_id = "";
        try {
          const verified = await verifyWebhookRequest({
            req: request,
            secret: apiKey,
            parser: parseEmailWebhookPayload
          });
          payload = verified.payload;
          run_id = payload.run_id;
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case "invalid_signature":
              case "missing_timestamp":
              case "invalid_timestamp":
              case "stale_timestamp":
                console.error("Invalid webhook signature", { error: error.message });
                return Response.json(
                  { error: "Invalid signature" },
                  { status: 401 }
                );
              case "invalid_payload":
              case "invalid_json":
                console.error("Invalid webhook payload", { error: error.message });
                return Response.json(
                  { error: "Invalid webhook payload" },
                  { status: 400 }
                );
            }
          }
          console.error("Webhook verification failed", { error });
          return Response.json(
            { error: "Invalid webhook payload" },
            { status: 400 }
          );
        }
        if (!run_id) {
          console.error("Webhook payload missing run_id");
          return Response.json(
            { error: "Invalid webhook payload" },
            { status: 400 }
          );
        }
        if (payload.version !== "1") {
          console.error("Unsupported payload version", { version: payload.version, run_id });
          return Response.json(
            { error: `Unsupported payload version: ${payload.version}` },
            { status: 400 }
          );
        }
        const emailType = payload.data.action_type;
        console.log("Received auth event", {
          emailType,
          email_redacted: redactEmail(payload.data.email),
          run_id
        });
        const EmailTemplate = EMAIL_TEMPLATES$1[emailType];
        if (!EmailTemplate) {
          console.error("Unknown email type", { emailType, run_id });
          return Response.json(
            { error: `Unknown email type: ${emailType}` },
            { status: 400 }
          );
        }
        const templateProps = {
          siteName: SITE_NAME$1,
          siteUrl: `https://${ROOT_DOMAIN}`,
          recipient: payload.data.email,
          confirmationUrl: payload.data.url,
          token: payload.data.token,
          email: payload.data.email,
          oldEmail: payload.data.old_email,
          newEmail: payload.data.new_email
        };
        const element = reactExports.createElement(EmailTemplate, templateProps);
        const html = await render(element);
        const text2 = await render(element, { plainText: true });
        const supabaseUrl = "https://behwdpsrczmqsyaysidv.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
          console.error("Missing Supabase environment variables");
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const supabase2 = createClient(supabaseUrl, supabaseServiceKey);
        const messageId = crypto.randomUUID();
        await supabase2.from("email_send_log").insert({
          message_id: messageId,
          template_name: emailType,
          recipient_email: payload.data.email,
          status: "pending"
        });
        const { error: enqueueError } = await supabase2.rpc("enqueue_email", {
          queue_name: "auth_emails",
          payload: {
            run_id,
            message_id: messageId,
            to: payload.data.email,
            from: `${SITE_NAME$1} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject: EMAIL_SUBJECTS[emailType] || "Notification",
            html,
            text: text2,
            purpose: "transactional",
            label: emailType,
            queued_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        if (enqueueError) {
          console.error("Failed to enqueue auth email", { error: enqueueError, run_id, emailType });
          await supabase2.from("email_send_log").insert({
            message_id: messageId,
            template_name: emailType,
            recipient_email: payload.data.email,
            status: "failed",
            error_message: "Failed to enqueue email"
          });
          return Response.json(
            { error: "Failed to enqueue email" },
            { status: 500 }
          );
        }
        console.log("Auth email enqueued", {
          emailType,
          email_redacted: redactEmail(payload.data.email),
          run_id
        });
        return Response.json({ success: true, queued: true });
      }
    }
  }
});
const EMAIL_TEMPLATES = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail
};
const SITE_NAME = "connect-sponsor-earn";
const SAMPLE_PROJECT_URL = "https://connect-sponsor-earn.lovable.app";
const SAMPLE_EMAIL = "user@example.test";
const SAMPLE_DATA = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL
  },
  magiclink: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL
  },
  recovery: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    confirmationUrl: SAMPLE_PROJECT_URL
  },
  email_change: {
    siteName: SITE_NAME,
    oldEmail: SAMPLE_EMAIL,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL
  },
  reauthentication: {
    token: "123456"
  }
};
const Route$3 = createFileRoute("/lovable/email/auth/preview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        let type;
        try {
          const body2 = await request.json();
          type = body2.type;
        } catch {
          return Response.json(
            { error: "Invalid JSON in request body" },
            { status: 400 }
          );
        }
        const EmailTemplate = EMAIL_TEMPLATES[type];
        if (!EmailTemplate) {
          return Response.json(
            { error: `Unknown email type: ${type}` },
            { status: 400 }
          );
        }
        const sampleData = SAMPLE_DATA[type] || {};
        const html = await render(reactExports.createElement(EmailTemplate, sampleData));
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
    }
  }
});
async function verifyStripeSignature(payload, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv2) => {
      const [k, v] = kv2.split("=");
      return [k, v];
    })
  );
  if (!parts.t || !parts.v1) return false;
  const signed = `${parts.t}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === parts.v1;
}
const Route$2 = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook secret not configured", { status: 500 });
        const body2 = await request.text();
        const ok = await verifyStripeSignature(body2, request.headers.get("stripe-signature"), secret);
        if (!ok) return new Response("Invalid signature", { status: 401 });
        let evt;
        try {
          evt = JSON.parse(body2);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }
        if (evt.type === "payment_intent.succeeded") {
          const pi = evt.data?.object;
          const dealId = pi?.metadata?.deal_id;
          const amount = pi?.amount_received ? pi.amount_received / 100 : null;
          if (dealId) {
            await supabaseAdmin.from("deals").update({
              status: "payment_received",
              stripe_payment_intent_id: pi.id,
              paid_at: (/* @__PURE__ */ new Date()).toISOString(),
              ...amount ? { deal_value_native: amount } : {}
            }).eq("id", dealId);
            await supabaseAdmin.from("deal_status_history").insert({
              deal_id: dealId,
              to_status: "payment_received",
              note: `Stripe payment_intent ${pi.id}`
            });
          }
        }
        return new Response("ok");
      },
      OPTIONS: async () => new Response(null, { status: 204 })
    }
  }
});
async function hmacSha512Hex(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const Route$1 = createFileRoute("/api/public/webhooks/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) return new Response("Webhook secret not configured", { status: 500 });
        const body2 = await request.text();
        const header = request.headers.get("x-paystack-signature");
        const expected = await hmacSha512Hex(secret, body2);
        if (header !== expected) return new Response("Invalid signature", { status: 401 });
        let evt;
        try {
          evt = JSON.parse(body2);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }
        if (evt.event === "charge.success") {
          const tx = evt.data;
          const dealId = tx?.metadata?.deal_id ?? tx?.metadata?.custom_fields?.find?.((f) => f.variable_name === "deal_id")?.value;
          const amountNgn = tx?.amount ? tx.amount / 100 : null;
          if (dealId) {
            await supabaseAdmin.from("deals").update({
              status: "payment_received",
              paystack_reference: tx.reference,
              paid_at: (/* @__PURE__ */ new Date()).toISOString(),
              ...amountNgn ? { deal_value_native: amountNgn } : {}
            }).eq("id", dealId);
            await supabaseAdmin.from("deal_status_history").insert({
              deal_id: dealId,
              to_status: "payment_received",
              note: `Paystack ref ${tx.reference}`
            });
          }
        }
        return new Response("ok");
      },
      OPTIONS: async () => new Response(null, { status: 204 })
    }
  }
});
const $$splitComponentImporter = () => import("./events.edit._id-B9_oxOmd.mjs");
const Route = createFileRoute("/_authenticated/events/edit/$id")({
  head: () => ({
    meta: [{
      title: "Edit event - IGE"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const WelcomeRoute = Route$_.update({
  id: "/welcome",
  path: "/welcome",
  getParentRoute: () => Route$$
});
const WaitlistRoute = Route$Z.update({
  id: "/waitlist",
  path: "/waitlist",
  getParentRoute: () => Route$$
});
const UnsubscribeRoute = Route$Y.update({
  id: "/unsubscribe",
  path: "/unsubscribe",
  getParentRoute: () => Route$$
});
const TrustVettingRoute = Route$X.update({
  id: "/trust-vetting",
  path: "/trust-vetting",
  getParentRoute: () => Route$$
});
const TermsRoute = Route$W.update({
  id: "/terms",
  path: "/terms",
  getParentRoute: () => Route$$
});
const SponsorsRoute = Route$V.update({
  id: "/sponsors",
  path: "/sponsors",
  getParentRoute: () => Route$$
});
const SitemapDotxmlRoute = Route$U.update({
  id: "/sitemap.xml",
  path: "/sitemap.xml",
  getParentRoute: () => Route$$
});
const SignupRoute = Route$T.update({
  id: "/signup",
  path: "/signup",
  getParentRoute: () => Route$$
});
const ResetPasswordRoute = Route$S.update({
  id: "/reset-password",
  path: "/reset-password",
  getParentRoute: () => Route$$
});
const PrivacyRoute = Route$R.update({
  id: "/privacy",
  path: "/privacy",
  getParentRoute: () => Route$$
});
const PricingRoute = Route$Q.update({
  id: "/pricing",
  path: "/pricing",
  getParentRoute: () => Route$$
});
const PartnersRoute = Route$P.update({
  id: "/partners",
  path: "/partners",
  getParentRoute: () => Route$$
});
const OrganisersRoute = Route$O.update({
  id: "/organisers",
  path: "/organisers",
  getParentRoute: () => Route$$
});
const OnboardingRoute = Route$N.update({
  id: "/onboarding",
  path: "/onboarding",
  getParentRoute: () => Route$$
});
const MarketplaceRoute = Route$M.update({
  id: "/marketplace",
  path: "/marketplace",
  getParentRoute: () => Route$$
});
const LoginRoute = Route$L.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$$
});
const HowItWorksRoute = Route$K.update({
  id: "/how-it-works",
  path: "/how-it-works",
  getParentRoute: () => Route$$
});
const ForgotPasswordRoute = Route$J.update({
  id: "/forgot-password",
  path: "/forgot-password",
  getParentRoute: () => Route$$
});
const FaqRoute = Route$I.update({
  id: "/faq",
  path: "/faq",
  getParentRoute: () => Route$$
});
const ContactRoute = Route$H.update({
  id: "/contact",
  path: "/contact",
  getParentRoute: () => Route$$
});
const AboutRoute = Route$G.update({
  id: "/about",
  path: "/about",
  getParentRoute: () => Route$$
});
const AuthenticatedRoute = Route$F.update({
  id: "/_authenticated",
  getParentRoute: () => Route$$
});
const IndexRoute = Route$E.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$$
});
const RCodeRoute = Route$D.update({
  id: "/r/$code",
  path: "/r/$code",
  getParentRoute: () => Route$$
});
const OnboardingProfileRoute = Route$C.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => OnboardingRoute
});
const EventsSlugRoute = Route$B.update({
  id: "/events/$slug",
  path: "/events/$slug",
  getParentRoute: () => Route$$
});
const EmailUnsubscribeRoute = Route$A.update({
  id: "/email/unsubscribe",
  path: "/email/unsubscribe",
  getParentRoute: () => Route$$
});
const AuthenticatedSettingsRoute = Route$z.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedReferralsRoute = Route$y.update({
  id: "/referrals",
  path: "/referrals",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedPipelineRoute = Route$x.update({
  id: "/pipeline",
  path: "/pipeline",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedMessagesRoute = Route$w.update({
  id: "/messages",
  path: "/messages",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedEventsRoute = Route$v.update({
  id: "/events",
  path: "/events",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedDealsRoute = Route$u.update({
  id: "/deals",
  path: "/deals",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedDashboardRoute = Route$t.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedEventsIndexRoute = Route$s.update({
  id: "/",
  path: "/",
  getParentRoute: () => AuthenticatedEventsRoute
});
const AuthenticatedDashboardIndexRoute = Route$r.update({
  id: "/",
  path: "/",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const LovableEmailSuppressionRoute = Route$q.update({
  id: "/lovable/email/suppression",
  path: "/lovable/email/suppression",
  getParentRoute: () => Route$$
});
const ApiPublicWaitlistNotifyRoute = Route$p.update({
  id: "/api/public/waitlist-notify",
  path: "/api/public/waitlist-notify",
  getParentRoute: () => Route$$
});
const ApiPublicContactRoute = Route$o.update({
  id: "/api/public/contact",
  path: "/api/public/contact",
  getParentRoute: () => Route$$
});
const AuthenticatedDashboardVettingRoute = Route$n.update({
  id: "/vetting",
  path: "/vetting",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardSubmissionsRoute = Route$m.update({
  id: "/submissions",
  path: "/submissions",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardSavedRoute = Route$l.update({
  id: "/saved",
  path: "/saved",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardRevenueRoute = Route$k.update({
  id: "/revenue",
  path: "/revenue",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardRequestsRoute = Route$j.update({
  id: "/requests",
  path: "/requests",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardReferralsRoute = Route$i.update({
  id: "/referrals",
  path: "/referrals",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardPipelineRoute = Route$h.update({
  id: "/pipeline",
  path: "/pipeline",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardExploreRoute = Route$g.update({
  id: "/explore",
  path: "/explore",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardDiscoverRoute = Route$f.update({
  id: "/discover",
  path: "/discover",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardDealsRoute = Route$e.update({
  id: "/deals",
  path: "/deals",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardControlsRoute = Route$d.update({
  id: "/controls",
  path: "/controls",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardCommitmentsRoute = Route$c.update({
  id: "/commitments",
  path: "/commitments",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedDashboardAnalyticsRoute = Route$b.update({
  id: "/analytics",
  path: "/analytics",
  getParentRoute: () => AuthenticatedDashboardRoute
});
const AuthenticatedAdminVettingRoute = Route$a.update({
  id: "/admin/vetting",
  path: "/admin/vetting",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAdminSubmissionsRoute = Route$9.update({
  id: "/admin/submissions",
  path: "/admin/submissions",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAdminRevenueRoute = Route$8.update({
  id: "/admin/revenue",
  path: "/admin/revenue",
  getParentRoute: () => AuthenticatedRoute
});
const LovableEmailTransactionalSendRoute = Route$7.update({
  id: "/lovable/email/transactional/send",
  path: "/lovable/email/transactional/send",
  getParentRoute: () => Route$$
});
const LovableEmailTransactionalPreviewRoute = Route$6.update({
  id: "/lovable/email/transactional/preview",
  path: "/lovable/email/transactional/preview",
  getParentRoute: () => Route$$
});
const LovableEmailQueueProcessRoute = Route$5.update({
  id: "/lovable/email/queue/process",
  path: "/lovable/email/queue/process",
  getParentRoute: () => Route$$
});
const LovableEmailAuthWebhookRoute = Route$4.update({
  id: "/lovable/email/auth/webhook",
  path: "/lovable/email/auth/webhook",
  getParentRoute: () => Route$$
});
const LovableEmailAuthPreviewRoute = Route$3.update({
  id: "/lovable/email/auth/preview",
  path: "/lovable/email/auth/preview",
  getParentRoute: () => Route$$
});
const ApiPublicWebhooksStripeRoute = Route$2.update({
  id: "/api/public/webhooks/stripe",
  path: "/api/public/webhooks/stripe",
  getParentRoute: () => Route$$
});
const ApiPublicWebhooksPaystackRoute = Route$1.update({
  id: "/api/public/webhooks/paystack",
  path: "/api/public/webhooks/paystack",
  getParentRoute: () => Route$$
});
const AuthenticatedEventsEditIdRoute = Route.update({
  id: "/edit/$id",
  path: "/edit/$id",
  getParentRoute: () => AuthenticatedEventsRoute
});
const AuthenticatedDashboardRouteChildren = {
  AuthenticatedDashboardAnalyticsRoute,
  AuthenticatedDashboardCommitmentsRoute,
  AuthenticatedDashboardControlsRoute,
  AuthenticatedDashboardDealsRoute,
  AuthenticatedDashboardDiscoverRoute,
  AuthenticatedDashboardExploreRoute,
  AuthenticatedDashboardPipelineRoute,
  AuthenticatedDashboardReferralsRoute,
  AuthenticatedDashboardRequestsRoute,
  AuthenticatedDashboardRevenueRoute,
  AuthenticatedDashboardSavedRoute,
  AuthenticatedDashboardSubmissionsRoute,
  AuthenticatedDashboardVettingRoute,
  AuthenticatedDashboardIndexRoute
};
const AuthenticatedDashboardRouteWithChildren = AuthenticatedDashboardRoute._addFileChildren(
  AuthenticatedDashboardRouteChildren
);
const AuthenticatedEventsRouteChildren = {
  AuthenticatedEventsIndexRoute,
  AuthenticatedEventsEditIdRoute
};
const AuthenticatedEventsRouteWithChildren = AuthenticatedEventsRoute._addFileChildren(AuthenticatedEventsRouteChildren);
const AuthenticatedRouteChildren = {
  AuthenticatedDashboardRoute: AuthenticatedDashboardRouteWithChildren,
  AuthenticatedDealsRoute,
  AuthenticatedEventsRoute: AuthenticatedEventsRouteWithChildren,
  AuthenticatedMessagesRoute,
  AuthenticatedPipelineRoute,
  AuthenticatedReferralsRoute,
  AuthenticatedSettingsRoute,
  AuthenticatedAdminRevenueRoute,
  AuthenticatedAdminSubmissionsRoute,
  AuthenticatedAdminVettingRoute
};
const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren
);
const OnboardingRouteChildren = {
  OnboardingProfileRoute
};
const OnboardingRouteWithChildren = OnboardingRoute._addFileChildren(
  OnboardingRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  AboutRoute,
  ContactRoute,
  FaqRoute,
  ForgotPasswordRoute,
  HowItWorksRoute,
  LoginRoute,
  MarketplaceRoute,
  OnboardingRoute: OnboardingRouteWithChildren,
  OrganisersRoute,
  PartnersRoute,
  PricingRoute,
  PrivacyRoute,
  ResetPasswordRoute,
  SignupRoute,
  SitemapDotxmlRoute,
  SponsorsRoute,
  TermsRoute,
  TrustVettingRoute,
  UnsubscribeRoute,
  WaitlistRoute,
  WelcomeRoute,
  EmailUnsubscribeRoute,
  EventsSlugRoute,
  RCodeRoute,
  ApiPublicContactRoute,
  ApiPublicWaitlistNotifyRoute,
  LovableEmailSuppressionRoute,
  ApiPublicWebhooksPaystackRoute,
  ApiPublicWebhooksStripeRoute,
  LovableEmailAuthPreviewRoute,
  LovableEmailAuthWebhookRoute,
  LovableEmailQueueProcessRoute,
  LovableEmailTransactionalPreviewRoute,
  LovableEmailTransactionalSendRoute
};
const routeTree = Route$$._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Checkbox as C,
  Field as F,
  Route$Y as R,
  SelectField as S,
  ChipMulti as a,
  Route$B as b,
  Route as c,
  SiteFooter as d,
  SiteHeader as e,
  createSsrRpc as f,
  generateReferralLink as g,
  getCurrentRates as h,
  getMarketplaceFilterOptions as i,
  getPublicEventBySlug as j,
  getReferralDashboard as k,
  listMarketplaceEvents as l,
  logo as m,
  useScrollReveal as n,
  useServerFn as o,
  router as r,
  submitCommitmentForm as s,
  toggleSaveEvent as t,
  useAuth as u
};
