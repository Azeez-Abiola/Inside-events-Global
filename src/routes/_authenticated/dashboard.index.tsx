import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { SponsorOverviewPage } from "@/components/dashboards/sponsor-pages";
import { OrganiserEventsPage } from "@/components/dashboards/organiser-pages";
import { ReferralDashboard } from "@/components/dashboards/referral-dashboard";
import { MediaPartnerDashboard } from "@/components/dashboards/media-dashboard";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard - IGE" }] }),
  component: DashboardIndex,
});

function DashboardIndex() {
  const { roles, loading } = useAuth();
  if (loading) return <DashboardLoading />;
  if (roles.includes("abw_admin") || roles.includes("super_admin")) return <AdminDashboard section="overview" />;
  if (roles.includes("organiser")) return <OrganiserEventsPage />;
  if (roles.includes("sponsor")) return <SponsorOverviewPage />;
  if (roles.includes("referral_partner")) return <ReferralDashboard section="overview" />;
  if (roles.includes("media_partner")) return <MediaPartnerDashboard section="overview" />;
  return <FallbackDashboard />;
}

function DashboardLoading() {
  return (
    <AppShell>
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppShell>
  );
}

function FallbackDashboard() {
  return (
    <AppShell>
      <div className="rounded-2xl border border-border bg-card p-8 text-center max-w-xl mx-auto mt-10">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-bold">Welcome to IGE</h2>
        <p className="mt-2 text-muted-foreground text-sm">Your account has no role assigned. Please complete onboarding.</p>
        <Link to="/onboarding" className="btn-primary mt-6 inline-block">Complete Onboarding</Link>
      </div>
    </AppShell>
  );
}
