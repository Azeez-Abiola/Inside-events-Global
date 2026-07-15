import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Cell, Pie, PieChart } from "recharts";
import { ArrowRight, LucideIcon } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "hsl(271 45% 44%)",
  "hsl(160 100% 25%)",
  "hsl(271 45% 60%)",
  "hsl(160 60% 40%)",
  "hsl(220 20% 50%)",
];

/** Voom-style compact KPI tile: circular icon + label + big number */
export function KpiTile({
  icon: Icon,
  label,
  value,
  loading,
  trend,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  loading?: boolean;
  trend?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border-0 bg-card p-4 shadow-card", className)}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p className="font-display text-2xl font-bold leading-tight text-foreground">{value}</p>
          )}
          {trend && !loading && <p className="mt-0.5 text-[11px] font-medium text-secondary">{trend}</p>}
        </div>
      </div>
    </div>
  );
}

/** Donut chart with total centered — matches Voom ticket-sales / category widgets */
export function DonutBreakdown({
  title,
  description,
  data,
  nameKey,
  valueKey,
  centerLabel,
  centerValue,
  action,
}: {
  title: string;
  description?: string;
  data: { [k: string]: string | number }[];
  nameKey: string;
  valueKey: string;
  centerLabel: string;
  centerValue: React.ReactNode;
  action?: ReactNode;
}) {
  if (!data.length) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
        <p className="mt-8 text-center text-sm text-muted-foreground">No data yet.</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + Number(d[valueKey] ?? 0), 0);
  const config = Object.fromEntries(
    data.map((d, i) => [String(d[nameKey]), { label: String(d[nameKey]), color: CHART_COLORS[i % CHART_COLORS.length] }]),
  );

  return (
    <div className="rounded-2xl bg-card shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-center">
        <div className="relative h-[180px] w-[180px] shrink-0">
          <ChartContainer config={config} className="h-full w-full aspect-square">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={78}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{centerLabel}</span>
            <span className="font-display text-xl font-bold text-foreground">{centerValue}</span>
          </div>
        </div>
        <div className="w-full flex-1 space-y-3">
          {data.map((d, i) => {
            const v = Number(d[valueKey] ?? 0);
            const pct = total ? Math.round((v / total) * 100) : 0;
            return (
              <div key={String(d[nameKey])}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 capitalize text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {String(d[nameKey])}
                  </span>
                  <span className="font-semibold text-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Voom right-rail hero card — image, title, meta, CTA */
export function FeaturedHeroCard({
  imageUrl,
  badge,
  title,
  meta,
  description,
  ctaLabel,
  ctaTo,
  ctaParams,
}: {
  imageUrl?: string | null;
  badge?: string;
  title: string;
  meta?: string;
  description?: string;
  ctaLabel: string;
  ctaTo: string;
  ctaParams?: Record<string, string>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="relative h-36 bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-soft text-primary/40">
            <span className="font-display text-4xl font-bold">IGE</span>
          </div>
        )}
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-deep backdrop-blur">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-base font-bold leading-snug text-foreground">{title}</h3>
        {meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
        {description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{description}</p>}
        <Link
          to={ctaTo}
          params={ctaParams}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
        >
          {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/** Voom agenda / schedule list with date badges on the left */
export function AgendaList({
  title,
  items,
  empty,
}: {
  title: string;
  items: { id: string; date: string; title: string; subtitle?: string; badge?: string }[];
  empty?: string;
}) {
  return (
    <div className="rounded-2xl bg-card shadow-card">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border/40">
        {items.length === 0 && (
          <p className="px-5 py-8 text-center text-xs text-muted-foreground italic">{empty ?? "Nothing scheduled."}</p>
        )}
        {items.map((item) => {
          const d = new Date(item.date);
          const day = d.getDate();
          const mon = d.toLocaleString("en", { month: "short" });
          return (
            <div key={item.id} className="flex gap-3 px-5 py-3.5">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary-deep">
                <span className="text-[10px] font-bold uppercase leading-none">{mon}</span>
                <span className="font-display text-lg font-bold leading-none">{day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">{item.title}</div>
                {item.subtitle && <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>}
                {item.badge && (
                  <span className="mt-1 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-primary-deep">
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
