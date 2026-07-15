import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashboardKpiSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-card p-4 shadow-card", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  );
}

export function DashboardKpiRowSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", count === 4 && "lg:grid-cols-4", count === 5 && "xl:grid-cols-5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <DashboardKpiSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

export function DashboardTabsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-muted/50 p-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-lg" />
      ))}
    </div>
  );
}

export function DashboardToolbarSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <Skeleton className="h-10 w-full max-w-md rounded-md" />
      <Skeleton className="h-9 w-32 rounded-md" />
    </div>
  );
}

export function DashboardTableSkeleton({
  rows = 6,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto p-0", className)}>
      <div className="min-w-[640px]">
        <div className="flex gap-4 border-b border-border/60 bg-muted/30 px-4 py-3">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-4 px-4 py-4">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton
                  key={c}
                  className={cn("h-4 flex-1", c === 0 && "max-w-[140px]", c === cols - 1 && "max-w-[80px]")}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-card p-5 shadow-card", className)}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 h-48 w-full rounded-xl" />
    </div>
  );
}

export function DashboardListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border/40">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPipelineSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1080px] gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, c) => (
          <div key={c} className="rounded-xl border border-border bg-muted/20 p-2.5">
            <Skeleton className="mb-3 h-4 w-24" />
            <div className="space-y-2">
              {Array.from({ length: c % 2 === 0 ? 2 : 1 }).map((_, r) => (
                <div key={r} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardDrawerDetailSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/60 bg-muted/10 px-4 py-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}

/** Full dashboard page placeholder — header, KPIs, table */
export function DashboardPageSkeleton({
  kpis = 3,
  tableRows = 6,
  tableCols = 5,
  showTabs = false,
  showCharts = false,
}: {
  kpis?: number;
  tableRows?: number;
  tableCols?: number;
  showTabs?: boolean;
  showCharts?: boolean;
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <DashboardHeaderSkeleton />
      <DashboardKpiRowSkeleton count={kpis} />
      {showTabs && <DashboardTabsSkeleton />}
      {showCharts && (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardChartSkeleton />
          <DashboardChartSkeleton />
        </div>
      )}
      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        <DashboardToolbarSkeleton />
        <DashboardTableSkeleton rows={tableRows} cols={tableCols} />
      </div>
    </div>
  );
}
