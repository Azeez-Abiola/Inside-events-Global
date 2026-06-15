import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-gmdRS3ZG.mjs";
import { A as AuthShell } from "./auth-shell-B3frSsmu.mjs";
import { u as useAuth } from "./router-BT27-cf7.mjs";
import "../_libs/ws.mjs";
import "../_libs/seroval.mjs";
import { Q as Megaphone, E as Earth, H as Handshake, V as Newspaper, M as LoaderCircle } from "../_libs/lucide-react.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
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
const ROLES = [{
  key: "organiser",
  title: "Event Organiser",
  desc: "List your event, find sponsors.",
  icon: Megaphone
}, {
  key: "sponsor",
  title: "Brand / Sponsor",
  desc: "Discover vetted events to sponsor.",
  icon: Earth
}, {
  key: "referral_partner",
  title: "Referral Partner",
  desc: "Earn commission introducing sponsors.",
  icon: Handshake
}, {
  key: "media_partner",
  title: "Media Partner",
  desc: "Cross-promote with quality events.",
  icon: Newspaper
}];
function Onboarding() {
  const {
    user,
    roles,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = reactExports.useState("sponsor");
  const [saving, setSaving] = reactExports.useState(false);
  const [checking, setChecking] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({
        to: "/login"
      });
      return;
    }
    if (roles.length > 0) {
      navigate({
        to: "/onboarding/profile"
      });
      return;
    }
    const pending = typeof window !== "undefined" ? sessionStorage.getItem("ige:pending-role") : null;
    if (pending && ROLES.some((r) => r.key === pending)) {
      setSelected(pending);
      (async () => {
        await applyRole(user.id, pending);
        try {
          sessionStorage.removeItem("ige:pending-role");
        } catch {
        }
        navigate({
          to: "/onboarding/profile"
        });
      })();
      return;
    }
    setChecking(false);
  }, [loading, user, roles, navigate]);
  async function applyRole(userId, role) {
    const {
      error
    } = await supabase.from("user_roles").insert({
      user_id: userId,
      role
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  }
  async function handleContinue() {
    if (!user) return;
    setSaving(true);
    try {
      await applyRole(user.id, selected);
      toast.success("Role set - let's complete your profile");
      navigate({
        to: "/onboarding/profile"
      });
    } catch (e) {
      toast.error(e.message ?? "Could not save your role");
    } finally {
      setSaving(false);
    }
  }
  if (loading || checking) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen items-center justify-center bg-background text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
      " Loading…"
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AuthShell, { title: "One more step", subtitle: "Tell us how you'll use IGE so we can tailor your workspace.", footer: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    "Wrong account?",
    " ",
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "font-semibold text-primary hover:text-primary-deep", children: "Sign in as someone else" })
  ] }), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2.5", children: ROLES.map((r) => {
      const isSel = selected === r.key;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setSelected(r.key), className: `flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${isSel ? "border-primary bg-brand-soft" : "border-border bg-card hover:bg-muted"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `flex h-9 w-9 items-center justify-center rounded-lg ${isSel ? "bg-brand-gradient text-white" : "bg-muted text-muted-foreground"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(r.icon, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold text-foreground", children: r.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: r.desc })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-4 w-4 rounded-full border ${isSel ? "border-primary bg-primary" : "border-border"}` })
      ] }, r.key);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleContinue, disabled: saving, className: "mt-6 inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60", children: saving ? "Saving…" : "Continue" })
  ] });
}
export {
  Onboarding as component
};
