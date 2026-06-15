import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { A as AppShell } from "./app-shell-B3fq3Cpm.mjs";
import { a as DashboardHeader } from "./dashboard-analytics-D8pPgueL.mjs";
function WorkspacePage({
  title,
  subtitle,
  action,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardHeader, { title, subtitle, action }),
    children
  ] }) });
}
export {
  WorkspacePage as W
};
