import { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DashboardHeader } from "@/components/dashboards/dashboard-shell";
import { getDashboardMeta } from "@/lib/dashboard-meta";
import { useUserDisplayName } from "@/hooks/use-user-display-name";
import { ProfileCompletionBar } from "@/components/onboarding/profile-completion-bar";

export function WorkspacePage({
  title,
  subtitle,
  action,
  children,
  breadcrumbs,
  showGreeting,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  breadcrumbs?: { label: string; to?: string }[];
  showGreeting?: boolean;
}) {
  const loc = useLocation();
  const { data: displayName = "there" } = useUserDisplayName();
  const meta = getDashboardMeta(loc.pathname);
  const resolvedBreadcrumbs = breadcrumbs ??
    meta?.breadcrumbs ?? [{ label: "Dashboard", to: "/dashboard" }, { label: title }];
  const greeting = showGreeting ? displayName : undefined;

  return (
    <AppShell>
      <div className="space-y-6">
        <DashboardHeader
          title={title}
          subtitle={subtitle ?? meta?.subtitle}
          action={action}
          breadcrumbs={resolvedBreadcrumbs}
          greeting={greeting}
        />
        {/* §3.2: persistent, at the top of the dashboard. Renders nothing once
            the profile is complete, and nothing for accounts that have no
            application to complete. */}
        <ProfileCompletionBar />
        {children}
      </div>
    </AppShell>
  );
}
