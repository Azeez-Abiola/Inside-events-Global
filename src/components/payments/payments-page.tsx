import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Download, ExternalLink, FileSpreadsheet, Loader2, Plus, Star } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { PaymentDrawer } from "@/components/payments/payment-drawer";
import { VendorDrawer } from "@/components/payments/vendor-drawer";
import { useDisplayCurrency } from "@/lib/display-currency-context";
import { toUsd } from "@/lib/currency";
import { datedCsvFilename, downloadCsv } from "@/lib/csv-export";
import { downloadXlsx } from "@/lib/xlsx-export";
import { ONBOARDING_CURRENCIES } from "@/lib/onboarding-constants";
import {
  getVendorsAndPayments,
  markPaymentPaid,
  setEventBudget,
  type Payment,
  type Vendor,
} from "@/lib/vendors.functions";
import { can, type WorkspaceRole } from "@/lib/workspace-permissions";

type Tab = "payments" | "vendors" | "budget";

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-muted text-muted-foreground",
  due: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  overdue: "bg-destructive/15 text-destructive",
  paid: "bg-secondary/15 text-secondary-deep",
};

/** "NGN (₦)" → "NGN", the code the FX helpers understand. */
const code = (label: string) => label.split(" ")[0];

const native = (amount: number, currency: string) =>
  `${code(currency)} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/**
 * Vendors and Payments (TAB 4 §4.4.6).
 *
 * IGE records the money moving in and out of each event; it does not move it.
 * Media Partner and Referral Partner accounts see Payments only.
 */
export function PaymentsPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getVendorsAndPayments);
  const markPaid = useServerFn(markPaymentPaid);
  const saveBudget = useServerFn(setEventBudget);
  const { rates, fmtUsd } = useDisplayCurrency();

  const [tab, setTab] = useState<Tab>("payments");
  const [direction, setDirection] = useState<"all" | "in" | "out">("all");
  const [openPayment, setOpenPayment] = useState<Payment | null>(null);
  const [newPayment, setNewPayment] = useState<"in" | "out" | null>(null);
  const [openVendor, setOpenVendor] = useState<Vendor | null>(null);
  const [newVendor, setNewVendor] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["vendors-payments"],
    queryFn: () => fetchAll(),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["vendors-payments"] });

  const paidMutation = useMutation({
    mutationFn: (id: string) => markPaid({ data: { id } }),
    onSuccess: () => {
      toast.success("Marked paid");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const myRole = (data?.myRole ?? null) as WorkspaceRole | null;
  const editable = can(myRole, "workspace.edit");
  const paymentsOnly = data?.paymentsOnly ?? false;
  const payments = data?.payments ?? [];
  const events = data?.events ?? [];
  const vendors = data?.vendors ?? [];
  const eventName = (id: string | null) => events.find((e) => e.id === id)?.name ?? "—";
  const vendorName = (id: string | null) => vendors.find((v) => v.id === id)?.name ?? null;

  /** Converts to USD for totals; anything we have no rate for is counted separately. */
  const sum = (rows: { amount: number; currency: string }[]) => {
    let usd = 0;
    let unconverted = 0;
    for (const r of rows) {
      const v = toUsd(r.amount, code(r.currency), rates);
      if (v == null) unconverted += 1;
      else usd += v;
    }
    return { usd, unconverted };
  };

  const totals = useMemo(() => {
    const out = payments.filter((p) => p.direction === "out");
    const inn = payments.filter((p) => p.direction === "in");
    return {
      outstandingOut: sum(out.filter((p) => p.effective_status !== "paid")),
      overdue: payments.filter((p) => p.effective_status === "overdue").length,
      paidOut: sum(out.filter((p) => p.effective_status === "paid")),
      receivedIn: sum(inn.filter((p) => p.effective_status === "paid")),
      expectedIn: sum(inn.filter((p) => p.effective_status !== "paid")),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, rates]);

  const budgetRows = useMemo(() => {
    const ids = new Set<string>([
      ...(data?.budgets ?? []).map((b) => b.event_id),
      ...payments.map((p) => p.event_id).filter((id): id is string => !!id),
    ]);
    return [...ids].map((id) => {
      const plan = data?.budgets.find((b) => b.event_id === id) ?? null;
      const rows = payments.filter((p) => p.event_id === id);
      const out = rows.filter((p) => p.direction === "out");
      const committed = sum(out.filter((p) => p.effective_status !== "paid"));
      const paidOut = sum(out.filter((p) => p.effective_status === "paid"));
      const receivedIn = sum(
        rows.filter((p) => p.direction === "in" && p.effective_status === "paid"),
      );
      const planned = plan ? toUsd(plan.planned_amount, code(plan.currency), rates) : null;
      return {
        event_id: id,
        name: eventName(id),
        plan,
        plannedUsd: planned,
        committedUsd: committed.usd,
        paidOutUsd: paidOut.usd,
        receivedInUsd: receivedIn.usd,
        // Balance: what is left of the plan once everything committed or paid is out.
        balanceUsd: planned != null ? planned - committed.usd - paidOut.usd : null,
        unconverted: committed.unconverted + paidOut.unconverted + receivedIn.unconverted,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, payments, rates]);

  if (isLoading) {
    return (
      <WorkspacePage title={paymentsOnly ? "Payments" : "Vendors & Payments"}>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WorkspacePage>
    );
  }

  const visiblePayments = payments.filter((p) => direction === "all" || p.direction === direction);
  const tabs: { id: Tab; label: string }[] = paymentsOnly
    ? [{ id: "payments", label: "Payments" }]
    : [
        { id: "payments", label: "Payments" },
        { id: "vendors", label: "Vendors" },
        { id: "budget", label: "Budget vs actual" },
      ];
  const anyUnconverted =
    totals.outstandingOut.unconverted +
      totals.paidOut.unconverted +
      totals.receivedIn.unconverted +
      totals.expectedIn.unconverted >
    0;

  // One definition per table, so the CSV and the Excel workbook cannot disagree.
  const paymentsTable = {
    name: "Payments",
    headers: [
      "Direction",
      "Description",
      "Event",
      "Paid to / by",
      "Amount",
      "Currency",
      "Part payment",
      "Due",
      "Paid on",
      "Status",
      "Method",
      "Receipt",
    ],
    rows: payments.map((p) => [
      p.direction === "out" ? "Out" : "In",
      p.description ?? "",
      p.event_id ? eventName(p.event_id) : "",
      vendorName(p.vendor_id) ?? p.counterparty ?? "",
      p.amount,
      code(p.currency),
      p.is_partial ? "Yes" : "No",
      p.due_on ?? "",
      p.paid_on ?? "",
      p.effective_status,
      p.method ?? "",
      p.receipt_url ?? "",
    ]),
  };
  const vendorsTable = {
    name: "Vendors",
    headers: [
      "Name",
      "Category",
      "Contact",
      "Phone",
      "Email",
      "Payment reference",
      "Rating",
      "Notes",
    ],
    rows: vendors.map((v) => [
      v.name,
      v.category,
      v.contact_person ?? "",
      v.phone ?? "",
      v.email ?? "",
      v.payment_reference ?? "",
      v.rating ?? "",
      v.notes ?? "",
    ]),
  };
  // Converted to USD at today's rate so one column adds up; stated in the header.
  const round = (n: number | null) => (n == null ? null : Math.round(n * 100) / 100);
  const budgetTable = {
    name: "Budget vs actual",
    headers: [
      "Event",
      "Planned (USD)",
      "Committed (USD)",
      "Paid out (USD)",
      "Received in (USD)",
      "Balance (USD)",
    ],
    rows: budgetRows.map((r) => [
      r.name,
      round(r.plannedUsd),
      round(r.committedUsd),
      round(r.paidOutUsd),
      round(r.receivedInUsd),
      round(r.balanceUsd),
    ]),
  };

  const exportCsv = (t: { name: string; headers: string[]; rows: unknown[][] }) =>
    downloadCsv(datedCsvFilename(t.name.toLowerCase().replace(/[^a-z]+/g, "-")), t.headers, t.rows);
  const exportPayments = () => exportCsv(paymentsTable);
  const exportVendors = () => exportCsv(vendorsTable);
  const exportBudget = () => exportCsv(budgetTable);
  const exportExcel = () =>
    downloadXlsx(
      `${paymentsOnly ? "payments" : "vendors-and-payments"}-${new Date().toISOString().slice(0, 10)}`,
      paymentsOnly ? [paymentsTable] : [paymentsTable, vendorsTable, budgetTable],
    );

  return (
    <WorkspacePage
      title={paymentsOnly ? "Payments" : "Vendors & Payments"}
      subtitle={
        paymentsOnly
          ? "Track every payment in and out, with receipts."
          : "The vendors you work with and the money moving in and out of every event."
      }
      action={
        editable ? (
          <div className="flex gap-2">
            {tab === "vendors" ? (
              <Button onClick={() => setNewVendor(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add vendor
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setNewPayment("in")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Money in
                </Button>
                <Button onClick={() => setNewPayment("out")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Money out
                </Button>
              </>
            )}
          </div>
        ) : undefined
      }
    >
      {myRole === "manager" && (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Your seat is Manager — read-only oversight. You can see every vendor and payment here but
          cannot change one.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Still to pay out" value={fmtUsd(totals.outstandingOut.usd)} />
        <Tile
          label="Overdue"
          value={String(totals.overdue)}
          tone={totals.overdue ? "danger" : undefined}
        />
        <Tile label="Paid out" value={fmtUsd(totals.paidOut.usd)} />
        <Tile
          label="Received in"
          value={fmtUsd(totals.receivedIn.usd)}
          hint={`${fmtUsd(totals.expectedIn.usd)} still expected`}
        />
      </div>
      {anyUnconverted && (
        <p className="text-xs text-muted-foreground">
          Totals convert at today's rate. Payments in a currency without a rate on IGE yet are left
          out of the totals but still listed below.
        </p>
      )}

      <div className="flex items-end justify-between gap-2 border-b border-border">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="mb-1" onClick={exportExcel}>
          <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
          Excel
        </Button>
      </div>

      {tab === "payments" && (
        <DashboardPanel
          title="Payments"
          description="Due turns on a week before the date; Overdue the day after."
          action={
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(["all", "out", "in"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                      direction === d
                        ? "bg-brand-soft text-primary-deep"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {d === "all" ? "All" : d === "out" ? "Out" : "In"}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={exportPayments}
                disabled={!payments.length}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                CSV
              </Button>
              <InfoTip tip="payments.tracker" />
            </div>
          }
          bodyClassName="p-0"
        >
          {visiblePayments.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              No payments recorded yet. Log a deposit you owe, a sponsor instalment you expect —
              anything with a date and an amount.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Payment</th>
                    <th className="px-3 py-2.5 font-medium">Event</th>
                    <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                    <th className="px-3 py-2.5 font-medium">Due</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setOpenPayment(p)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">
                          <span
                            className={
                              p.direction === "out" ? "text-destructive" : "text-secondary-deep"
                            }
                          >
                            {p.direction === "out" ? "Out" : "In"}
                          </span>{" "}
                          · {p.description || "Untitled"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vendorName(p.vendor_id) ?? p.counterparty ?? "—"}
                          {p.is_partial && " · part payment"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{eventName(p.event_id)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-foreground">
                        {native(p.amount, p.currency)}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground">
                        {p.due_on ? new Date(p.due_on).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[p.effective_status]}`}
                        >
                          {p.effective_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {p.receipt_url && (
                            <a
                              href={p.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Open receipt"
                              className="text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {editable && p.effective_status !== "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={paidMutation.isPending}
                              onClick={() => paidMutation.mutate(p.id)}
                            >
                              <Check className="mr-1 h-3.5 w-3.5" />
                              Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardPanel>
      )}

      {tab === "vendors" && !paymentsOnly && (
        <>
          <DashboardPanel
            title="Vendor directory"
            description="Private to this workspace."
            action={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={exportVendors}
                  disabled={!vendors.length}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  CSV
                </Button>
                <InfoTip tip="vendors.directory" />
              </div>
            }
            bodyClassName="p-0"
          >
            {vendors.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                No vendors yet. Add the venue, the caterer, the sound team — everyone you pay to
                deliver an event.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {vendors.map((v) => {
                  const docs = (data?.documents ?? []).filter((d) => d.vendor_id === v.id);
                  const owed = sum(
                    payments.filter((p) => p.vendor_id === v.id && p.effective_status !== "paid"),
                  );
                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => setOpenVendor(v)}
                        className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-muted/30"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{v.name}</p>
                          <p className="truncate text-xs capitalize text-muted-foreground">
                            {v.category}
                            {v.contact_person && ` · ${v.contact_person}`}
                            {docs.length > 0 &&
                              ` · ${docs.length} document${docs.length > 1 ? "s" : ""}`}
                          </p>
                        </div>
                        {v.rating ? (
                          <span className="flex shrink-0 items-center gap-0.5 text-xs text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {v.rating}
                          </span>
                        ) : null}
                        {owed.usd > 0 && (
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {fmtUsd(owed.usd)} owed
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </DashboardPanel>

          <QuoteComparison
            documents={data?.documents ?? []}
            vendors={vendors}
            eventName={eventName}
            fmtUsd={fmtUsd}
            toUsdAmount={(a, c) => toUsd(a, code(c), rates)}
          />
        </>
      )}

      {tab === "budget" && !paymentsOnly && (
        <DashboardPanel
          title="Budget vs actual"
          description="Per event: what you planned, what is committed, paid out, received in, and what is left."
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={exportBudget}
                disabled={!budgetRows.length}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                CSV
              </Button>
              <InfoTip tip="payments.budget_vs_actual" />
            </div>
          }
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Event</th>
                  <th className="px-3 py-2.5 font-medium">Planned budget</th>
                  <th className="px-3 py-2.5 text-right font-medium">Committed</th>
                  <th className="px-3 py-2.5 text-right font-medium">Paid out</th>
                  <th className="px-3 py-2.5 text-right font-medium">Received in</th>
                  <th className="px-5 py-2.5 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {budgetRows.map((r) => (
                  <tr key={r.event_id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-3 py-3">
                      <PlannedBudgetCell
                        key={`${r.event_id}:${r.plan?.planned_amount ?? ""}`}
                        initialAmount={r.plan?.planned_amount ?? null}
                        initialCurrency={r.plan?.currency ?? "NGN (₦)"}
                        editable={editable}
                        onSave={(amount, currency) =>
                          saveBudget({
                            data: { event_id: r.event_id, planned_amount: amount, currency },
                          })
                            .then(() => {
                              toast.success("Budget saved");
                              refresh();
                            })
                            .catch((e: Error) => toast.error(e.message))
                        }
                      />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtUsd(r.committedUsd)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtUsd(r.paidOutUsd)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtUsd(r.receivedInUsd)}</td>
                    <td
                      className={`px-5 py-3 text-right font-medium tabular-nums ${
                        r.balanceUsd != null && r.balanceUsd < 0
                          ? "text-destructive"
                          : "text-foreground"
                      }`}
                    >
                      {r.balanceUsd != null ? fmtUsd(r.balanceUsd) : "—"}
                    </td>
                  </tr>
                ))}
                {events
                  .filter((e) => !budgetRows.some((r) => r.event_id === e.id))
                  .map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-muted-foreground">{e.name}</td>
                      <td className="px-3 py-3">
                        <PlannedBudgetCell
                          initialAmount={null}
                          initialCurrency="NGN (₦)"
                          editable={editable}
                          onSave={(amount, currency) =>
                            saveBudget({
                              data: { event_id: e.id, planned_amount: amount, currency },
                            })
                              .then(() => {
                                toast.success("Budget saved");
                                refresh();
                              })
                              .catch((err: Error) => toast.error(err.message))
                          }
                        />
                      </td>
                      <td
                        colSpan={4}
                        className="px-5 py-3 text-right text-xs text-muted-foreground"
                      >
                        No payments yet
                      </td>
                    </tr>
                  ))}
                {budgetRows.length === 0 && events.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      Create an event in My Events, then set its budget here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardPanel>
      )}

      {(openPayment || newPayment) && (
        <PaymentDrawer
          payment={openPayment}
          defaultDirection={newPayment ?? "out"}
          events={events}
          vendors={vendors}
          showVendors={!paymentsOnly}
          editable={editable}
          onClose={() => {
            setOpenPayment(null);
            setNewPayment(null);
          }}
          onSaved={() => {
            refresh();
            setOpenPayment(null);
            setNewPayment(null);
          }}
        />
      )}

      {(openVendor || newVendor) && (
        <VendorDrawer
          vendor={openVendor}
          documents={(data?.documents ?? []).filter((d) => d.vendor_id === openVendor?.id)}
          assignments={(data?.assignments ?? []).filter((a) => a.vendor_id === openVendor?.id)}
          events={events}
          editable={editable}
          onClose={() => {
            setOpenVendor(null);
            setNewVendor(false);
          }}
          onSaved={() => {
            // Keep the drawer open on the same vendor after adding a quote or
            // an assignment; close it only when the vendor itself is new.
            refresh();
            if (newVendor) setNewVendor(false);
          }}
        />
      )}
    </WorkspacePage>
  );
}

function Tile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold tabular-nums ${tone === "danger" ? "text-destructive" : "text-foreground"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Inline editor for one event's planned budget. */
function PlannedBudgetCell({
  initialAmount,
  initialCurrency,
  editable,
  onSave,
}: {
  initialAmount: number | null;
  initialCurrency: string;
  editable: boolean;
  onSave: (amount: number, currency: string) => void;
}) {
  const [amount, setAmount] = useState(initialAmount != null ? String(initialAmount) : "");
  const [currency, setCurrency] = useState(initialCurrency);
  const dirty =
    amount !== (initialAmount != null ? String(initialAmount) : "") || currency !== initialCurrency;

  if (!editable) {
    return (
      <span className="tabular-nums text-foreground">
        {initialAmount != null ? native(initialAmount, initialCurrency) : "—"}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        aria-label="Budget currency"
        className="rounded-md border border-border bg-background px-1.5 py-1 text-xs"
      >
        {ONBOARDING_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {code(c)}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={0}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Set a budget"
        aria-label="Planned budget"
        className="w-28 rounded-md border border-border bg-background px-2 py-1 text-xs tabular-nums"
      />
      {dirty && amount !== "" && (
        <Button size="sm" variant="outline" onClick={() => onSave(Number(amount), currency)}>
          Save
        </Button>
      )}
    </div>
  );
}

/** "Compare quotes; mark the chosen vendor" — quotes grouped by the event they price. */
function QuoteComparison({
  documents,
  vendors,
  eventName,
  fmtUsd,
  toUsdAmount,
}: {
  documents: {
    id: string;
    vendor_id: string;
    event_id: string | null;
    kind: string;
    title: string;
    amount: number | null;
    currency: string;
    is_chosen: boolean;
  }[];
  vendors: Vendor[];
  eventName: (id: string | null) => string;
  fmtUsd: (usd: number | null | undefined) => string;
  toUsdAmount: (amount: number, currency: string) => number | null;
}) {
  const quotes = documents.filter((d) => d.kind === "quote" && d.event_id);
  const byEvent = new Map<string, typeof quotes>();
  for (const q of quotes) byEvent.set(q.event_id!, [...(byEvent.get(q.event_id!) ?? []), q]);
  const groups = [...byEvent.entries()].filter(([, qs]) => qs.length > 1);
  if (!groups.length) return null;

  return (
    <DashboardPanel
      title="Compare quotes"
      description="Every event with more than one quote, cheapest first."
    >
      <div className="space-y-5">
        {groups.map(([eventId, qs]) => {
          const sorted = [...qs].sort(
            (a, b) =>
              (toUsdAmount(a.amount ?? Infinity, a.currency) ?? Infinity) -
              (toUsdAmount(b.amount ?? Infinity, b.currency) ?? Infinity),
          );
          return (
            <div key={eventId}>
              <p className="mb-2 text-sm font-semibold text-foreground">{eventName(eventId)}</p>
              <ul className="space-y-1.5">
                {sorted.map((q) => (
                  <li
                    key={q.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${q.is_chosen ? "border-secondary bg-secondary/5" : "border-border"}`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium text-foreground">
                        {vendors.find((v) => v.id === q.vendor_id)?.name ?? "Vendor"}
                      </span>
                      <span className="text-muted-foreground"> · {q.title}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-foreground">
                      {q.amount != null ? native(q.amount, q.currency) : "—"}
                    </span>
                    {q.amount != null && code(q.currency) !== "USD" && (
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        ≈ {fmtUsd(toUsdAmount(q.amount, q.currency))}
                      </span>
                    )}
                    {q.is_chosen && (
                      <span className="shrink-0 rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-medium text-secondary-deep">
                        Chosen
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
