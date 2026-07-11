import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Newspaper } from "lucide-react";
import { adminListMediaRequests, adminUpdateMediaRequestStatus } from "@/lib/media.functions";
import { DashboardPanel, DashboardTable, DashboardTableHead } from "@/components/dashboards/dashboard-shell";
import { StatusPill } from "@/components/dashboards/shared";
import { Button } from "@/components/ui/button";

export function AdminMediaRequestsPanel() {
  const qc = useQueryClient();
  const fetch = useServerFn(adminListMediaRequests);
  const updateStatus = useServerFn(adminUpdateMediaRequestStatus);

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

  return (
    <DashboardPanel
      title="Media coverage requests"
      description="Review and approve press credentials and coverage requests from media partners."
      bodyClassName="p-0"
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !requests.length ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
          <Newspaper className="h-8 w-8 opacity-40" />
          <p className="text-sm">No media requests yet.</p>
        </div>
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
            {requests.map((r: any) => {
              const ev = data?.events?.[r.event_id];
              const partner = data?.partners?.[r.media_partner_id];
              return (
                <tr key={r.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3 font-semibold text-foreground">{ev?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>{partner?.outlet_name ?? partner?.display_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{partner?.email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-sm">{String(r.request_type).replace(/_/g, " ")}</td>
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
                      <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DashboardTable>
      )}
    </DashboardPanel>
  );
}
