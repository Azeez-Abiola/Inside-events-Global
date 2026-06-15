import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { OrganiserDashboard } from "@/components/dashboards/organiser-dashboard";
import { SponsorDashboard } from "@/components/dashboards/sponsor-dashboard";
import { ReferralDashboard } from "@/components/dashboards/referral-dashboard";
import { MediaPartnerDashboard } from "@/components/dashboards/media-dashboard";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard - IGE" }] }),
  component: DashboardPage,
});

// Thin dispatcher: each role renders its own standalone dashboard module.
function DashboardPage() {
  const { roles, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 font-medium text-sm">Loading workspace…</span>
        </div>
      </AppShell>
    );
  }

  // Admin roles take precedence, then the self-serve roles.
  if (roles.includes("abw_admin") || roles.includes("super_admin")) return <AdminDashboard />;
  if (roles.includes("organiser")) return <OrganiserDashboard />;
  if (roles.includes("sponsor")) return <SponsorDashboard />;
  if (roles.includes("referral_partner")) return <ReferralDashboard />;
  if (roles.includes("media_partner")) return <MediaPartnerDashboard />;

  return (
    <AppShell>
      <div className="rounded-2xl border border-border bg-card p-8 text-center max-w-xl mx-auto mt-10">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-bold">Welcome to IGE</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Your account is verified, but has no role assigned. Please contact the administrator or complete onboarding.
        </p>
        <Link to="/onboarding" className="btn-primary mt-6 inline-block">Complete Onboarding</Link>
      </div>
    </AppShell>
  );
}
