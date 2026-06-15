import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { N as Navigate } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth } from "./router-CyTgVp-T.mjs";
import { M as LoaderCircle } from "../_libs/lucide-react.mjs";
function RoleGate({
  allow,
  children,
  fallbackTo = "/dashboard"
}) {
  const { roles, loading } = useAuth();
  const allowed = Array.isArray(allow) ? allow : [allow];
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-[40vh] items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) });
  }
  if (!allowed.some((r) => roles.includes(r))) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: fallbackTo, replace: true });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
}
export {
  RoleGate as R
};
