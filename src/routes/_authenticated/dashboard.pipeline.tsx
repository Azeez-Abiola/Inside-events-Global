import { createFileRoute, redirect } from "@tanstack/react-router";
import { OrganiserPipelinePage } from "@/components/dashboards/organiser-pages";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline - IGE" }] }),
  component: () => {
    const { roles } = useAuth();
    if (!roles.includes("organiser")) throw redirect({ to: "/dashboard" });
    return <OrganiserPipelinePage />;
  },
});
