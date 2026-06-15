import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/referrals")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/referrals" });
  },
});
