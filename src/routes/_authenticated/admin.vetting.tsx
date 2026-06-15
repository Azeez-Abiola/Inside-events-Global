import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/vetting")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/vetting" });
  },
});
