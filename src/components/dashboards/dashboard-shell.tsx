import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPageSkeleton } from "@/components/dashboards/dashboard-skeletons";

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

export function DashboardLoading({
  label: _label,
  kpis = 3,
  tableRows = 6,
  showTabs = false,
  showCharts = false,
}: {
  label?: string;
  kpis?: number;
  tableRows?: number;
  showTabs?: boolean;
  showCharts?: boolean;
}) {
  return <DashboardPageSkeleton kpis={kpis} tableRows={tableRows} showTabs={showTabs} showCharts={showCharts} />;
}

/**
 * The three vetting nodes (TAB 3 §3.2): "a 3-node tracker on the event:
 * Submitted, Under review, Approved and live."
 *
 * Draft is not a node — nothing has been sent yet — and approved/listed
 * collapse into one, because from the owner's side there is no meaningful
 * difference between vetted and visible.
 */
export const VETTING_STEPS = [
  { key: "submitted", label: "Submitted", statuses: ["submitted"] },
  { key: "under_review", label: "Under review", statuses: ["under_review"] },
  { key: "live", label: "Approved and live", statuses: ["approved", "listed"] },
] as const;

export function VettingTimeline({
  status,
  visibility,
}: {
  status: string;
  /** A private event never enters vetting, so it has no tracker. */
  visibility?: string | null;
}) {
  if (visibility === "private" || status === "draft") return null;

  const revision = status === "revision_requested";
  const rejected = status === "rejected";

  // These two sit outside the three nodes and matter more than them. Drawing
  // them as "stuck between node 1 and 2" would be misleading.
  if (revision || rejected) {
    return (
      <div
        className={`mt-3 rounded-xl border px-4 py-3 ${
          revision
            ? "border-amber-300 bg-amber-50 text-amber-950"
            : "border-destructive/30 bg-destructive/5 text-foreground"
        }`}
      >
        <p className="text-sm font-semibold">
          {revision ? "Changes requested" : "Not approved for listing"}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed opacity-90">
          {revision
            ? "IGE has asked for updates before this can be approved. Make the changes and resubmit — your place in the queue is kept."
            : "The reviewer's notes are on the event editor. Address them and resubmit, or email hi@insideglobalevents.com to talk it through."}
        </p>
      </div>
    );
  }

  const activeIdx = VETTING_STEPS.findIndex((s) =>
    (s.statuses as readonly string[]).includes(status),
  );
  if (activeIdx < 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Vetting progress
      </div>
      <ol className="mt-2 flex items-center gap-2" aria-label="Vetting progress">
        {VETTING_STEPS.map((step, i) => {
          const done = activeIdx > i;
          const current = activeIdx === i;
          return (
            <li key={step.key} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                aria-current={current ? "step" : undefined}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  done
                    ? "border-secondary bg-secondary text-white"
                    : current
                      ? "border-primary bg-brand-soft text-primary-deep"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                {done ? "\u2713" : i + 1}
              </span>
              <span
                className={`truncate text-[11px] ${
                  current ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {i < VETTING_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`hidden h-px flex-1 sm:block ${done ? "bg-secondary" : "bg-border"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
