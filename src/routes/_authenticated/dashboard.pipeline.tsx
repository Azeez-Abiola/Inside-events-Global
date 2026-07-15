import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DashboardPageSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { OrganiserPipelinePage } from "@/components/dashboards/organiser-pages";
import { SponsorPipelinePage } from "@/components/dashboards/sponsor-pages";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline - IGE" }] }),
  component: PipelineRoute,
});

function PipelineRoute() {
  const { roles, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <DashboardPageSkeleton kpis={3} tableRows={5} tableCols={6} />
      </AppShell>
    );
  }

  if (roles.includes("organiser")) return <OrganiserPipelinePage />;
  if (roles.includes("sponsor")) return <SponsorPipelinePage />;
  return <Navigate to="/dashboard" replace />;
}
