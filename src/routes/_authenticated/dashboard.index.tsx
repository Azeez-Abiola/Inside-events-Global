import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { recoverMyRole } from "@/lib/signup.functions";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { DashboardPageSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { SponsorOverviewPage } from "@/components/dashboards/sponsor-pages";
import { OrganiserEventsPage } from "@/components/dashboards/organiser-pages";
import { ReferralDashboard } from "@/components/dashboards/referral-dashboard";
import { MediaPartnerDashboard } from "@/components/dashboards/media-dashboard";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { CreativeDashboard } from "@/components/productions/production-admin-and-discovery";
import { ProDashboard } from "@/components/dashboards/pro-dashboard";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard - IGE" }] }),
  component: DashboardIndex,
});

function DashboardIndex() {
  const { roles, loading, rolesReady } = useAuth();
  if (loading || !rolesReady) return <DashboardLoading />;
  if (roles.includes("abw_admin") || roles.includes("super_admin"))
    return <AdminDashboard section="overview" />;
  if (roles.includes("organiser")) return <OrganiserEventsPage />;
  if (roles.includes("sponsor")) return <SponsorOverviewPage />;
  if (roles.includes("referral_partner")) return <ReferralDashboard section="overview" />;
  if (roles.includes("media_partner")) return <MediaPartnerDashboard section="overview" />;
  if (roles.includes("partnerships_pro")) return <ProDashboard />;
  if (roles.includes("creative_hub")) return <CreativeDashboard />;
  return <FallbackDashboard />;
}

function DashboardLoading() {
  return (
    <AppShell>
      <DashboardPageSkeleton kpis={3} showCharts />
    </AppShell>
  );
}

/**
 * No role came back for this account. That should never be the end of the
 * road: signup records the chosen role in three places, so restore it and
 * show the right dashboard. The role picker is only for an account with no
 * role recorded anywhere.
 */
function FallbackDashboard() {
  const { refreshRoles } = useAuth();
  const recover = useServerFn(recoverMyRole);
  const [state, setState] = useState<"recovering" | "none" | "error">("recovering");

  useEffect(() => {
    let cancelled = false;
    recover()
      .then(async ({ role }) => {
        if (cancelled) return;
        if (role) await refreshRoles();
        else setState("none");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "recovering") {
    return (
      <AppShell>
        <div className="mx-auto mt-16 flex max-w-xl items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Setting up your dashboard…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-bold">Welcome to IGE</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {state === "error"
            ? "We couldn't load your account details. Refresh the page to try again."
            : "Tell us how you'll use IGE so we can set up the right dashboard for you."}
        </p>
        {state === "error" ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary mt-6"
          >
            Refresh
          </button>
        ) : (
          <Link to="/onboarding/role" className="btn-primary mt-6">
            Choose your role
          </Link>
        )}
      </div>
    </AppShell>
  );
}
