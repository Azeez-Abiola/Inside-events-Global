import { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { DashboardHeader } from "@/components/dashboards/dashboard-shell";

export function WorkspacePage({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppShell>
      <div className="space-y-8">
        <DashboardHeader title={title} subtitle={subtitle} action={action} />
        {children}
      </div>
    </AppShell>
  );
}
