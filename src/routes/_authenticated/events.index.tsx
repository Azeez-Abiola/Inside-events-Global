import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Trash2, CalendarDays, MapPin } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { createEventDraft, getMyEvents, deleteDraftEvent } from "@/lib/events.functions";

export const Route = createFileRoute("/_authenticated/events/")({
  head: () => ({ meta: [{ title: "My events - IGE" }] }),
  component: EventsList,
});

function EventsList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchEvents = useServerFn(getMyEvents);
  const createDraft = useServerFn(createEventDraft);
  const removeDraft = useServerFn(deleteDraftEvent);

  const { data, isLoading } = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => fetchEvents(),
  });

  const create = useMutation({
    mutationFn: () => createDraft(),
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ["events", "mine"] });
      navigate({ to: "/events/edit/$id", params: { id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => removeDraft({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events", "mine"] }); toast.success("Draft deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const events = data?.events ?? [];

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">My events</h1>
          <p className="mt-1 text-sm text-muted-foreground">Draft, submit and track vetting status of your events.</p>
        </div>
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-transform disabled:opacity-60"
        >
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New event
        </button>
      </div>

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
      ) : events.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <h3 className="font-display text-xl font-bold">No events yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Create your first event draft to start the IGE vetting flow.</p>
          <button onClick={() => create.mutate()} className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Create event</button>
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {events.map((e: any) => (
            <Link
              to="/events/edit/$id" params={{ id: e.id }} key={e.id}
              className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold">{e.name || "Untitled event"}</h3>
                  <StatusBadge status={e.status} />
                  {e.ige_vetted && <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-deep">IGE Vetted</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {e.start_date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {fmtDateRange(e.start_date, e.end_date)}</span>}
                  {(e.city || e.country) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {[e.city, e.country].filter(Boolean).join(", ")}</span>}
                  {e.event_type && <span>· {e.event_type}</span>}
                </div>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span>{e.view_count} views</span><span>{e.save_count} saves</span><span>{e.inquiry_count} inquiries</span>
                </div>
              </div>
              {e.status === "draft" && (
                <button
                  onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); if (confirm("Delete this draft?")) del.mutate(e.id); }}
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                ><Trash2 className="h-4 w-4" /></button>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function fmtDateRange(s?: string | null, e?: string | null) {
  if (!s) return "";
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return e && e !== s ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
}
