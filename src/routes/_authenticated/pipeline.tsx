import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pipeline")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/pipeline" });
  },
});
