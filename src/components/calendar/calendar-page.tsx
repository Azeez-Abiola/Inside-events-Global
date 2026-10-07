import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Link2,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { Field, SelectField, TextArea } from "@/components/signup/profile-fields";
import { CalendarGrid, type CalendarView } from "@/components/calendar/calendar-grid";
import { ForwardEvents } from "@/components/calendar/forward-events";
import {
  deleteCalendarEntry,
  getCalendar,
  upsertCalendarEntry,
  type CalendarItem,
} from "@/lib/calendar.functions";
import { can, type WorkspaceRole } from "@/lib/workspace-permissions";

const ENTRY_TYPES = ["milestone", "activation", "task", "meeting", "reminder", "other"] as const;

/** The range a view needs, widened to whole months so month strips are complete. */
function rangeFor(view: CalendarView, anchor: Date): { from: string; to: string } {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (view === "month") {
    return {
      from: iso(new Date(anchor.getFullYear(), anchor.getMonth(), 1)),
      to: iso(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)),
    };
  }
  if (view === "quarter") {
    return {
      from: iso(new Date(anchor.getFullYear(), anchor.getMonth(), 1)),
      to: iso(new Date(anchor.getFullYear(), anchor.getMonth() + 3, 0)),
    };
  }
  return {
    from: iso(new Date(anchor.getFullYear(), 0, 1)),
    to: iso(new Date(anchor.getFullYear(), 12, 0)),
  };
}

export function CalendarPage() {
  const qc = useQueryClient();
  const fetchCalendar = useServerFn(getCalendar);
  const saveEntry = useServerFn(upsertCalendarEntry);
  const removeEntry = useServerFn(deleteCalendarEntry);

  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [tab, setTab] = useState<"mine" | "forward">("mine");
  const [adding, setAdding] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const range = useMemo(() => rangeFor(view, anchor), [view, anchor]);

  const { data, isLoading } = useQuery({
    queryKey: ["calendar", range.from, range.to],
    queryFn: () => fetchCalendar({ data: range }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["calendar"] });

  const [form, setForm] = useState({
    title: "",
    entry_type: "milestone" as (typeof ENTRY_TYPES)[number],
    starts_at: "",
    notes: "",
  });

  const add = useMutation({
    mutationFn: () =>
      saveEntry({
        data: {
          title: form.title.trim(),
          entry_type: form.entry_type,
          starts_at: new Date(form.starts_at).toISOString(),
          all_day: true,
          notes: form.notes.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Added to your calendar");
      setForm({ title: "", entry_type: "milestone", starts_at: "", notes: "" });
      setAdding(false);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => removeEntry({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const myRole = (data?.myRole ?? null) as WorkspaceRole | null;
  const editable = can(myRole, "workspace.edit");
  const items = (data?.items ?? []) as CalendarItem[];

  const dayItems = selectedDay
    ? items.filter(
        (i) =>
          i.starts_at.slice(0, 10) ===
          `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`,
      )
    : [];

  const step = (dir: 1 | -1) => {
    const months = view === "month" ? 1 : view === "quarter" ? 3 : 12;
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + dir * months, 1));
  };

  const periodLabel =
    view === "year"
      ? String(anchor.getFullYear())
      : anchor.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <WorkspacePage
      title="Event Calendar"
      subtitle="Your events, milestones, follow-ups and meetings — months ahead, not weeks."
      action={
        editable && tab === "mine" ? (
          <Button onClick={() => setAdding((v) => !v)}>
            <Plus className="mr-2 h-4 w-4" />
            Add to calendar
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: "mine", label: "My calendar" },
            { id: "forward", label: "Forward events" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-brand-soft text-primary-deep"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-1 inline-flex items-center">
          <InfoTip tip="calendar.forward_events" />
        </span>
      </div>

      {tab === "forward" ? (
        <ForwardEvents />
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {adding && editable && (
            <DashboardPanel title="Add to calendar">
              <form
                className="space-y-4 px-5 py-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.title.trim() || !form.starts_at) {
                    toast.error("A title and a date are needed.");
                    return;
                  }
                  add.mutate();
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Title"
                    value={form.title}
                    onChange={(v) => setForm({ ...form, title: v })}
                    required
                  />
                  <Field
                    label="Date"
                    type="date"
                    value={form.starts_at}
                    onChange={(v) => setForm({ ...form, starts_at: v })}
                    required
                  />
                </div>
                <SelectField
                  label="Type"
                  value={form.entry_type}
                  onChange={(v) =>
                    setForm({ ...form, entry_type: v as (typeof ENTRY_TYPES)[number] })
                  }
                  options={[...ENTRY_TYPES]}
                />
                <TextArea
                  label="Notes (optional)"
                  value={form.notes}
                  onChange={(v) => setForm({ ...form, notes: v })}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={add.isPending}>
                    {add.isPending ? "Adding…" : "Add"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DashboardPanel>
          )}

          <DashboardPanel
            title={periodLabel}
            action={
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {(["month", "quarter", "year"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                        view === v
                          ? "bg-brand-soft text-primary-deep"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {v === "year" ? "12 months" : v}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous period"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnchor(new Date())}
                    className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next period"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            }
            bodyClassName="p-4"
          >
            <CalendarGrid
              view={view}
              anchor={anchor}
              items={items}
              budgetWindows={data?.budgetWindows ?? []}
              onSelectDay={setSelectedDay}
            />
            <p className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <Legend className="bg-brand-soft" label="Events" />
              <Legend className="bg-accent/15" label="Milestones & activations" />
              <Legend className="bg-amber-500/15" label="Follow-ups" />
              <Legend className="bg-secondary/15" label="Meetings" />
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm ring-1 ring-inset ring-primary/40" />
                Budget window
              </span>
            </p>
          </DashboardPanel>

          {selectedDay && (
            <DashboardPanel
              title={selectedDay.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              action={
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              }
            >
              {dayItems.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Nothing on this day.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {dayItems.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {i.is_private && "🔒 "}
                          {i.title}
                        </span>
                        <span className="block text-xs capitalize text-muted-foreground">
                          {i.source.replace("_", " ")}
                          {i.kind ? ` · ${i.kind}` : ""}
                        </span>
                      </span>
                      {editable && i.source === "entry" && (
                        <button
                          type="button"
                          onClick={() => del.mutate(i.id.replace("entry:", ""))}
                          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </DashboardPanel>
          )}

          <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              This calendar syncs one way into Google Calendar and Outlook. Subscribe to the feed
              from Account Settings — changes made in those apps do not come back here.
            </span>
          </p>
        </>
      )}
    </WorkspacePage>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-3 w-3 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
