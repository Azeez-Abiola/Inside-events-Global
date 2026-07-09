import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  title,
  subtitle,
  action,
  breadcrumbs,
  greeting,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumbs?: { label: string; to?: string }[];
  greeting?: string;
}) {
  return (
    <div className="space-y-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" />}
              {crumb.to ? (
                <Link to={crumb.to} className="font-medium hover:text-primary transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground/80">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {greeting && (
            <p className="text-sm font-medium text-muted-foreground">
              Hello <span className="text-foreground">{greeting}</span>, welcome back!
            </p>
          )}
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function DashboardTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-muted/50 p-1">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              selected
                ? "bg-card text-primary-deep shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "ml-2 rounded-full px-2 py-0.5 text-[11px]",
                  selected ? "bg-brand-soft text-primary-deep" : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function DashboardPanel({
  title,
  description,
  children,
  action,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl bg-card shadow-card", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-5 py-4">
          <div>
            {title && <h2 className="font-display text-base font-bold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function DashboardTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  );
}

export function DashboardTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border/60 bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </thead>
  );
}

export function DashboardEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-soft">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function DashboardLoading({ label = "Loading workspace…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export const VETTING_STEPS = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under review" },
  { key: "approved", label: "Approved" },
  { key: "listed", label: "Listed" },
] as const;

export function VettingTimeline({ status }: { status: string }) {
  const terminal = ["revision_requested", "rejected", "closed", "archived"].includes(status);
  const activeIdx = VETTING_STEPS.findIndex((s) => s.key === status);
  const revision = status === "revision_requested";
  const rejected = status === "rejected";

  if (terminal && !revision && !rejected && !VETTING_STEPS.some((s) => s.key === status)) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Vetting progress
      </div>
      {revision && (
        <p className="mt-1 text-xs text-amber-800">
          IGE requested revisions — update your listing and resubmit when ready.
        </p>
      )}
      {rejected && (
        <p className="mt-1 text-xs text-red-800">
          This listing was not approved. Check reviewer notes on the event editor.
        </p>
      )}
      {!revision && !rejected && (
        <ol className="mt-2 flex flex-wrap gap-2">
          {VETTING_STEPS.map((step, i) => {
            const done = activeIdx > i;
            const current = activeIdx === i;
            return (
              <li
                key={step.key}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  current
                    ? "bg-brand-gradient text-white"
                    : done
                      ? "bg-secondary/15 text-secondary-deep"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step.label}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
