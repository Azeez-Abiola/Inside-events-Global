import { createFileRoute, redirect } from "@tanstack/react-router";

/** Public contact form removed — send enquiries via signup or hi@insideglobalevents.com */
export const Route = createFileRoute("/contact")({
  beforeLoad: () => {
    throw redirect({ to: "/signup" });
  },
});
