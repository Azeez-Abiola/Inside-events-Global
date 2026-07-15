import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Newspaper } from "lucide-react";
import { adminListMediaRequests, adminUpdateMediaRequestStatus } from "@/lib/media.functions";
import { DashboardPanel, DashboardTable, DashboardTableHead, DashboardTabs } from "@/components/dashboards/dashboard-shell";
import { DashboardDataToolbar } from "@/components/dashboards/dashboard-data-toolbar";
import { DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { StatusPill } from "@/components/dashboards/shared";
import { Button } from "@/components/ui/button";
import { useTableFilters } from "@/hooks/use-table-filters";
import { datedCsvFilename, downloadCsv } from "@/lib/csv-export";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "declined", label: "Declined" },
  { id: "completed", label: "Completed" },
] as const;

type StatusFilter = (typeof STATUS_TABS)[number]["id"];

export function AdminMediaRequestsPanel() {
  const qc = useQueryClient();
  const fetch = useServerFn(adminListMediaRequests);
  const updateStatus = useServerFn(adminUpdateMediaRequestStatus);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-media-requests"],
    queryFn: () => fetch(),
  });

  const mut = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "declined" | "completed" }) =>
      updateStatus({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-media-requests"] });
      toast.success("Request updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requests = data?.requests ?? [];

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: requests.length,
      pending: 0,
      approved: 0,
      declined: 0,
      completed: 0,
    };
    for (const r of requests) {
      const s = r.status as Exclude<StatusFilter, "all">;
      if (s in base) base[s]++;
    }
    return base;
  }, [requests]);

  const filtered = useTableFilters({
    rows: requests,
    searchText: search,
    statusFilter,
    search: (r) => {
      const ev = data?.events?.[r.event_id];
      const partner = data?.partners?.[r.media_partner_id];
      return [ev?.name, partner?.outlet_name, partner?.display_name, partner?.email, r.request_type, r.message]
        .filter(Boolean)
        .join(" ");
    },
    matchStatus: (r, filter) => r.status === filter,
  });

  const exportCsv = () => {
    downloadCsv(
      datedCsvFilename("ige-media-requests"),
      ["event", "partner", "email", "type", "message", "status", "submitted"],
      filtered.map((r) => {
        const ev = data?.events?.[r.event_id];
        const partner = data?.partners?.[r.media_partner_id];
        return [
          ev?.name ?? "",
          partner?.outlet_name ?? partner?.display_name ?? "",
          partner?.email ?? "",
          r.request_type,
          r.message ?? "",
          r.status,
          r.created_at,
        ];
      }),
    );
  };

  return (
    <div className="space-y-6">
      <DashboardTabs
        tabs={STATUS_TABS.map((t) => ({ id: t.id, label: t.label, count: counts[t.id] }))}
        active={statusFilter}
        onChange={(id) => setStatusFilter(id as StatusFilter)}
      />

      <DashboardPanel
        title="Media coverage requests"
        description="Review and approve press credentials and coverage requests from media partners."
        bodyClassName="p-0"
      >
        <DashboardDataToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search event, partner, type…"
          onExport={exportCsv}
          exportDisabled={!filtered.length}
          exportCount={filtered.length}
        />
        {isLoading ? (
          <DashboardTableSkeleton rows={6} cols={7} />
        ) : !requests.length ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
            <Newspaper className="h-8 w-8 opacity-40" />
            <p className="text-sm">No media requests yet.</p>
          </div>
        ) : !filtered.length ? (
          <div className="p-8 text-center text-muted-foreground">No requests match your filters.</div>
        ) : (
          <DashboardTable className="min-w-[900px]">
            <DashboardTableHead>
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((r: {
                id: string;
                event_id: string;
                media_partner_id: string;
                request_type: string;
                message: string | null;
                status: string;
                created_at: string;
              }) => {
                const ev = data?.events?.[r.event_id];
                const partner = data?.partners?.[r.media_partner_id];
                return (
                  <tr key={r.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-semibold text-foreground">{ev?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>{partner?.outlet_name ?? partner?.display_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{partner?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{String(r.request_type).replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 max-w-xs text-xs text-muted-foreground line-clamp-2">{r.message ?? "—"}</td>
                    <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {r.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" disabled={mut.isPending} onClick={() => mut.mutate({ id: r.id, status: "approved" })}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={mut.isPending} onClick={() => mut.mutate({ id: r.id, status: "declined" })}>
                            Decline
                          </Button>
                        </div>
                      ) : r.status === "approved" ? (
                        <Button size="sm" variant="outline" disabled={mut.isPending} onClick={() => mut.mutate({ id: r.id, status: "completed" })}>
                          Mark done
                        </Button>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DashboardTable>
        )}
      </DashboardPanel>
    </div>
  );
}
