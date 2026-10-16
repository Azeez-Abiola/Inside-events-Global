import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Download, Plus, Trash2 } from "lucide-react";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { downloadXlsx } from "@/lib/xlsx-export";
import { fmtMoney } from "@/lib/currency";
import {
  completeFollowUp,
  deleteCommission,
  upsertCommission,
  type CrmCommission,
  type CrmContact,
  type CrmDeal,
  type CrmOutreach,
} from "@/lib/crm.functions";
import { PaginatedTable } from "@/components/paginated-table";

const today = () => new Date().toISOString().slice(0, 10);

/** Outreach Tracker (§4.4.2): every touch, its outcome and the next follow-up. */
export function OutreachPanel({
  outreach,
  contactById,
  editable,
  onChanged,
}: {
  outreach: CrmOutreach[];
  contactById: Map<string, CrmContact>;
  editable: boolean;
  onChanged: () => void;
}) {
  const complete = useServerFn(completeFollowUp);
  const t = today();
  const due = outreach
    .filter((o) => o.next_follow_up)
    .sort((a, b) => (a.next_follow_up ?? "").localeCompare(b.next_follow_up ?? ""));
  const name = (id: string | null) => (id ? (contactById.get(id)?.full_name ?? "—") : "—");

  return (
    <div className="space-y-6">
      <DashboardPanel
        title="Follow-ups"
        description="Open follow-ups, soonest first. Overdue ones are red."
        action={<InfoTip tip="crm.outreach" />}
      >
        {due.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No follow-ups pending. Set a next follow-up when you log outreach on a contact.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {due.map((o) => {
              const late = (o.next_follow_up ?? "") < t;
              return (
                <li key={o.id} className="flex items-center gap-3 px-1 py-2.5 text-sm">
                  <span
                    className={`w-24 shrink-0 tabular-nums ${late ? "font-semibold text-destructive" : o.next_follow_up === t ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {o.next_follow_up === t
                      ? "Today"
                      : new Date(o.next_follow_up!).toLocaleDateString()}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-foreground">{name(o.contact_id)}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · last {o.channel}
                      {o.outcome ? ` — ${o.outcome}` : ""}
                    </span>
                  </span>
                  {editable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        complete({ data: { id: o.id } })
                          .then(onChanged)
                          .catch((e: Error) => toast.error(e.message))
                      }
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Done
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Outreach log"
        description="Every email, call, WhatsApp, meeting and event touch."
        action={
          <Button
            size="sm"
            variant="ghost"
            disabled={!outreach.length}
            onClick={() =>
              downloadXlsx(`outreach-${t}`, [
                {
                  name: "Outreach",
                  headers: ["Date", "Contact", "Channel", "Outcome", "Notes", "Next follow-up"],
                  rows: outreach.map((o) => [
                    o.occurred_at.slice(0, 10),
                    name(o.contact_id),
                    o.channel,
                    o.outcome ?? "",
                    o.notes ?? "",
                    o.next_follow_up ?? "",
                  ]),
                },
              ])
            }
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Excel
          </Button>
        }
        bodyClassName="p-0"
      >
        {outreach.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nothing logged yet. Open a contact and log a touch.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <PaginatedTable className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Contact</th>
                  <th className="px-3 py-2 font-medium">Channel</th>
                  <th className="px-5 py-2 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {outreach.slice(0, 200).map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-2 tabular-nums text-muted-foreground">
                      {new Date(o.occurred_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-foreground">{name(o.contact_id)}</td>
                    <td className="px-3 py-2 capitalize text-muted-foreground">{o.channel}</td>
                    <td className="px-5 py-2 text-muted-foreground">
                      {o.outcome ?? o.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </PaginatedTable>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}

/** Commission Tracker (§4.4.2): expected and earned per deal, any currency, paid or not. */
export function CommissionPanel({
  commissions,
  deals,
  contactById,
  editable,
  onChanged,
}: {
  commissions: CrmCommission[];
  deals: CrmDeal[];
  contactById: Map<string, CrmContact>;
  editable: boolean;
  onChanged: () => void;
}) {
  const save = useServerFn(upsertCommission);
  const remove = useServerFn(deleteCommission);
  const [form, setForm] = useState({
    deal_id: "",
    expected: "",
    earned: "",
    currency: "NGN",
    notes: "",
  });
  const [adding, setAdding] = useState(false);

  const add = useMutation({
    mutationFn: () => {
      const deal = deals.find((d) => d.id === form.deal_id);
      return save({
        data: {
          deal_id: form.deal_id || null,
          contact_id: deal?.contact_id ?? null,
          expected_amount: form.expected ? Number(form.expected) : null,
          earned_amount: form.earned ? Number(form.earned) : null,
          currency: form.currency,
          status: "unpaid",
          notes: form.notes.trim() || undefined,
        },
      });
    },
    onSuccess: () => {
      setForm({ deal_id: "", expected: "", earned: "", currency: form.currency, notes: "" });
      setAdding(false);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dealTitle = (id: string | null) => deals.find((d) => d.id === id)?.title ?? "—";
  // Per currency — never one blended total.
  const totals = commissions.reduce<
    Record<string, { expected: number; earned: number; paid: number }>
  >((acc, c) => {
    const t = (acc[c.currency] ??= { expected: 0, earned: 0, paid: 0 });
    t.expected += c.expected_amount ?? 0;
    t.earned += c.earned_amount ?? 0;
    if (c.status === "paid") t.paid += c.earned_amount ?? c.expected_amount ?? 0;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.keys(totals).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(totals).map(([c, t]) => (
            <div key={c} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{c} commission</p>
              <p className="bg-brand-gradient bg-clip-text font-display text-2xl font-bold tabular-nums text-transparent">
                {fmtMoney(c, t.earned || t.expected)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {fmtMoney(c, t.expected)} expected · {fmtMoney(c, t.paid)} paid ·{" "}
                {fmtMoney(c, Math.max(0, t.earned - t.paid))} owed
              </p>
            </div>
          ))}
        </div>
      )}

      <DashboardPanel
        title="Commission tracker"
        description="Expected and earned commission per deal, with paid and unpaid status."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={!commissions.length}
              onClick={() =>
                downloadXlsx(`commission-${today()}`, [
                  {
                    name: "Commission",
                    headers: [
                      "Deal",
                      "Contact",
                      "Expected",
                      "Earned",
                      "Currency",
                      "Status",
                      "Paid on",
                      "Notes",
                    ],
                    rows: commissions.map((c) => [
                      dealTitle(c.deal_id),
                      c.contact_id ? (contactById.get(c.contact_id)?.full_name ?? "") : "",
                      c.expected_amount,
                      c.earned_amount,
                      c.currency,
                      c.status,
                      c.paid_at?.slice(0, 10) ?? "",
                      c.notes ?? "",
                    ]),
                  },
                ])
              }
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Excel
            </Button>
            {editable && (
              <Button size="sm" onClick={() => setAdding((v) => !v)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add
              </Button>
            )}
            <InfoTip tip="crm.commission" />
          </div>
        }
        bodyClassName="p-0"
      >
        {adding && (
          <div className="grid gap-2 border-b border-border bg-muted/20 p-4 sm:grid-cols-6">
            <select
              value={form.deal_id}
              onChange={(e) => setForm({ ...form, deal_id: e.target.value })}
              aria-label="Deal"
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs sm:col-span-2"
            >
              <option value="">No particular deal</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              aria-label="Currency"
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            >
              {["NGN", "USD", "GBP", "EUR", "GHS", "KES", "ZAR", "EGP", "AED", "SAR", "QAR"].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
            <input
              type="number"
              min={0}
              placeholder="Expected"
              value={form.expected}
              onChange={(e) => setForm({ ...form, expected: e.target.value })}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            />
            <input
              type="number"
              min={0}
              placeholder="Earned"
              value={form.earned}
              onChange={(e) => setForm({ ...form, earned: e.target.value })}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            />
            <Button
              size="sm"
              disabled={(!form.expected && !form.earned) || add.isPending}
              onClick={() => add.mutate()}
            >
              Save
            </Button>
          </div>
        )}
        {commissions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No commission recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {commissions.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {dealTitle(c.deal_id)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {c.contact_id ? contactById.get(c.contact_id)?.full_name : "—"}
                    {c.notes ? ` · ${c.notes}` : ""}
                  </span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {c.expected_amount != null && `exp. ${fmtMoney(c.currency, c.expected_amount)}`}
                </span>
                <span className="tabular-nums text-foreground">
                  {c.earned_amount != null && fmtMoney(c.currency, c.earned_amount)}
                </span>
                {editable ? (
                  <button
                    type="button"
                    onClick={() =>
                      save({
                        data: {
                          id: c.id,
                          deal_id: c.deal_id,
                          contact_id: c.contact_id,
                          expected_amount: c.expected_amount,
                          earned_amount: c.earned_amount,
                          currency: c.currency,
                          status: c.status === "paid" ? "unpaid" : "paid",
                          notes: c.notes ?? undefined,
                        },
                      })
                        .then(onChanged)
                        .catch((e: Error) => toast.error(e.message))
                    }
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.status === "paid" ? "bg-secondary/15 text-secondary-deep" : "bg-amber-500/15 text-amber-700 dark:text-amber-300"}`}
                  >
                    {c.status === "paid" ? "Paid" : "Unpaid"}
                  </button>
                ) : (
                  <span className="text-[11px] capitalize text-muted-foreground">{c.status}</span>
                )}
                {editable && (
                  <button
                    type="button"
                    aria-label="Delete commission"
                    onClick={() => {
                      if (confirm("Delete this commission record?")) {
                        remove({ data: { id: c.id } })
                          .then(onChanged)
                          .catch((e: Error) => toast.error(e.message));
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </DashboardPanel>
    </div>
  );
}
