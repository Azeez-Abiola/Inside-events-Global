import { createFileRoute, redirect } from "@tanstack/react-router";
import { OrganiserPipelinePage } from "@/components/dashboards/organiser-pages";
import { SponsorPipelinePage } from "@/components/dashboards/sponsor-pages";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline - IGE" }] }),
  component: () => {
    const { roles, loading } = useAuth();
    if (loading) return null;
    // Organiser: their event sponsorship pipeline. Sponsor: their deal Kanban.
    if (roles.includes("organiser")) return <OrganiserPipelinePage />;
    if (roles.includes("sponsor")) return <SponsorPipelinePage />;
    throw redirect({ to: "/dashboard" });
  },
});
