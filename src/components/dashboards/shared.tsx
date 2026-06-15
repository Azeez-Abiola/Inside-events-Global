// Generic, role-agnostic UI primitives shared by the standalone dashboards.
// These hold no role logic — just presentation.

export function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: any;
  label: string;
  value: any;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:shadow-soft transition-all duration-300">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="mt-4 font-display text-2xl font-bold text-foreground">
        {loading ? "…" : value}
      </div>
      <div className="mt-0.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export function fmtDateRange(s?: string | null, e?: string | null) {
  if (!s) return "";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return e && e !== s ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
}
