import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, SelectField, TextArea } from "@/components/signup/profile-fields";
import { InfoTip } from "@/components/info-tip";
import { ONBOARDING_CURRENCIES } from "@/lib/onboarding-constants";
import {
  deletePayment,
  upsertPayment,
  type Payment,
  type Vendor,
  type WorkspaceEventOption,
} from "@/lib/vendors.functions";

const STATUS_OPTIONS = ["scheduled", "due", "paid", "overdue"];

/** A select whose value is an id but whose options read as names. */
export function IdSelect({
  label,
  value,
  onChange,
  options,
  empty,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  empty: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring"
      >
        <option value="">{empty}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** One payment in or out: what it is for, when it is due, and the receipt. */
export function PaymentDrawer({
  payment,
  defaultDirection,
  events,
  vendors,
  showVendors,
  editable,
  onClose,
  onSaved,
}: {
  payment: Payment | null;
  defaultDirection: "in" | "out";
  events: WorkspaceEventOption[];
  vendors: Vendor[];
  showVendors: boolean;
  editable: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(upsertPayment);
  const remove = useServerFn(deletePayment);

  const [form, setForm] = useState({
    direction: payment?.direction ?? defaultDirection,
    event_id: payment?.event_id ?? "",
    vendor_id: payment?.vendor_id ?? "",
    counterparty: payment?.counterparty ?? "",
    description: payment?.description ?? "",
    amount: payment ? String(payment.amount) : "",
    currency: payment?.currency ?? "NGN (₦)",
    is_partial: payment?.is_partial ?? false,
    due_on: payment?.due_on ?? "",
    paid_on: payment?.paid_on ?? "",
    status: payment?.status ?? "scheduled",
    method: payment?.method ?? "",
    receipt_url: payment?.receipt_url ?? "",
    notes: payment?.notes ?? "",
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: payment?.id,
          direction: form.direction,
          event_id: form.event_id || null,
          vendor_id: form.direction === "out" && form.vendor_id ? form.vendor_id : null,
          counterparty: form.counterparty.trim() || undefined,
          description: form.description.trim() || undefined,
          amount: Number(form.amount),
          currency: form.currency,
          is_partial: form.is_partial,
          due_on: form.due_on || null,
          paid_on: form.paid_on || null,
          status: form.status as Payment["effective_status"],
          method: form.method.trim() || undefined,
          receipt_url: form.receipt_url.trim(),
          notes: form.notes.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success(payment ? "Payment updated" : "Payment recorded");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => remove({ data: { id: payment!.id } }),
    onSuccess: () => {
      toast.success("Payment deleted");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isOut = form.direction === "out";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-brand"
        role="dialog"
        aria-label={payment ? "Edit payment" : "New payment"}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-foreground">
            {payment ? "Payment" : isOut ? "New payment out" : "New payment in"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.amount || Number.isNaN(Number(form.amount))) {
              toast.error("Enter the amount.");
              return;
            }
            saveMutation.mutate();
          }}
        >
          <div className="flex gap-1 rounded-full bg-muted p-1 text-xs font-medium">
            {(["out", "in"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm({ ...form, direction: d })}
                className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
                  form.direction === d
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {d === "out" ? "Money out" : "Money in"}
              </button>
            ))}
          </div>

          <Field
            label="What it is for"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder={isOut ? "Stage build deposit" : "Gold tier sponsorship, first instalment"}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(v) => setForm({ ...form, amount: v })}
              required
            />
            <SelectField
              label="Currency"
              value={form.currency}
              onChange={(v) => setForm({ ...form, currency: v })}
              options={[...ONBOARDING_CURRENCIES]}
            />
          </div>
          <Checkbox
            label="Part payment (more to come)"
            checked={form.is_partial}
            onChange={(v) => setForm({ ...form, is_partial: v })}
          />

          <IdSelect
            label="Event"
            value={form.event_id}
            onChange={(v) => setForm({ ...form, event_id: v })}
            options={events.map((e) => ({ id: e.id, label: e.name }))}
            empty="Not tied to an event"
          />
          {isOut && showVendors && (
            <IdSelect
              label="Vendor"
              value={form.vendor_id}
              onChange={(v) => setForm({ ...form, vendor_id: v })}
              options={vendors.map((v) => ({ id: v.id, label: v.name }))}
              empty="Not a vendor in the directory"
            />
          )}
          {(!isOut || !form.vendor_id) && (
            <Field
              label={isOut ? "Paid to" : "Paid by"}
              value={form.counterparty}
              onChange={(v) => setForm({ ...form, counterparty: v })}
              placeholder={isOut ? "Who receives it" : "The sponsor, partner or client"}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Due date"
              type="date"
              value={form.due_on}
              onChange={(v) => setForm({ ...form, due_on: v })}
            />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={STATUS_OPTIONS}
            />
          </div>
          {form.status === "paid" && (
            <Field
              label="Date paid"
              type="date"
              value={form.paid_on}
              onChange={(v) => setForm({ ...form, paid_on: v })}
            />
          )}
          <Field
            label="Payment method"
            value={form.method}
            onChange={(v) => setForm({ ...form, method: v })}
            placeholder="Bank transfer, card, cash…"
          />
          <label className="block">
            <span className="mb-1.5 flex items-center text-sm font-medium">
              Receipt link
              <InfoTip tip="payments.receipt" />
            </span>
            <input
              type="url"
              value={form.receipt_url}
              onChange={(e) => setForm({ ...form, receipt_url: e.target.value })}
              placeholder="https://drive.google.com/…"
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring"
            />
          </label>
          <TextArea
            label="Notes"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
            rows={3}
          />

          {editable && (
            <div className="space-y-2">
              <Button type="submit" disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? "Saving…" : payment ? "Save changes" : "Record payment"}
              </Button>
              {payment && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm("Delete this payment record?")) deleteMutation.mutate();
                  }}
                >
                  Delete payment
                </Button>
              )}
            </div>
          )}
        </form>
      </aside>
    </div>
  );
}
