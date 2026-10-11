import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarCheck, Handshake, ShieldCheck, Video } from "lucide-react";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { bookMatchMeeting, listMyMatches, type MyMatch } from "@/lib/matching.functions";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** One Match Notification card (TAB 13 §13.2, TAB 19 §19.5). */
export function MatchCard({ m }: { m: MyMatch }) {
  const qc = useQueryClient();
  const book = useServerFn(bookMatchMeeting);
  const [slot, setSlot] = useState("");
  const mut = useMutation({
    mutationFn: () => book({ data: { match_id: m.id, slot } }),
    onSuccess: () => {
      toast.success("Meeting booked. Both of you have been told.");
      qc.invalidateQueries({ queryKey: ["my-matches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const b = m.booking;
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">{m.counterpart}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        <span className="font-medium text-secondary-deep">Why:</span> {m.why}
      </p>
      {b?.status === "booked" && b.scheduled_at ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-secondary/10 px-3 py-2 text-sm">
          <CalendarCheck className="h-4 w-4 text-secondary-deep" />
          <span className="text-foreground">Booked for {fmt(b.scheduled_at)}</span>
          {b.video_call_url && (
            <a
              href={b.video_call_url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <Video className="h-3.5 w-3.5" /> Join call
            </a>
          )}
        </div>
      ) : b?.proposed_slots.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            aria-label="Meeting time"
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          >
            <option value="">Pick a time…</option>
            {b.proposed_slots.map((s) => (
              <option key={s} value={s}>
                {fmt(s)}
              </option>
            ))}
          </select>
          <Button size="sm" disabled={!slot || mut.isPending} onClick={() => mut.mutate()}>
            Book Your Introductory Meeting
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">IGE is arranging meeting times.</p>
      )}
    </li>
  );
}

/**
 * Match Notifications on a dashboard. Shown only once Admin has approved a
 * match — there is no pending state for users (TAB 18 §18.5).
 */
export function MatchNotificationsPanel({ limit = 3 }: { limit?: number }) {
  const fetchMatches = useServerFn(listMyMatches);
  const { data } = useQuery({ queryKey: ["my-matches"], queryFn: () => fetchMatches() });
  const matches = data?.matches ?? [];
  return (
    <DashboardPanel
      title="Match notifications"
      description="Introductions IGE has reviewed and approved for you."
      action={
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/matches"
            className="text-xs font-semibold text-primary hover:underline"
          >
            All matches →
          </Link>
          <InfoTip tip="matches.how" />
        </div>
      }
    >
      {matches.length === 0 ? (
        <p className="flex items-start gap-2 py-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
          No approved matches yet. IGE reviews every suggested match before anyone is introduced;
          you will be notified here and by email when one is approved.
        </p>
      ) : (
        <ul className="space-y-3">
          {matches.slice(0, limit).map((m) => (
            <MatchCard key={m.id} m={m} />
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}

export function MatchesPageBody() {
  const fetchMatches = useServerFn(listMyMatches);
  const { data, isLoading } = useQuery({ queryKey: ["my-matches"], queryFn: () => fetchMatches() });
  const matches = data?.matches ?? [];
  if (isLoading) return null;
  return matches.length === 0 ? (
    <DashboardPanel title="No matches yet">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Handshake className="mt-0.5 h-4 w-4 shrink-0" />
        IGE scores possible partners automatically, then the team reviews each one before any
        introduction is made. Approved matches appear here with a way to book a short call. You
        never contact other users directly, and they never see your contact details.
      </p>
    </DashboardPanel>
  ) : (
    <ul className="grid gap-3 lg:grid-cols-2">
      {matches.map((m) => (
        <MatchCard key={m.id} m={m} />
      ))}
    </ul>
  );
}
