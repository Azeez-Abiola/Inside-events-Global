import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ShieldCheck, Users, Pencil, Loader2, ArrowRight, CheckCircle2, XCircle, Trash2, FileEdit,
} from "lucide-react";
import { StatusBadge } from "@/components/app-shell";
import { StatCard, StatusPill } from "@/components/dashboards/shared";
import {
  DashboardPanel, DashboardTable, DashboardTableHead, DashboardTabs,
} from "@/components/dashboards/dashboard-shell";
import { DashboardDataToolbar } from "@/components/dashboards/dashboard-data-toolbar";
import { DashboardTableSkeleton, DashboardDrawerDetailSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { ImageLightbox } from "@/components/image-lightbox";
import { useTableFilters } from "@/hooks/use-table-filters";
import { datedCsvFilename, downloadCsv } from "@/lib/csv-export";
import { listEventsForVetting, setEventVettingStatus, getEventForAdmin, adminDeleteEvent } from "@/lib/admin.functions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type VettingEvent = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  event_type: string | null;
  start_date: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  organiser_id: string;
  organiser_email: string | null;
  vetting_notes: string | null;
  rejection_reason: string | null;
};

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "submitted", label: "New" },
  { id: "under_review", label: "Under review" },
  { id: "revision_requested", label: "Revision" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

type StatusFilter = (typeof STATUS_TABS)[number]["id"];

function exportVettingCsv(events: VettingEvent[]) {
  downloadCsv(
    datedCsvFilename("ige-event-queue"),
    ["submitted_at", "event", "type", "location", "organiser_email", "status", "updated_at"],
    events.map((e) => [
      new Date(e.created_at).toISOString(),
      e.name,
      e.event_type ?? "",
      [e.city, e.country].filter(Boolean).join(", "),
      e.organiser_email ?? "",
      e.status,
      new Date(e.updated_at).toISOString(),
    ]),
  );
}

export function AdminVettingPanel({ onEventClick }: { onEventClick?: (id: string) => void }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const fetchVetting = useServerFn(listEventsForVetting);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "vetting"],
    queryFn: () => fetchVetting(),
  });

  const events = (data?.events ?? []) as VettingEvent[];

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: events.length,
      submitted: 0,
      under_review: 0,
      revision_requested: 0,
      approved: 0,
      rejected: 0,
    };
    for (const e of events) {
      if (e.status in base && e.status !== "all") {
        base[e.status as Exclude<StatusFilter, "all">]++;
      }
    }
    return base;
  }, [events]);

  const filtered = useTableFilters({
    rows: events,
    searchText: search,
    statusFilter,
    search: (e) =>
      [e.name, e.event_type, e.city, e.country, e.organiser_email, e.status]
        .filter(Boolean)
        .join(" "),
    matchStatus: (e, filter) => e.status === filter,
  });

  const openEvent = (id: string) => {
    onEventClick?.(id);
    setDrawerId(id);
  };

  const inQueue = events.filter((e) =>
    ["submitted", "under_review", "revision_requested"].includes(e.status),
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={ShieldCheck} label="In queue" value={inQueue} loading={isLoading} />
        <StatCard icon={Users} label="New submissions" value={counts.submitted} loading={isLoading} />
        <StatCard icon={Pencil} label="Under review" value={counts.under_review} loading={isLoading} />
      </div>

      <DashboardTabs
        tabs={STATUS_TABS.map((t) => ({
          id: t.id,
          label: t.label,
          count: counts[t.id],
        }))}
        active={statusFilter}
        onChange={(id) => setStatusFilter(id as StatusFilter)}
      />

      <DashboardPanel
        title="Event queue"
        description="Click a row to review full details, approve, reject, or request revisions."
        bodyClassName="p-0"
      >
        <DashboardDataToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search event, location, organiser, status…"
          onExport={() => exportVettingCsv(filtered)}
          exportDisabled={!filtered.length}
          exportCount={filtered.length}
        />
        {isLoading ? (
          <DashboardTableSkeleton rows={8} cols={7} />
        ) : !filtered.length ? (
          <div className="p-8 text-center text-muted-foreground">
            {events.length ? "No events match your filters." : "No events in the vetting queue yet."}
          </div>
        ) : (
          <DashboardTable>
            <DashboardTableHead>
              <tr>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Organiser</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="cursor-pointer transition-colors hover:bg-muted/20"
                  onClick={() => openEvent(e.id)}
                >
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.name || "Untitled"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.event_type ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[e.city, e.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-primary">{e.organiser_email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={e.status} />
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                    {new Date(e.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </DashboardTable>
        )}
      </DashboardPanel>

      {drawerId && <VettingDrawer id={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  );
}

export function VettingDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const fetchOne = useServerFn(getEventForAdmin);
  const setStatus = useServerFn(setEventVettingStatus);
  const removeEvent = useServerFn(adminDeleteEvent);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "event", id],
    queryFn: () => fetchOne({ data: { id } }),
  });
  const [note, setNote] = useState("");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const transition = useMutation({
    mutationFn: (to: string) => setStatus({ data: { id, to_status: to as any, note: note || null } }),
    onSuccess: (_res, to) => {
      toast.success(`Moved to ${to.replace(/_/g, " ")}`);
      qc.invalidateQueries({ queryKey: ["admin", "vetting"] });
      qc.invalidateQueries({ queryKey: ["admin", "event", id] });
      setNote("");
      if (to === "approved" || to === "rejected" || to === "listed") onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => removeEvent({ data: { id } }),
    onSuccess: () => {
      toast.success("Event deleted");
      qc.invalidateQueries({ queryKey: ["admin", "vetting"] });
      setDeleteOpen(false);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canRevertOrDelete = data?.event && ["approved", "listed"].includes(data.event.status);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-xl flex-col justify-between overflow-y-auto border-l border-border bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              ✕ Close
            </button>
            {data && <StatusBadge status={data.event.status} />}
          </div>
          {isLoading || !data ? (
            <DashboardDrawerDetailSkeleton />
          ) : (
            <div className="mt-6 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold leading-tight text-foreground">{data.event.name}</h2>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{data.organiser?.email}</p>
              </div>

              <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border/60 bg-muted/10 px-4 py-4 text-sm">
                <InfoItem label="Type" value={data.event.event_type} />
                <InfoItem label="Format" value={data.event.format} />
                <InfoItem label="Start" value={data.event.start_date ? new Date(data.event.start_date).toLocaleDateString() : "-"} />
                <InfoItem label="End" value={data.event.end_date ? new Date(data.event.end_date).toLocaleDateString() : "-"} />
                <InfoItem label="Location" value={[data.event.city, data.event.country].filter(Boolean).join(", ")} />
                <InfoItem label="Attendance" value={data.event.attendance_size ? Number(data.event.attendance_size).toLocaleString() : "-"} />
                <InfoItem label="Primary sector" value={data.event.primary_sector} />
                <InfoItem label="Min spend" value={data.event.min_sponsorship_spend ? `${data.event.currency} ${Number(data.event.min_sponsorship_spend).toLocaleString()}` : "-"} />
              </dl>

              <div className="space-y-2 text-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event Resources</h4>
                <AssetLinkItem label="Sponsorship deck" url={data.event.sponsorship_deck_url} />
                <AssetLinkItem
                  label="Banner image"
                  url={data.event.banner_image_url}
                  previewImage
                  onPreview={setBannerPreview}
                />
                <AssetLinkItem label="Floor plan" url={data.event.floor_plan_url} />
                <AssetLinkItem label="Event website" url={data.event.website} />
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tiers ({data.tiers.length})
                </h4>
                <div className="space-y-1.5">
                  {data.tiers.map((t: { id: string; tier_name: string; currency: string; price: number; slots_total: number }) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
                      <span className="font-bold text-foreground">{t.tier_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.currency} {Number(t.price).toLocaleString()} · {t.slots_total} slots
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Action notes (required for revision/rejection)
                  </span>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter review comments here..."
                  />
                </label>
                <div className="flex flex-wrap gap-2">
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
                  {canRevertOrDelete && (
                    <>
                      <ActionBtn
                        onClick={() => {
                          if (!note.trim() && !confirm("Move this event back to draft without a note for the organiser?")) return;
                          transition.mutate("draft");
                        }}
                        variant="warning"
                        icon={FileEdit}
                        label="Move to draft"
                        pending={transition.isPending}
                      />
                      <ActionBtn
                        onClick={() => setDeleteOpen(true)}
                        variant="danger"
                        icon={Trash2}
                        label="Delete event"
                        pending={deleteMut.isPending}
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link to="/events/edit/$id" params={{ id }} className="text-xs font-semibold text-primary hover:underline">
                    View full event editor →
                  </Link>
                  {(data.event.status === "approved" || data.event.status === "listed") && data.event.slug && (
                    <Link to="/events/$slug" params={{ slug: data.event.slug }} className="text-xs font-semibold text-primary hover:underline">
                      View public listing →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ImageLightbox
        url={bannerPreview}
        title="Event banner"
        open={!!bannerPreview}
        onOpenChange={(open) => { if (!open) setBannerPreview(null); }}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes &quot;{data?.event?.name}&quot; and related tiers. The organiser will be notified.
              Events with active deals cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteMut.mutate();
              }}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? "Deleting…" : "Delete event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{value != null && value !== "" ? String(value) : "-"}</dd>
    </div>
  );
}

function AssetLinkItem({
  label,
  url,
  previewImage,
  onPreview,
}: {
  label: string;
  url?: string | null;
  previewImage?: boolean;
  onPreview?: (url: string) => void;
}) {
  if (!url) {
    return (
      <div className="text-xs text-muted-foreground">
        {label}: <span className="italic">not provided</span>
      </div>
    );
  }

  if (previewImage && onPreview) {
    return (
      <button
        type="button"
        onClick={() => onPreview(url)}
        className="block cursor-pointer truncate text-left text-sm font-bold text-primary hover:underline"
      >
        {label}
      </button>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block truncate text-sm font-bold text-primary hover:underline">
      {label} ↗
    </a>
  );
}

function ActionBtn({
  onClick,
  variant,
  icon: Icon,
  label,
  pending,
}: {
  onClick: () => void;
  variant: "primary" | "success" | "warning" | "danger";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pending: boolean;
}) {
  const cls =
    variant === "primary"
      ? "bg-brand-gradient text-white"
      : variant === "success"
        ? "bg-emerald-600 text-white hover:bg-emerald-700"
        : variant === "warning"
          ? "bg-amber-500 text-white hover:bg-amber-600"
          : "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-bold transition-all disabled:opacity-50 ${cls}`}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />} {label}
    </button>
  );
}
