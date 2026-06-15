import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-BhermGBt.mjs";
import { A as AuthShell } from "./auth-shell-B1xwEFtf.mjs";
import "../_libs/seroval.mjs";
import { v as EyeOff, u as Eye } from "../_libs/lucide-react.mjs";
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
import "./router-4-w4Upb_.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
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
function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = reactExports.useState(false);
  const [pwd, setPwd] = reactExports.useState("");
  const [confirm, setConfirm] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token=")) {
      setReady(true);
    } else {
      supabase.auth.getSession().then(({
        data
      }) => {
        if (data.session) setReady(true);
        else {
          toast.error("Open this page from the reset link in your email.");
          navigate({
            to: "/forgot-password"
          });
        }
      });
    }
  }, [navigate]);
  async function handleSubmit(e) {
    e.preventDefault();
    if (pwd.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (pwd !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const {
      error
    } = await supabase.auth.updateUser({
      password: pwd
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    navigate({
      to: "/dashboard"
    });
  }
  if (!ready) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthShell, { title: "Set a new password", subtitle: "Pick something you'll remember.", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "New password", value: pwd, onChange: setPwd }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Confirm password", value: confirm, onChange: setConfirm }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: loading, className: "inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-transform disabled:opacity-60", children: loading ? "Updating…" : "Update password" })
  ] }) });
}
function Field({
  label,
  value,
  onChange
}) {
  const [showPassword, setShowPassword] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: showPassword ? "text" : "password", required: true, minLength: 8, value, onChange: (e) => onChange(e.target.value), className: "w-full rounded-md border border-border bg-card pl-3 pr-10 py-2.5 text-sm focus:border-primary focus:outline-none text-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors", "aria-label": showPassword ? "Hide password" : "Show password", children: showPassword ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 18 }) })
    ] })
  ] });
}
export {
  ResetPassword as component
};
