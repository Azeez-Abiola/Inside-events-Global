import { Link } from "@tanstack/react-router";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { KpiTile } from "@/components/dashboards/voom-primitives";

/** @deprecated use KpiTile — kept for existing imports */
export const StatCard = KpiTile;

export function QuickLinkCard({
  to,
  label,
  desc,
  icon: Icon,
}: {
  to: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-300 hover:border-primary/30 hover:shadow-brand"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft ring-1 ring-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-foreground transition-colors group-hover:text-primary-deep">{label}</div>
        <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" />
    </Link>
  );
}

const PILL_STYLES: Record<string, string> = {
  paid: "bg-secondary/15 text-secondary-deep",
  completed: "bg-secondary/15 text-secondary-deep",
  approved: "bg-secondary/15 text-secondary-deep",
  listed: "bg-secondary/15 text-secondary-deep",
  pending: "bg-amber-100 text-amber-900",
  open: "bg-amber-100 text-amber-900",
  unpaid: "bg-primary/10 text-primary-deep",
  confirmed: "bg-brand-soft text-primary-deep",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-red-100 text-red-800",
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary-deep",
  under_review: "bg-amber-100 text-amber-900",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
        PILL_STYLES[key] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function fmtDateRange(s?: string | null, e?: string | null) {
  if (!s) return "";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return e && e !== s ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
}
