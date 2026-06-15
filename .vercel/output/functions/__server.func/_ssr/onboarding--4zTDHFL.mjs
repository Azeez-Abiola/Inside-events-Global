import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { g as useSearch, N as Navigate } from "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
function OnboardingRedirect() {
  const {
    step
  } = useSearch({
    from: "/onboarding"
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/signup", search: step ? {
    step
  } : void 0, replace: true });
}
export {
  OnboardingRedirect as component
};
