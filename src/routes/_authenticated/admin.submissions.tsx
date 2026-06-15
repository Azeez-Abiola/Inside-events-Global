import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/submissions" });
  },
});
