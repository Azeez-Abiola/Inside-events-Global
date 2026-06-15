import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function DashboardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action}
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
    <div className="border-b border-border">
      <div className="flex gap-1 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                selected
                  ? "border-primary text-primary-deep"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${selected ? "bg-brand-soft text-primary-deep" : "bg-muted text-muted-foreground"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardPanel({
  title,
  description,
  children,
  action,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-4">
          <div>
            {title && <h2 className="font-display text-base font-bold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function DashboardEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-muted-foreground" />
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
    <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
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
