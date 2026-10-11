import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Clock, Loader2, Play, X } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import {
  adjustMatchWhy,
  approveMatch,
  decideMatch,
  getMatchConfig,
  getMatchDetail,
  listMatchQueue,
  runMatchingNow,
  updateMatchConfig,
} from "@/lib/matching.functions";

const PAIRINGS: Record<string, string> = {
  organiser_sponsor: "Organiser ↔ Sponsor",
  referral_event: "Referral Partner ↔ Event",
  pro_event: "Partnerships Pro ↔ Event",
  media_event: "Media Partner ↔ Event",
  creative_sponsor: "Creative Hub ↔ Sponsor",
  service_booking: "Service booking",
  manual: "Manual",
};
const pretty = (s: string) => s.replace(/_/g, " ");

/** Renders one onboarding application's sections for the side-by-side view. */
function ProfileDump({
  app,
}: {
  app: {
    role?: string;
    sections?: Record<string, Record<string, string | string[] | number | boolean | null>>;
    verification_status?: string;
  } | null;
}) {
  if (!app) return <p className="text-xs text-muted-foreground">No onboarding record.</p>;
  return (
    <div className="space-y-3 text-xs">
      <p className="font-semibold capitalize text-foreground">
        {pretty(app.role ?? "")} · verification {pretty(app.verification_status ?? "not submitted")}
      </p>
      {Object.entries(app.sections ?? {}).map(([k, sec]) => (
        <div key={k}>
          <p className="mb-1 font-semibold uppercase text-muted-foreground">Section {k}</p>
          <dl className="space-y-0.5">
            {Object.entries(sec ?? {})
              .filter(
                ([, v]) =>
                  v !== "" &&
                  v != null &&
                  !(Array.isArray(v) && !v.length) &&
                  typeof v !== "boolean",
              )
              .map(([f, v]) => (
                <div key={f} className="flex gap-2">
                  <dt className="w-36 shrink-0 text-muted-foreground">{pretty(f)}</dt>
                  <dd className="min-w-0 break-words text-foreground">
                    {Array.isArray(v)
                      ? v.map(String).join(", ")
                      : typeof v === "object"
                        ? JSON.stringify(v)
                        : String(v)}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function MatchDetail({ id, onDone }: { id: string; onDone: () => void }) {
  const fetchDetail = useServerFn(getMatchDetail);
  const approve = useServerFn(approveMatch);
  const decide = useServerFn(decideMatch);
  const adjust = useServerFn(adjustMatchWhy);
  const { data } = useQuery({
    queryKey: ["match-detail", id],
    queryFn: () => fetchDetail({ data: { id } }),
  });
  const [slots, setSlots] = useState<string[]>(["", "", ""]);
  const [callUrl, setCallUrl] = useState("");
  const [note, setNote] = useState("");
  const [shown, setShown] = useState<string[] | null>(null);

  const approveMut = useMutation({
    mutationFn: () =>
      approve({
        data: {
          id,
          proposed_slots: slots.filter(Boolean).map((s) => new Date(s).toISOString()),
          video_call_url: callUrl.trim(),
          note: note.trim() || undefined,
        },
      }),
    onSuccess: (res) => {
      toast.success(
        res.pending
          ? "This match involves a Managed Service client, so a second Super Admin must sign off. It's waiting on the Users page."
          : "Approved — both sides have been notified.",
      );
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const decideMut = useMutation({
    mutationFn: (d: "rejected" | "deferred") =>
      decide({ data: { id, decision: d, reason: note.trim() || undefined } }),
    onSuccess: onDone,
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }
  const m = data.match as Record<string, string | number | null>;
  const expl = data.explanations;
  const shownIds = shown ?? expl.filter((e) => e.shown_to_users).map((e) => e.id);
  const decided = m.queue_status === "approved" || m.queue_status === "rejected";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-primary-deep">
          {m.composite_score}/100
        </span>
        <span className="text-sm text-muted-foreground">
          {PAIRINGS[String(m.pairing_type)] ?? m.pairing_type} · primary {m.base_score} · secondary{" "}
          {m.secondary_score}
        </span>
      </div>

      <div>
        <p className="mb-1 flex items-center text-xs font-semibold uppercase text-muted-foreground">
          Why — tick what users see
          <InfoTip tip="matches.adjust" />
        </p>
        <ul className="space-y-1 text-sm">
          {expl.map((e) => (
            <li key={e.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={shownIds.includes(e.id)}
                disabled={decided}
                onChange={(ev) =>
                  setShown(
                    ev.target.checked ? [...shownIds, e.id] : shownIds.filter((x) => x !== e.id),
                  )
                }
                className="mt-1"
              />
              <span className="text-foreground">
                {e.internal_display_text}{" "}
                <span className="text-xs text-muted-foreground">
                  (+{Number(e.contribution_weight)}
                  {e.is_primary ? ", primary" : ""})
                </span>
              </span>
            </li>
          ))}
          {!expl.length && (
            <li className="text-muted-foreground">{String(m.why_user_text ?? "Manual match")}</li>
          )}
        </ul>
        {shown && !decided && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() =>
              adjust({ data: { id, shown_explanation_ids: shownIds } })
                .then(() => {
                  toast.success("Why line updated");
                  setShown(null);
                })
                .catch((e: Error) => toast.error(e.message))
            }
          >
            Save Why line
          </Button>
        )}
      </div>

      <div className="grid gap-3 rounded-lg bg-muted/30 p-3 text-xs sm:grid-cols-2">
        <p>
          <span className="font-semibold text-foreground">Subject sees:</span>{" "}
          {String(m.user_summary_for_subject)}
        </p>
        <p>
          <span className="font-semibold text-foreground">Candidate sees:</span>{" "}
          {String(m.user_summary_for_candidate)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="max-h-96 overflow-y-auto rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-semibold text-foreground">
            {String(m.subject_name ?? "Subject")}
          </p>
          {data.event && (
            <p className="mb-2 text-xs text-muted-foreground">
              Event: {(data.event as { name: string }).name}
            </p>
          )}
          <ProfileDump app={data.subjectApplication} />
        </div>
        <div className="max-h-96 overflow-y-auto rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-semibold text-foreground">
            {String(m.candidate_name ?? "Candidate")}
          </p>
          <ProfileDump app={data.candidateApplication} />
        </div>
      </div>

      {!decided && (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-foreground">Approve and notify</p>
          <p className="text-xs text-muted-foreground">
            Offer up to three meeting times and a call link on an IGE account. The first side to
            pick a time books it for both.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {slots.map((s, i) => (
              <input
                key={i}
                type="datetime-local"
                value={s}
                onChange={(e) => setSlots(slots.map((x, j) => (j === i ? e.target.value : x)))}
                aria-label={`Meeting time ${i + 1}`}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              />
            ))}
          </div>
          <input
            type="url"
            value={callUrl}
            onChange={(e) => setCallUrl(e.target.value)}
            placeholder="https://meet.google.com/… (IGE account)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Internal note or reason (logged in the Audit Log)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!slots.some(Boolean) || !callUrl.trim() || approveMut.isPending}
              onClick={() => approveMut.mutate()}
            >
              <Check className="mr-1.5 h-4 w-4" />
              Approve and notify
            </Button>
            <Button
              variant="outline"
              disabled={decideMut.isPending}
              onClick={() => decideMut.mutate("deferred")}
            >
              <Clock className="mr-1.5 h-4 w-4" />
              Defer
            </Button>
            <Button
              variant="destructive"
              disabled={decideMut.isPending}
              onClick={() => decideMut.mutate("rejected")}
            >
              <X className="mr-1.5 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function WeightsPanel() {
  const fetchConfig = useServerFn(getMatchConfig);
  const save = useServerFn(updateMatchConfig);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["match-config"], queryFn: () => fetchConfig() });
  if (!data) return null;
  return (
    <DashboardPanel
      title="Scoring weights"
      description="Tune per pairing as real outcomes come in (TAB 19 §19.4)."
    >
      <ul className="space-y-2 text-sm">
        {Object.entries(data.weights).map(([k, w]) => (
          <li key={k} className="flex flex-wrap items-center gap-3">
            <span className="w-52 text-muted-foreground">{PAIRINGS[k] ?? k}</span>
            <label className="flex items-center gap-1 text-xs">
              Primary %
              <input
                type="number"
                min={0}
                max={100}
                defaultValue={w.primary}
                onBlur={(e) =>
                  save({
                    data: {
                      pairing_type: k,
                      primary_weight: Number(e.target.value),
                      threshold: w.threshold,
                    },
                  })
                    .then(() => qc.invalidateQueries({ queryKey: ["match-config"] }))
                    .catch((err: Error) => toast.error(err.message))
                }
                className="w-16 rounded border border-border bg-background px-1.5 py-0.5"
              />
            </label>
            <label className="flex items-center gap-1 text-xs">
              Threshold
              <input
                type="number"
                min={0}
                max={100}
                defaultValue={w.threshold}
                onBlur={(e) =>
                  save({
                    data: {
                      pairing_type: k,
                      primary_weight: w.primary,
                      threshold: Number(e.target.value),
                    },
                  })
                    .then(() => qc.invalidateQueries({ queryKey: ["match-config"] }))
                    .catch((err: Error) => toast.error(err.message))
                }
                className="w-16 rounded border border-border bg-background px-1.5 py-0.5"
              />
            </label>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

/** Match Approval Queue (TAB 6 §6.8, TAB 19 §19.3A). */
export function MatchQueuePage() {
  const qc = useQueryClient();
  const fetchQueue = useServerFn(listMatchQueue);
  const run = useServerFn(runMatchingNow);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "deferred">("pending");
  const [pairing, setPairing] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["match-queue", status, pairing],
    queryFn: () => fetchQueue({ data: { status, pairing: pairing || undefined } }),
  });
  const runMut = useMutation({
    mutationFn: () => run(),
    onSuccess: (r) => {
      toast.success(
        `Scored ${r.scored} candidates · ${r.queued} new in the queue · ${r.removed} removed`,
      );
      qc.invalidateQueries({ queryKey: ["match-queue"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const refresh = () => {
    setOpen(null);
    qc.invalidateQueries({ queryKey: ["match-queue"] });
  };

  const density = data?.density ?? {};
  const thin = Object.keys(PAIRINGS).filter(
    (p) => p !== "manual" && (density[p]?.pending ?? 0) + (density[p]?.approved ?? 0) < 3,
  );

  return (
    <WorkspacePage
      title="Match Approval Queue"
      subtitle="The engine scores and ranks; nothing reaches a user until you approve it."
      action={
        <Button onClick={() => runMut.mutate()} disabled={runMut.isPending}>
          {runMut.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run matching now
        </Button>
      }
    >
      {thin.length > 0 && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
          Weak match pool: {thin.map((p) => PAIRINGS[p]).join(", ")}. Worth focusing outreach here
          (TAB 16).
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "deferred", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${status === s ? "bg-brand-soft text-primary-deep" : "text-muted-foreground hover:bg-muted"}`}
          >
            {s}
          </button>
        ))}
        <select
          value={pairing}
          onChange={(e) => setPairing(e.target.value)}
          aria-label="Pairing"
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="">Every pairing</option>
          {Object.entries(PAIRINGS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <InfoTip tip="matches.queue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <aside className="max-h-[75vh] overflow-y-auto rounded-xl border border-border bg-card">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : !data?.matches.length ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Nothing in this view.</p>
          ) : (
            data.matches.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setOpen(m.id)}
                className={`block w-full border-b border-border p-4 text-left ${open === m.id ? "bg-brand-soft" : "hover:bg-muted/40"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {m.subject_name} ↔ {m.candidate_name}
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums">
                    {m.composite_score}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {PAIRINGS[m.pairing_type] ?? m.pairing_type} ·{" "}
                  {new Date(m.computed_at).toLocaleDateString()}
                </p>
                {m.why_user_text && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">{m.why_user_text}</p>
                )}
              </button>
            ))
          )}
        </aside>
        <section className="rounded-xl border border-border bg-card p-5">
          {open ? (
            <MatchDetail key={open} id={open} onDone={refresh} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Pick a match to review both profiles side by side.
            </p>
          )}
        </section>
      </div>

      <WeightsPanel />
    </WorkspacePage>
  );
}
