import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { getOrganiserPipeline } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";
import { Eye, Bookmark, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline - IGE" }] }),
  component: OrganiserPipeline,
});

function OrganiserPipeline() {
  const fetch = useServerFn(getOrganiserPipeline);
  const { data, isLoading } = useQuery({ queryKey: ["org-pipeline"], queryFn: () => fetch() });

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold tracking-tight">Sponsorship pipeline</h1>
      <p className="mt-1 text-muted-foreground">Inquiries and deal stages across your events.</p>

      {isLoading && <p className="mt-10 text-muted-foreground">Loading…</p>}

      {(data?.events ?? []).map((ev: any) => {
        const evForms = (data?.forms ?? []).filter((f: any) => f.event_id === ev.id);
        const evDeals = (data?.deals ?? []).filter((d: any) => d.event_id === ev.id);
        const dealByForm: Record<string, any> = {};
        for (const d of evDeals) if (d.commitment_form_id) dealByForm[d.commitment_form_id] = d;

        return (
          <section key={ev.id} className="mt-10 rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <div>
                <Link to="/events/$slug" params={{ slug: ev.slug }} className="font-display text-lg font-semibold hover:underline">{ev.name}</Link>
                <div className="text-xs text-muted-foreground">{[ev.city, ev.country].filter(Boolean).join(", ")} · {ev.start_date ? new Date(ev.start_date).toLocaleDateString() : "TBD"}</div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {ev.view_count ?? 0}</span>
                <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" /> {ev.save_count ?? 0}</span>
                <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {ev.inquiry_count ?? 0}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-4 py-3">Company</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Budget</th><th className="px-4 py-3">Deal stage</th><th className="px-4 py-3">Submitted</th></tr>
                </thead>
                <tbody>
                  {evForms.map((f: any) => {
                    const deal = dealByForm[f.id];
                    return (
                      <tr key={f.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{f.company_name}</td>
                        <td className="px-4 py-3">{f.contact_name}</td>
                        <td className="px-4 py-3 text-xs">
                          {f.budget_range_min || f.budget_range_max ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}` : "-"}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {deal ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary-deep">{deal.status.replace(/_/g, " ")}</span> : <span className="text-xs text-muted-foreground">Pending vetting</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "-"}</td>
                      </tr>
                    );
                  })}
                  {!evForms.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No inquiries yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {!isLoading && !data?.events?.length && (
        <div className="mt-12 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No events yet. <Link to="/events" className="text-primary hover:underline">Create your first event</Link>.</p>
        </div>
      )}
    </AppShell>
  );
}
