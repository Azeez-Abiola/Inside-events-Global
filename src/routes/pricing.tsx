import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Pricing is not a page on IGE (TAB 1 §1.1, TAB 11): the platform is free to
 * use until May 2027 and no fees are published. Old links land on IGE Services.
 */
export const Route = createFileRoute("/pricing")({
  beforeLoad: () => {
    throw redirect({ to: "/services", replace: true });
  },
});
