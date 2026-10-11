import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, X } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import {
  DIMENSIONS,
  dismissNudge,
  getReadiness,
  listReadinessEvents,
  refreshAiCoaching,
  type ReadinessView,
} from "@/lib/readiness.functions";

const dimLabel = (k: string) => DIMENSIONS.find((d) => d.key === k)?.label ?? k;

function Gauge({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const colour = value >= 70 ? "#0E8A62" : value >= 45 ? "#E8A33D" : "#D64545";
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg width="144" height="144" viewBox="0 0 144 144" aria-hidden>
        <circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="12"
        />
        <circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(c * value) / 100} ${c}`}
          transform="rotate(-90 72 72)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold tabular-nums text-foreground">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

/** Six-axis radar, one axis per Framework dimension (TAB 5 §5.1 reports). */
function Radar({ dims }: { dims: ReadinessView["dimensions"] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const R = 90;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
    return [cx + Math.cos(a) * R * (v / 100), cy + Math.sin(a) * R * (v / 100)];
  };
  const ring = (v: number) => dims.map((_, i) => pt(i, v).join(",")).join(" ");
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-64 w-64"
      role="img"
      aria-label="Readiness by dimension"
    >
      {[25, 50, 75, 100].map((v) => (
        <polygon key={v} points={ring(v)} fill="none" stroke="currentColor" strokeOpacity="0.12" />
      ))}
      {dims.map((_, i) => {
        const [x, y] = pt(i, 100);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity="0.12" />
        );
      })}
      <polygon
        points={dims.map((d, i) => pt(i, d.score).join(",")).join(" ")}
        fill="#6B3FA0"
        fillOpacity="0.25"
        stroke="#6B3FA0"
        strokeWidth="2"
      />
      {dims.map((d, i) => {
        const [x, y] = pt(i, 122);
        return (
          <text
            key={d.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 9 }}
          >
            {d.label.split(" ")[0]} {d.score}
          </text>
        );
      })}
    </svg>
  );
}

/** Brand-Readiness Coach (TAB 4 §4.2 Module 3) — AI-assisted and free. */
export function ReadinessPage() {
  const qc = useQueryClient();
  const fetchEvents = useServerFn(listReadinessEvents);
  const fetchReadiness = useServerFn(getReadiness);
  const refreshAi = useServerFn(refreshAiCoaching);
  const dismiss = useServerFn(dismissNudge);

  const { data: evData, isLoading: evLoading } = useQuery({
    queryKey: ["readiness-events"],
    queryFn: () => fetchEvents(),
  });
  const events = evData?.events ?? [];
  const [eventId, setEventId] = useState<string | null>(null);
  useEffect(() => {
    if (!eventId && events.length) setEventId(events[0].id);
  }, [events, eventId]);

  const { data: view, isLoading } = useQuery({
    queryKey: ["readiness", eventId],
    queryFn: () => fetchReadiness({ data: { event_id: eventId! } }),
    enabled: !!eventId,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["readiness", eventId] });

  const aiMut = useMutation({
    mutationFn: () => refreshAi({ data: { event_id: eventId! } }),
    onSuccess: (r) => {
      toast.success(r.cards ? `${r.cards} new coaching cards` : "Nothing left to fix — nice.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (evLoading) {
    return (
      <WorkspacePage title="Brand-Readiness Coach">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage
      title="Brand-Readiness Coach"
      subtitle="Find out whether your event is ready for sponsors — and exactly what to fix — without booking a consultation. Free."
    >
      {events.length === 0 ? (
        <DashboardPanel title="No events yet">
          <p className="text-sm text-muted-foreground">
            Create an event in My Events and the coach will score it here.
          </p>
        </DashboardPanel>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={eventId ?? ""}
              onChange={(e) => setEventId(e.target.value)}
              aria-label="Event"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            {eventId && (
              <Link
                to="/events/edit/$id"
                params={{ id: eventId }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Edit this event →
              </Link>
            )}
          </div>

          {isLoading || !view ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <DashboardPanel title="Readiness score" action={<InfoTip tip="readiness.score" />}>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <Gauge value={view.composite} />
                  <div className="space-y-2">
                    {view.weekly_delta != null && (
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${view.weekly_delta > 0 ? "bg-secondary/15 text-secondary-deep" : view.weekly_delta < 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
                      >
                        {view.weekly_delta > 0 ? "+" : ""}
                        {view.weekly_delta} this week
                      </span>
                    )}
                    <ul className="space-y-1.5 text-sm">
                      {view.dimensions.map((d) => (
                        <li key={d.key} className="flex items-center gap-2">
                          <span className="w-40 truncate text-muted-foreground">{d.label}</span>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-brand-gradient"
                              style={{ width: `${d.score}%` }}
                            />
                          </div>
                          <span className="w-8 text-right tabular-nums text-foreground">
                            {d.score}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <Radar dims={view.dimensions} />
                </div>
              </DashboardPanel>

              <DashboardPanel
                title="Coaching feed"
                description="One fix per card. Suggestions only — never a vetting decision."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={aiMut.isPending || !view.ai_available}
                    onClick={() => aiMut.mutate()}
                    title={view.ai_available ? undefined : "AI coaching is not switched on yet"}
                  >
                    {aiMut.isPending ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Ask the AI coach
                  </Button>
                }
              >
                {view.nudges.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nothing to fix right now. Your listing covers every part of the framework.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {view.nudges.map((n) => (
                      <li
                        key={n.id}
                        className="relative rounded-xl border border-border bg-card p-4 pr-10"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">
                          {dimLabel(n.dimension)}
                          {n.source === "ai" && (
                            <span className="ml-2 inline-flex items-center gap-0.5 normal-case text-primary">
                              <Sparkles className="h-3 w-3" /> AI
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-foreground">{n.message}</p>
                        <button
                          type="button"
                          onClick={() =>
                            dismiss({ data: { id: n.id } })
                              .then(refresh)
                              .catch((e: Error) => toast.error(e.message))
                          }
                          aria-label="Dismiss"
                          className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Want hands-on help instead?{" "}
                  <Link
                    to="/messages"
                    search={{ kind: "request", subject: "Brand-Readiness Audit / Co-Creation" }}
                    className="font-semibold text-primary hover:underline"
                  >
                    Ask IGE about Co-Creation →
                  </Link>
                </p>
              </DashboardPanel>
            </div>
          )}
        </>
      )}
    </WorkspacePage>
  );
}
