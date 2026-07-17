import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPanel,
  DashboardTable,
  DashboardTableHead,
  DashboardTabs,
} from "@/components/dashboards/dashboard-shell";
import { DashboardDataToolbar } from "@/components/dashboards/dashboard-data-toolbar";
import { DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { StatusPill } from "@/components/dashboards/shared";
import { useTableFilters } from "@/hooks/use-table-filters";
import { datedCsvFilename, downloadCsv } from "@/lib/csv-export";
import {
  listAccountComplaints,
  replyAccountComplaint,
  updateAccountComplaintStatus,
} from "@/lib/complaints.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type AccountComplaintRow = {
  id: string;
  created_at: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
  message: string;
  status: string;
  admin_reply?: string | null;
  replied_at?: string | null;
  replied_by?: string | null;
};

export function AdminComplaintsPanel() {
  const qc = useQueryClient();
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintStatus, setComplaintStatus] = useState("all");
  const [selected, setSelected] = useState<AccountComplaintRow | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchComplaints = useServerFn(listAccountComplaints);
  const updateComplaint = useServerFn(updateAccountComplaintStatus);
  const sendReply = useServerFn(replyAccountComplaint);

  const complaints = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: () => fetchComplaints(),
  });

  const complaintRows = (complaints.data?.complaints ?? []) as AccountComplaintRow[];

  const filteredComplaints = useTableFilters({
    rows: complaintRows,
    searchText: complaintSearch,
    statusFilter: complaintStatus,
    search: (r) => [r.display_name, r.email, r.role, r.message, r.admin_reply].filter(Boolean).join(" "),
    matchStatus: (r, filter) => r.status === filter,
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "new" | "read" | "resolved" }) => updateComplaint({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-complaints"] });
      qc.invalidateQueries({ queryKey: ["admin-complaints-count"] });
      toast.success("Complaint updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const replyMut = useMutation({
    mutationFn: (v: { id: string; reply: string }) => sendReply({ data: { id: v.id, reply: v.reply } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-complaints"] });
      qc.invalidateQueries({ queryKey: ["admin-complaints-count"] });
      toast.success("Reply sent by email");
      setSelected(null);
      setReplyText("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!selected || selected.status !== "new") return;
    void updateComplaint({ data: { id: selected.id, status: "read" } }).then(() => {
      qc.invalidateQueries({ queryKey: ["admin-complaints"] });
      qc.invalidateQueries({ queryKey: ["admin-complaints-count"] });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    setReplyText(selected.admin_reply ?? "");
  }, [selected]);

  function openComplaint(row: AccountComplaintRow) {
    setSelected(row);
  }

  return (
    <>
      <DashboardTabs
        tabs={[
          { id: "all", label: "All", count: complaintRows.length },
          { id: "new", label: "New", count: complaintRows.filter((r) => r.status === "new").length },
          { id: "read", label: "Read", count: complaintRows.filter((r) => r.status === "read").length },
          { id: "resolved", label: "Resolved", count: complaintRows.filter((r) => r.status === "resolved").length },
        ]}
        active={complaintStatus}
        onChange={setComplaintStatus}
      />

      {complaints.isLoading ? (
        <DashboardTableSkeleton rows={6} cols={6} />
      ) : !complaintRows.length ? (
        <div className="p-8 text-center text-muted-foreground">No account complaints yet.</div>
      ) : (
        <DashboardPanel title="Account complaints" bodyClassName="p-0">
          <DashboardDataToolbar
            search={complaintSearch}
            onSearchChange={setComplaintSearch}
            searchPlaceholder="Search name, email, role, message…"
            onExport={() =>
              downloadCsv(
                datedCsvFilename("ige-complaints"),
                ["created_at", "display_name", "email", "role", "message", "status", "admin_reply"],
                filteredComplaints.map((r) => [
                  r.created_at,
                  r.display_name ?? "",
                  r.email,
                  r.role,
                  r.message,
                  r.status,
                  r.admin_reply ?? "",
                ]),
              )
            }
            exportDisabled={!filteredComplaints.length}
            exportCount={filteredComplaints.length}
          />
          <DashboardTable>
            <DashboardTableHead>
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {filteredComplaints.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer transition-colors hover:bg-muted/20"
                  onClick={() => openComplaint(r)}
                >
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{r.display_name ?? r.email.split("@")[0]}</div>
                    <span className="text-xs text-muted-foreground">{r.email}</span>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-muted-foreground">{r.role.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 max-w-md text-sm text-muted-foreground line-clamp-2">{r.message}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openComplaint(r);
                      }}
                      className="rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
                    >
                      View & reply
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredComplaints.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No complaints match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </DashboardTable>
        </DashboardPanel>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Account complaint</DialogTitle>
                <DialogDescription>
                  From {selected.display_name ?? selected.email.split("@")[0]} ·{" "}
                  {selected.role.replace(/_/g, " ")} · {new Date(selected.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</div>
                  <a href={`mailto:${selected.email}`} className="text-primary hover:underline">
                    {selected.email}
                  </a>
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    User message
                  </div>
                  <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-foreground">
                    {selected.message}
                  </p>
                </div>
                {selected.admin_reply && selected.replied_at ? (
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Previous reply · {new Date(selected.replied_at).toLocaleString()}
                    </div>
                    <p className="whitespace-pre-wrap rounded-lg border border-primary/20 bg-brand-soft/40 p-3 text-foreground">
                      {selected.admin_reply}
                    </p>
                  </div>
                ) : null}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Your reply (emailed to user)
                  </label>
                  <textarea
                    rows={5}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your response to the user…"
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                {selected.status !== "resolved" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={statusMut.isPending}
                    onClick={() => {
                      statusMut.mutate({ id: selected.id, status: "resolved" });
                      setSelected(null);
                    }}
                  >
                    Mark resolved
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={replyMut.isPending || replyText.trim().length < 10}
                  className="bg-brand-gradient text-white"
                  onClick={() => replyMut.mutate({ id: selected.id, reply: replyText.trim() })}
                >
                  {replyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reply"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
