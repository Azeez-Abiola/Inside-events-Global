import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { downloadXlsx } from "@/lib/xlsx-export";
import { fmtMoney } from "@/lib/currency";
import {
  ITEM_STATUSES,
  adminComplianceQueues,
  adminResolveFlag,
  deleteDeliverable,
  getDeliverableMatrix,
  requestApproval,
  respondApproval,
  upsertDeliverable,
  type DeliverableItem,
  type MatrixDeal,
} from "@/lib/deliverables.functions";

const STATUS_STYLE: Record<string, string> = {
  promised: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary-deep",
  delivered: "bg-secondary/15 text-secondary-deep",
  changed: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  missed: "bg-destructive/10 text-destructive",
};
const pretty = (s: string) => s.replace(/_/g, " ");

function ItemRow({ item, onChanged }: { item: DeliverableItem; onChanged: () => void }) {
  const save = useServerFn(upsertDeliverable);
  const remove = useServerFn(deleteDeliverable);
  const [proof, setProof] = useState(item.proof_url ?? "");
  const setStatus = (status: DeliverableItem["status"]) =>
    save({
      data: {
        id: item.id,
        deal_id: item.deal_id,
        asset_type: item.asset_type,
        quantity: item.quantity,
        placement_channel: item.placement_channel ?? undefined,
        due_date: item.due_date,
        owner_side: item.owner_side,
        owner_name: item.owner_name ?? undefined,
        status,
        proof_url: proof.trim(),
        notes: item.notes ?? undefined,
      },
    })
      .then(onChanged)
      .catch((e: Error) => toast.error(e.message));
  const overdue =
    item.due_date &&
    item.status !== "delivered" &&
    item.due_date < new Date().toISOString().slice(0, 10);
  return (
    <tr className="border-b border-border last:border-0 align-top">
      <td className="px-4 py-2.5">
        <p className="font-medium text-foreground">
          {item.quantity > 1 && `${item.quantity} × `}
          {item.asset_type}
        </p>
        <p className="text-xs text-muted-foreground">{item.placement_channel ?? "—"}</p>
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">
        {item.owner_side === "organiser" ? "Organiser" : "Sponsor"}
        {item.owner_name && ` · ${item.owner_name}`}
      </td>
      <td
        className={`px-3 py-2.5 text-xs tabular-nums ${overdue ? "font-semibold text-destructive" : "text-muted-foreground"}`}
      >
        {item.due_date ? new Date(item.due_date).toLocaleDateString() : "—"}
      </td>
      <td className="px-3 py-2.5">
        <select
          value={item.status}
          onChange={(e) => setStatus(e.target.value as DeliverableItem["status"])}
          aria-label="Status"
          className={`rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[item.status]}`}
        >
          {ITEM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {pretty(s)}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <input
            type="url"
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            onBlur={() => proof !== (item.proof_url ?? "") && setStatus(item.status)}
            placeholder="Proof link"
            className="w-40 rounded border border-border bg-background px-2 py-1 text-xs"
          />
          {item.proof_url && (
            <a
              href={item.proof_url}
              target="_blank"
              rel="noreferrer"
              aria-label="Open proof"
              className="text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5 text-right">
        <button
          type="button"
          aria-label={`Delete ${item.asset_type}`}
          onClick={() => remove({ data: { id: item.id, deal_id: item.deal_id } }).then(onChanged)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

function AddItem({ deal, onChanged }: { deal: MatrixDeal; onChanged: () => void }) {
  const save = useServerFn(upsertDeliverable);
  const [f, setF] = useState({
    asset: "",
    qty: "1",
    channel: "",
    due: "",
    side: "organiser" as "organiser" | "sponsor",
  });
  return (
    <div className="grid gap-2 border-t border-border bg-muted/20 p-3 sm:grid-cols-6">
      <input
        placeholder="Asset (e.g. Logo on stage backdrop)"
        value={f.asset}
        onChange={(e) => setF({ ...f, asset: e.target.value })}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs sm:col-span-2"
      />
      <input
        type="number"
        min={1}
        value={f.qty}
        onChange={(e) => setF({ ...f, qty: e.target.value })}
        aria-label="Quantity"
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
      />
      <input
        placeholder="Placement / channel"
        value={f.channel}
        onChange={(e) => setF({ ...f, channel: e.target.value })}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
      />
      <input
        type="date"
        value={f.due}
        onChange={(e) => setF({ ...f, due: e.target.value })}
        aria-label="Due"
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
      />
      <div className="flex gap-2">
        <select
          value={f.side}
          onChange={(e) => setF({ ...f, side: e.target.value as typeof f.side })}
          aria-label="Who delivers"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
        >
          <option value="organiser">Organiser</option>
          <option value="sponsor">Sponsor</option>
        </select>
        <Button
          size="sm"
          disabled={!f.asset.trim()}
          onClick={() =>
            save({
              data: {
                deal_id: deal.id,
                asset_type: f.asset.trim(),
                quantity: Number(f.qty) || 1,
                placement_channel: f.channel.trim() || undefined,
                due_date: f.due || null,
                owner_side: f.side,
              },
            })
              .then(() => {
                setF({ ...f, asset: "", channel: "", due: "" });
                onChanged();
              })
              .catch((e: Error) => toast.error(e.message))
          }
          aria-label="Add line"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/** Deliverable Matrix & Contract Compliance (TAB 4 §4.1 Module 5). */
export function DeliverablesPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getDeliverableMatrix);
  const ask = useServerFn(requestApproval);
  const respond = useServerFn(respondApproval);
  const { data, isLoading } = useQuery({ queryKey: ["deliverables"], queryFn: () => fetchAll() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["deliverables"] });
  const [approvalFor, setApprovalFor] = useState<string | null>(null);
  const [appr, setAppr] = useState({ title: "", url: "" });
  const askMut = useMutation({
    mutationFn: (dealId: string) =>
      ask({ data: { deal_id: dealId, title: appr.title.trim(), content_url: appr.url.trim() } }),
    onSuccess: () => {
      toast.success("Sent for approval — 5 business days before it escalates.");
      setApprovalFor(null);
      setAppr({ title: "", url: "" });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <WorkspacePage title="Deliverable Matrix">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WorkspacePage>
    );
  }
  const deals = data?.deals ?? [];

  const exportFulfilment = (deal: MatrixDeal) => {
    const items = (data?.items ?? []).filter((i) => i.deal_id === deal.id);
    const delivered = items.filter((i) => i.status === "delivered").length;
    downloadXlsx(`fulfilment-report-${deal.event_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, [
      {
        name: "Fulfilment",
        preamble: [
          "Fulfilment Report",
          `${deal.event_name} · ${deal.counterpart}`,
          `${delivered} of ${items.length} lines delivered with proof`,
        ],
        headers: [
          "Asset",
          "Quantity",
          "Placement / channel",
          "Due",
          "Delivered by",
          "Status",
          "Proof",
        ],
        rows: items.map((i) => [
          i.asset_type,
          i.quantity,
          i.placement_channel ?? "",
          i.due_date ?? "",
          i.owner_side,
          pretty(i.status),
          i.proof_url ?? "",
        ]),
      },
    ]);
  };

  return (
    <WorkspacePage
      title="Deliverable Matrix"
      subtitle="What was promised on each sponsorship, who delivers it, and the proof that it happened."
    >
      {deals.length === 0 ? (
        <DashboardPanel title="No live deals yet">
          <p className="text-sm text-muted-foreground">
            Once a sponsorship is in negotiation or signed, its deliverables are tracked here — the
            record every renewal conversation is built on.
          </p>
        </DashboardPanel>
      ) : (
        deals.map((deal) => {
          const items = (data?.items ?? []).filter((i) => i.deal_id === deal.id);
          const approvals = (data?.approvals ?? []).filter((a) => a.deal_id === deal.id);
          const flags = (data?.flags ?? []).filter(
            (f) => f.deal_id === deal.id || f.conflicting_deal_id === deal.id,
          );
          const delivered = items.filter((i) => i.status === "delivered").length;
          return (
            <DashboardPanel
              key={deal.id}
              title={`${deal.event_name} · ${deal.counterpart}`}
              description={`${pretty(deal.status)}${deal.value != null && deal.currency ? ` · ${fmtMoney(deal.currency, deal.value)}` : ""} · ${delivered}/${items.length} delivered`}
              action={
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!items.length}
                    onClick={() => exportFulfilment(deal)}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Fulfilment report
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setApprovalFor(approvalFor === deal.id ? null : deal.id)}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Send for approval
                  </Button>
                  <InfoTip tip="deliverables.matrix" />
                </div>
              }
              bodyClassName="p-0"
            >
              {flags.length > 0 && (
                <p className="flex items-start gap-2 border-b border-border bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Category exclusivity: another live sponsorship on this event is also in{" "}
                  {flags[0].declared_category}. IGE has been alerted. Check the exclusivity terms
                  before committing.
                </p>
              )}
              {approvalFor === deal.id && (
                <div className="flex flex-wrap gap-2 border-b border-border bg-muted/20 p-3">
                  <input
                    placeholder="What needs approving (e.g. Press release draft)"
                    value={appr.title}
                    onChange={(e) => setAppr({ ...appr, title: e.target.value })}
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                  />
                  <input
                    type="url"
                    placeholder="Link to the content"
                    value={appr.url}
                    onChange={(e) => setAppr({ ...appr, url: e.target.value })}
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                  />
                  <Button
                    size="sm"
                    disabled={!appr.title.trim() || !appr.url.trim() || askMut.isPending}
                    onClick={() => askMut.mutate(deal.id)}
                  >
                    Send
                  </Button>
                </div>
              )}
              {approvals.length > 0 && (
                <ul className="divide-y divide-border border-b border-border text-xs">
                  {approvals.map((a) => {
                    const mine = a.approver_side === deal.my_side;
                    return (
                      <li key={a.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
                        <span className="font-medium text-foreground">{a.title}</span>
                        <a
                          href={a.content_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          open
                        </a>
                        <span className="text-muted-foreground">
                          · due {new Date(a.turnaround_due_at).toLocaleDateString()}
                        </span>
                        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 capitalize">
                          {pretty(a.status)}
                        </span>
                        {mine && a.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                respond({ data: { id: a.id, decision: "approved" } }).then(refresh)
                              }
                            >
                              <Check className="mr-1 h-3 w-3" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const note = prompt("What needs to change?") ?? "";
                                if (note.trim())
                                  respond({
                                    data: { id: a.id, decision: "changes_requested", note },
                                  }).then(refresh);
                              }}
                            >
                              Request changes
                            </Button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Asset</th>
                      <th className="px-3 py-2 font-medium">Delivered by</th>
                      <th className="px-3 py-2 font-medium">Due</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Proof</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <ItemRow key={i.id} item={i} onChanged={refresh} />
                    ))}
                    {!items.length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-xs text-muted-foreground"
                        >
                          Add each promised asset from the signed agreement.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <AddItem deal={deal} onChanged={refresh} />
            </DashboardPanel>
          );
        })
      )}
    </WorkspacePage>
  );
}

/** Admin: exclusivity conflicts and escalated approvals (TAB 6 §6.4). */
export function CompliancePage() {
  const qc = useQueryClient();
  const fetchQueues = useServerFn(adminComplianceQueues);
  const resolve = useServerFn(adminResolveFlag);
  const { data, isLoading } = useQuery({ queryKey: ["compliance"], queryFn: () => fetchQueues() });
  return (
    <WorkspacePage
      title="Deal compliance"
      subtitle="Exclusivity conflicts and approvals that blew past their window."
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <DashboardPanel title="Exclusivity conflict queue">
            {!data?.flags.length ? (
              <p className="text-sm text-muted-foreground">No open conflicts.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.flags.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="flex-1">
                      <span className="font-medium text-foreground">{f.event_name}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · two live deals in {f.declared_category}
                      </span>
                    </span>
                    {(["resolved", "dismissed"] as const).map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={r === "resolved" ? "default" : "ghost"}
                        onClick={() =>
                          resolve({
                            data: {
                              id: f.id,
                              resolution: r,
                              note: prompt("Note (optional)") ?? undefined,
                            },
                          }).then(() => qc.invalidateQueries({ queryKey: ["compliance"] }))
                        }
                      >
                        {r === "resolved" ? "Mark resolved" : "Dismiss"}
                      </Button>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>
          <DashboardPanel title="Escalated approvals">
            {!data?.escalated.length ? (
              <p className="text-sm text-muted-foreground">Nothing escalated.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.escalated.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="flex-1 font-medium text-foreground">{a.title}</span>
                    <span className="text-xs text-muted-foreground">
                      waiting on the {a.approver_side} since{" "}
                      {new Date(a.turnaround_due_at).toLocaleDateString()}
                    </span>
                    <a
                      href={a.content_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Open content
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>
        </>
      )}
    </WorkspacePage>
  );
}
