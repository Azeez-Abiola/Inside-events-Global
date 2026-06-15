import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, g as useSearch, L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { supabase } from "./client-DBr2rXmP.mjs";
import { l as lovable } from "./index-32wYu5v6.mjs";
import { g as getSiteUrl } from "./site-url-Du7GW4Cs.mjs";
import { A as AuthShell, G as GoogleButton, D as Divider } from "./auth-shell-BH3UBkGL.mjs";
import "../_libs/ws.mjs";
import "../_libs/lovable.dev__cloud-auth-js.mjs";
import "../_libs/seroval.mjs";
import { w as EyeOff, v as Eye } from "../_libs/lucide-react.mjs";
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
import "./supabase-env-Di-uc-dX.mjs";
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
import "./client.server-k0C2Btf0.mjs";
import "../_libs/react-email__html.mjs";
import "../_libs/react-email__head.mjs";
import "../_libs/react-email__preview.mjs";
import "../_libs/react-email__body.mjs";
import "../_libs/react-email__container.mjs";
import "../_libs/react-email__section.mjs";
import "../_libs/react-email__heading.mjs";
import "../_libs/react-email__text.mjs";
import "../_libs/react-email__button.mjs";
import "../_libs/react-email__link.mjs";
import "../_libs/react-email__hr.mjs";
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
import "./router-CyTgVp-T.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "./server-DRh9RfeA.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-t0GaQtdd.mjs";
import "../_libs/lovable.dev__webhooks-js.mjs";
import "../_libs/lovable.dev__email-js.mjs";
import "../_libs/zod.mjs";
function LoginPage() {
  const navigate = useNavigate();
  const {
    redirect,
    email: emailParam,
    password: passwordParam
  } = useSearch({
    from: "/login"
  });
  const [email, setEmail] = reactExports.useState(emailParam ?? "");
  const [password, setPassword] = reactExports.useState(passwordParam ?? "");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [googleLoading, setGoogleLoading] = reactExports.useState(false);
  const demoPrefill = !!(emailParam && passwordParam);
  reactExports.useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (passwordParam) setPassword(passwordParam);
  }, [emailParam, passwordParam]);
  async function handlePassword(e) {
    e.preventDefault();
    setSubmitting(true);
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({
      to: redirect ?? "/dashboard"
    });
  }
  async function handleGoogle() {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: getSiteUrl()
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({
      to: redirect ?? "/dashboard"
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AuthShell, { title: "Welcome back", subtitle: "Sign in to continue to your IGE workspace.", footer: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    "New to IGE?",
    " ",
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signup", className: "font-semibold text-primary hover:text-primary-deep", children: "Create an account" })
  ] }), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleButton, { onClick: handleGoogle, loading: googleLoading, label: "Sign in with Google" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, {}),
    demoPrefill && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-lg border border-primary/20 bg-brand-soft px-3 py-2 text-xs text-primary-deep", children: "Demo credentials filled in — click Sign in to open this workspace." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handlePassword, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Work email", type: "email", autoComplete: "email", required: true, value: email, onChange: (v) => setEmail(v) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Password", type: "password", autoComplete: "current-password", required: true, value: password, onChange: (v) => setPassword(v) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: submitting, className: "inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60", children: submitting ? "Signing in…" : "Sign in" })
    ] })
  ] });
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}) {
  const [showPassword, setShowPassword] = reactExports.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? showPassword ? "text" : "password" : type;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-sm font-medium text-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ...rest, type: inputType, value, onChange: (e) => onChange(e.target.value), className: "w-full rounded-md border border-input bg-background pl-3 pr-10 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring" }),
      isPassword && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors", "aria-label": showPassword ? "Hide password" : "Show password", children: showPassword ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 18 }) })
    ] })
  ] });
}
export {
  LoginPage as component
};
