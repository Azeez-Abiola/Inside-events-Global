import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { getSponsorDashboard } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/deals")({
  head: () => ({ meta: [{ title: "My deals — IGE" }] }),
  component: SponsorDeals,
});

function SponsorDeals() {
  const fetch = useServerFn(getSponsorDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["sponsor-dash"], queryFn: () => fetch() });

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold tracking-tight">My sponsorships</h1>
      <p className="mt-1 text-muted-foreground">Track commitments you've submitted and events you've saved.</p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">My commitments</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Budget</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {(data?.forms ?? []).map((f: any) => {
                const ev = data!.eventMap[f.event_id];
                return (
                  <tr key={f.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{ev?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{[ev?.city, ev?.country].filter(Boolean).join(", ")}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {f.budget_range_min || f.budget_range_max ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      {ev && <Link to="/events/$slug" params={{ slug: ev.slug }} className="text-xs text-primary hover:underline">View event →</Link>}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !data?.forms?.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No commitments yet. <Link to="/marketplace" className="text-primary hover:underline">Browse marketplace</Link></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Saved events</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(data?.saves ?? []).map((s: any) => {
            const ev = data!.eventMap[s.event_id];
            if (!ev) return null;
            return (
              <Link key={s.event_id} to="/events/$slug" params={{ slug: ev.slug }} className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-soft">
                {ev.banner_image_url && <img src={ev.banner_image_url} alt={ev.name} className="h-32 w-full object-cover" />}
                <div className="p-4">
                  <div className="font-medium">{ev.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{[ev.city, ev.country].filter(Boolean).join(", ")}</div>
                </div>
              </Link>
            );
          })}
          {!isLoading && !data?.saves?.length && <p className="text-sm text-muted-foreground">No saved events yet.</p>}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Fresh on the marketplace</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(data?.freshEvents ?? []).map((e: any) => (
            <Link key={e.id} to="/events/$slug" params={{ slug: e.slug }} className="overflow-hidden rounded-xl border border-border bg-card hover:shadow-soft">
              {e.banner_image_url && <img src={e.banner_image_url} alt={e.name} className="h-28 w-full object-cover" />}
              <div className="p-4">
                <div className="font-medium">{e.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{e.primary_sector} · {[e.city, e.country].filter(Boolean).join(", ")}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
