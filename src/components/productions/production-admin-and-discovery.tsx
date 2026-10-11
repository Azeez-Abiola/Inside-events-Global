import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Clapperboard, ExternalLink, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardHeader, DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { ProfileCompletionBar } from "@/components/onboarding/profile-completion-bar";
import { MatchNotificationsPanel } from "@/components/matches/match-notifications-panel";
import { fmtMoney } from "@/lib/currency";
import { getCalendar } from "@/lib/calendar.functions";
import {
  discoverProductions,
  expressProductionInterest,
  getMyProductions,
  listProductionQueue,
  reviewProduction,
} from "@/lib/productions.functions";

/** Creative Hub home (TAB 5 §5.6). */
export function CreativeDashboard() {
  const fetchProds = useServerFn(getMyProductions);
  const fetchCal = useServerFn(getCalendar);
  const { data, isLoading } = useQuery({
    queryKey: ["my-productions"],
    queryFn: () => fetchProds(),
  });
  const from = new Date().toISOString();
  const to = new Date(Date.now() + 60 * 86_400_000).toISOString();
  const { data: cal } = useQuery({
    queryKey: ["calendar-home", from.slice(0, 10)],
    queryFn: () => fetchCal({ data: { from, to } }),
  });
  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }
  const prods = data?.productions ?? [];
  const places = data?.placements ?? [];
  const due = places
    .filter((p) => p.slots_filled > 0 && !p.delivered_at)
    .sort((a, b) => (a.deliverable_due ?? "9").localeCompare(b.deliverable_due ?? "9"));
  const titleOf = (id: string) => prods.find((p) => p.id === id)?.title ?? "";

  return (
    <AppShell>
      <div className="space-y-6">
        <DashboardHeader
          title="Creative Hub"
          subtitle="Your productions, the brands interested in them, and what you have promised to deliver."
          action={
            <Link to="/dashboard/productions" className="btn-primary inline-block">
              My productions
            </Link>
          }
        />
        <ProfileCompletionBar />
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardPanel title="Productions seeking sponsorship">
            {prods.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No productions yet.{" "}
                <Link
                  to="/dashboard/productions"
                  className="font-semibold text-primary hover:underline"
                >
                  Add your first →
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {prods.map((p) => {
                  const mine = places.filter((x) => x.production_id === p.id);
                  const filled = mine.reduce((n, x) => n + x.slots_filled, 0);
                  const total = mine.reduce((n, x) => n + x.slots_total, 0);
                  const raised = mine.reduce((n, x) => n + (x.price ?? 0) * x.slots_filled, 0);
                  return (
                    <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{p.title}</span>
                        <span className="text-xs text-muted-foreground">{p.stage ?? "—"}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-brand-gradient"
                          style={{ width: `${total ? (filled / total) * 100 : 0}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {filled} of {total} slots filled
                        {p.amount_sought != null &&
                          ` · ${fmtMoney(p.currency, raised)} of ${fmtMoney(p.currency, p.amount_sought)}`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Placement deliverables due"
            description="What you have promised each brand, and whether proof is in."
          >
            {due.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Nothing outstanding.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {due.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <span className="truncate">
                      <span className="font-medium text-foreground">{p.kind}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {titleOf(p.production_id)}
                        {p.brand_label ? ` · ${p.brand_label}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {p.deliverable_due
                        ? new Date(p.deliverable_due).toLocaleDateString()
                        : "No date"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>

          <DashboardPanel
            title="Upcoming milestones"
            description="Shoots, premieres and releases from your Event Calendar."
            action={
              <Link
                to="/dashboard/calendar"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Calendar →
              </Link>
            }
          >
            {!cal?.items.length ? (
              <p className="py-4 text-sm text-muted-foreground">Nothing in the next 60 days.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {cal.items.slice(0, 8).map((i) => (
                  <li key={i.id} className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="w-20 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {new Date(i.starts_at).toLocaleDateString()}
                    </span>
                    <span className="truncate text-foreground">{i.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>

          <MatchNotificationsPanel />
        </div>
      </div>
    </AppShell>
  );
}

/** Brands discover vetted productions (TAB 3 §3.4: "discover vetted events and productions"). */
export function DiscoverProductionsPage() {
  const fetchAll = useServerFn(discoverProductions);
  const interest = useServerFn(expressProductionInterest);
  const { data, isLoading } = useQuery({
    queryKey: ["discover-productions"],
    queryFn: () => fetchAll(),
  });
  const [sent, setSent] = useState<Set<string>>(new Set());
  const mut = useMutation({
    mutationFn: (id: string) => interest({ data: { id } }),
    onSuccess: (_r, id) => {
      setSent(new Set([...sent, id]));
      toast.success("Sent to IGE. If it fits, the team introduces you and sets up the meeting.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <WorkspacePage
      title="Creative productions"
      subtitle="Vetted films, series, shows and projects with brand placement and sponsorship opportunities."
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !data?.productions.length ? (
        <DashboardPanel title="No productions live yet">
          <p className="text-sm text-muted-foreground">
            Vetted productions will appear here as creatives publish them.
          </p>
        </DashboardPanel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.productions.map((p) => {
            const mine = data.placements.filter((x) => x.production_id === p.id);
            return (
              <article
                key={p.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-brand-soft">
                    <Clapperboard className="h-10 w-10 text-primary/50" />
                  </div>
                )}
                <div className="space-y-2 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">
                    {[p.format, p.stage].filter(Boolean).join(" · ")}
                  </p>
                  <h3 className="font-display text-lg font-bold text-foreground">{p.title}</h3>
                  {p.logline && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{p.logline}</p>
                  )}
                  {p.release_window && (
                    <p className="text-xs text-muted-foreground">Release: {p.release_window}</p>
                  )}
                  <ul className="space-y-1 text-xs">
                    {mine.map((x, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="text-foreground">{x.kind}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {x.slots_total - x.slots_filled} open
                          {x.price != null ? ` · ${fmtMoney(x.currency, x.price)}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {sent.has(p.id) ? (
                    <p className="flex items-center gap-1.5 pt-1 text-xs text-secondary-deep">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Interest sent to IGE
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={mut.isPending}
                      onClick={() => mut.mutate(p.id)}
                    >
                      Express interest
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </WorkspacePage>
  );
}

/** Admin vetting for productions (TAB 6 §6.3: "event listings and Creative Hub productions"). */
export function ProductionQueuePage() {
  const qc = useQueryClient();
  const fetchQueue = useServerFn(listProductionQueue);
  const review = useServerFn(reviewProduction);
  const { data, isLoading } = useQuery({
    queryKey: ["production-queue"],
    queryFn: () => fetchQueue(),
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const act = (
    id: string,
    decision: "approved_live" | "rejected" | "changes_requested" | "under_review",
  ) =>
    review({ data: { id, decision, notes: notes[id]?.trim() || undefined } })
      .then(() => {
        toast.success("Decision recorded and the creative notified");
        qc.invalidateQueries({ queryKey: ["production-queue"] });
      })
      .catch((e: Error) => toast.error(e.message));
  return (
    <WorkspacePage
      title="Production vetting"
      subtitle="Creative Hub productions published for sponsorship, oldest first."
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !data?.productions.length ? (
        <DashboardPanel title="Queue is clear">
          <p className="text-sm text-muted-foreground">No productions waiting for review.</p>
        </DashboardPanel>
      ) : (
        <div className="space-y-4">
          {data.productions.map((p) => (
            <DashboardPanel
              key={p.id}
              title={p.title}
              description={`${p.owner_name} · ${[p.format, p.stage].filter(Boolean).join(" · ")} · ${p.listing_status.replace(/_/g, " ")}`}
            >
              <div className="grid gap-4 text-sm lg:grid-cols-2">
                <div className="space-y-1">
                  {p.logline && <p className="text-muted-foreground">{p.logline}</p>}
                  <p className="text-xs text-muted-foreground">
                    Release: {p.release_window ?? "—"} · Platforms: {p.platforms.join(", ") || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Markets: {p.target_markets.join(", ") || "—"}
                  </p>
                  {p.amount_sought != null && (
                    <p className="text-xs text-muted-foreground">
                      Sought: {fmtMoney(p.currency, p.amount_sought)}
                    </p>
                  )}
                  {p.pitch_deck_url && (
                    <a
                      href={p.pitch_deck_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Pitch deck (private) <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <ul className="mt-2 space-y-1 text-xs">
                    {data.placements
                      .filter((x) => x.production_id === p.id)
                      .map((x) => (
                        <li key={x.id}>
                          {x.kind} · {x.slots_total} slot{x.slots_total === 1 ? "" : "s"}
                          {x.price != null && ` · ${fmtMoney(x.currency, x.price)}`}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <textarea
                    value={notes[p.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
                    rows={3}
                    placeholder="Note to the creative (required for changes or rejection)"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => act(p.id, "approved_live")}>
                      Approve and list
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!notes[p.id]?.trim()}
                      onClick={() => act(p.id, "changes_requested")}
                    >
                      Request changes
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!notes[p.id]?.trim()}
                      onClick={() => act(p.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </DashboardPanel>
          ))}
        </div>
      )}
    </WorkspacePage>
  );
}
