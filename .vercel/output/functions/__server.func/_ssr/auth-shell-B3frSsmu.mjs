import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { m as logo } from "./router-BT27-cf7.mjs";
import { A as ArrowLeft } from "../_libs/lucide-react.mjs";
const SLIDES = [
  "/events/portrait-young-handsome-african-american-businessman-suit-near-new-year-tree-decorations.jpg",
  "/events/stylish-african-american-gentleman-elegant-black-jacket-glasses-holding-retro-walking-stick-as-cane-flask-tippling-cane-with-golden-diamond-ball-handle-speaking-mobile-phone.jpg",
  "/events/bellboy-providing-coffee-cup-guest-sitting-lounge-area-hotel-offering-excellent-luxury-services-with-drink-from-bar-woman-tourist-receiving-beverage-lobby-handheld-shot.jpg",
  "/events/dentistry-students-team-doing-research-with-plastic-human-jaw-model.jpg",
  "/events/young-man-having-fun-party.jpg",
  "/events/signin.jpg"
];
function AuthSlideshow() {
  const [index, setIndex] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5e3);
    return () => window.clearInterval(id);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "aria-hidden": true, className: "absolute inset-0", children: [
    SLIDES.map((src, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "absolute inset-0 transition-all duration-[1200ms] ease-in-out",
        style: {
          backgroundImage: `url("${src}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: i === index ? 1 : 0,
          transform: i === index ? "translateX(0) scale(1.05)" : "translateX(6%) scale(1)"
        }
      },
      src
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-brand-gradient-diag opacity-80" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "absolute inset-0",
        style: { background: "linear-gradient(to top, rgba(26,16,40,0.65) 0%, transparent 55%)" }
      }
    )
  ] });
}
function AuthShell({
  title,
  subtitle,
  children,
  footer
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid min-h-screen lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AuthSlideshow, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "relative z-10 flex items-center gap-3", "aria-label": "Inside Global Events 2026 — Home", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logo, alt: "", "aria-hidden": "true", className: "h-10 w-10 rounded-md object-cover" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "uppercase tracking-[0.18em] opacity-90 text-lg font-sans font-extrabold", children: "Inside Global Events 2026" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 mt-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("blockquote", { className: "font-display text-3xl font-bold leading-tight drop-shadow-lg", children: "“The first marketplace where B2B sponsorships is vetted.”" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 text-sm opacity-90", children: "Inside Global Events 2026" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-col px-6 pt-20 pb-10 sm:px-12 sm:pt-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-6 top-6 sm:left-12 sm:top-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/",
          "aria-label": "Back to homepage",
          className: "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Back to home" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "m-auto w-full max-w-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight", children: title }),
        subtitle ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: subtitle }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8", children }),
        footer ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 text-sm text-muted-foreground", children: footer }) : null
      ] })
    ] })
  ] }) });
}
function GoogleButton({
  onClick,
  loading,
  label = "Continue with Google"
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick,
      disabled: loading,
      className: "flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-4 w-4", viewBox: "0 0 24 24", "aria-hidden": true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              fill: "#4285F4",
              d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              fill: "#34A853",
              d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              fill: "#FBBC05",
              d: "M5.84 14.1A6.6 6.6 0 015.5 12c0-.73.13-1.43.34-2.1V7.07H2.18A10.99 10.99 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              fill: "#EA4335",
              d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.3 9.14 5.38 12 5.38z"
            }
          )
        ] }),
        loading ? "Redirecting…" : label
      ]
    }
  );
}
function Divider({ text = "or" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: text }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" })
  ] });
}
export {
  AuthShell as A,
  Divider as D,
  GoogleButton as G,
  AuthSlideshow as a
};
