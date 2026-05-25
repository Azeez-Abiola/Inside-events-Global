import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert, CheckCircle2, XCircle, Pencil, ArrowRight } from "lucide-react";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { listEventsForVetting, setEventVettingStatus, getEventForAdmin } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/admin/vetting")({
  head: () => ({ meta: [{ title: "Vetting queue — IGE Admin" }] }),
  component: VettingQueue,
});

const COLUMNS: { key: string; label: string }[] = [
  { key: "submitted", label: "New submissions" },
  { key: "under_review", label: "Under review" },
  { key: "revision_requested", label: "Revision requested" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function VettingQueue() {
  const { roles, loading } = useAuth();
  const isAdmin = roles.includes("abw_admin") || roles.includes("super_admin");
  const fetchList = useServerFn(listEventsForVetting);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "vetting"],
    queryFn: () => fetchList(),
    enabled: isAdmin,
  });
  const [open, setOpen] = useState<string | null>(null);

  if (loading) return null;
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          <ShieldAlert className="h-5 w-5" />
          <p className="mt-2 text-sm">You don't have access to the vetting queue.</p>
        </div>
      </AppShell>
    );
  }

  const grouped: Record<string, any[]> = {};
  COLUMNS.forEach((c) => (grouped[c.key] = []));
  (data?.events ?? []).forEach((e: any) => {
    if (grouped[e.status]) grouped[e.status].push(e);
  });

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Vetting queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review submitted events and approve, reject, or send back for revisions.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-10 flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="mt-8 grid gap-4 xl:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
          {COLUMNS.map((c) => (
            <div key={c.key} className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{c.label}</span>
                <span className="rounded-full bg-card px-2 py-0.5">{grouped[c.key].length}</span>
              </div>
              <div className="space-y-2">
                {grouped[c.key].map((e) => (
                  <button
                    type="button"
                    key={e.id}
                    onClick={() => setOpen(e.id)}
                    className="block w-full rounded-lg border border-border bg-card p-3 text-left text-sm hover:border-primary"
                  >
                    <div className="font-semibold">{e.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {[e.event_type, e.city, e.country].filter(Boolean).join(" · ") || "—"}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{e.organiser_email}</div>
                  </button>
                ))}
                {grouped[c.key].length === 0 && (
                  <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Empty</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <VettingDrawer id={open} onClose={() => setOpen(null)} />}
    </AppShell>
  );
}

function VettingDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const fetchOne = useServerFn(getEventForAdmin);
  const setStatus = useServerFn(setEventVettingStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "event", id],
    queryFn: () => fetchOne({ data: { id } }),
  });
  const [note, setNote] = useState("");

  const transition = useMutation({
    mutationFn: (to: string) => setStatus({ data: { id, to_status: to as any, note: note || null } }),
    onSuccess: (_res, to) => {
      toast.success(`Moved to ${to.replace(/_/g, " ")}`);
      qc.invalidateQueries({ queryKey: ["admin", "vetting"] });
      qc.invalidateQueries({ queryKey: ["admin", "event", id] });
      setNote("");
      if (to === "approved" || to === "rejected" || to === "listed") onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">× Close</button>
          {data && <StatusBadge status={data.event.status} />}
        </div>
        {isLoading || !data ? (
          <div className="mt-6 flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading event…</div>
        ) : (
          <>
            <h2 className="mt-4 font-display text-2xl font-bold">{data.event.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{data.organiser?.email}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <Info label="Type" value={data.event.event_type} />
              <Info label="Format" value={data.event.format} />
              <Info label="Start" value={data.event.start_date} />
              <Info label="End" value={data.event.end_date} />
              <Info label="Location" value={[data.event.city, data.event.country].filter(Boolean).join(", ")} />
              <Info label="Attendance" value={data.event.attendance_size} />
              <Info label="Primary sector" value={data.event.primary_sector} />
              <Info label="Min spend" value={data.event.min_sponsorship_spend ? `${data.event.currency} ${Number(data.event.min_sponsorship_spend).toLocaleString()}` : "—"} />
            </dl>

            <div className="mt-5 space-y-1.5 text-sm">
              <AssetLink label="Sponsorship deck" url={data.event.sponsorship_deck_url} />
              <AssetLink label="Banner image" url={data.event.banner_image_url} />
              <AssetLink label="Floor plan" url={data.event.floor_plan_url} />
              <AssetLink label="Event website" url={data.event.website} />
            </div>

            <div className="mt-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiers ({data.tiers.length})</div>
              <div className="space-y-1.5">
                {data.tiers.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between rounded-md border border-border bg-card p-2 text-sm">
                    <span className="font-semibold">{t.tier_name}</span>
                    <span className="text-xs text-muted-foreground">{t.currency} {Number(t.price).toLocaleString()} · {t.slots_total} slot(s)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note to organiser (for revisions / rejection)</span>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.event.status === "submitted" && (
                  <ActionBtn onClick={() => transition.mutate("under_review")} variant="primary" icon={ArrowRight} label="Start review" pending={transition.isPending} />
                )}
                {data.event.status === "under_review" && (
                  <>
                    <ActionBtn onClick={() => transition.mutate("approved")} variant="success" icon={CheckCircle2} label="Approve" pending={transition.isPending} />
                    <ActionBtn onClick={() => transition.mutate("revision_requested")} variant="warning" icon={Pencil} label="Request revision" pending={transition.isPending} />
                    <ActionBtn onClick={() => transition.mutate("rejected")} variant="danger" icon={XCircle} label="Reject" pending={transition.isPending} />
                  </>
                )}
                {data.event.status === "approved" && (
                  <ActionBtn onClick={() => transition.mutate("listed")} variant="primary" icon={ArrowRight} label="List publicly" pending={transition.isPending} />
                )}
              </div>
              <Link to="/events/$id" params={{ id }} className="mt-4 inline-block text-xs text-primary hover:underline">View full event editor →</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value ?? "—"}</dd>
    </div>
  );
}
function AssetLink({ label, url }: { label: string; url?: string | null }) {
  if (!url) return <div className="text-xs text-muted-foreground">{label}: <span className="italic">not provided</span></div>;
  return <a href={url} target="_blank" rel="noreferrer" className="block truncate text-sm text-primary hover:underline">{label} ↗</a>;
}
function ActionBtn({ onClick, variant, icon: Icon, label, pending }: any) {
  const cls = variant === "primary" ? "bg-brand-gradient text-white"
    : variant === "success" ? "bg-secondary text-secondary-foreground"
    : variant === "warning" ? "bg-amber-500 text-white"
    : "bg-destructive text-destructive-foreground";
  return (
    <button disabled={pending} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-50 ${cls}`}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />} {label}
    </button>
  );
}
