import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/currency";
import {
  getDigestPreference,
  getNotificationPreferences,
  setNotificationPreference,
  type NotificationPreference,
  getPaymentDetails,
  savePaymentDetails,
  setDigestPreference,
  type PaymentDetails,
} from "@/lib/account-settings.functions";
import { NOTIFICATION_CATEGORIES } from "@/lib/notification-prefs";
import { PaginatedTable } from "@/components/paginated-table";

const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

/**
 * Payment Details (Owner role only). No subscription here while IGE is
 * free to use; this holds how a closed deal is paid and where net proceeds
 * go, plus a history of platform-processed payments and commission.
 */
export function PaymentDetailsTab() {
  const qc = useQueryClient();
  const fetchDetails = useServerFn(getPaymentDetails);
  const save = useServerFn(savePaymentDetails);
  const { data, isLoading } = useQuery({
    queryKey: ["payment-details"],
    queryFn: () => fetchDetails(),
  });
  const [f, setF] = useState<PaymentDetails | null>(null);
  useEffect(() => {
    if (data?.allowed) setF(data.details);
  }, [data]);
  const mut = useMutation({
    mutationFn: () => {
      const { updated_at: _u, ...rest } = f!;
      return save({ data: rest });
    },
    onSuccess: () => {
      toast.success("Payment details saved.");
      qc.invalidateQueries({ queryKey: ["payment-details"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (!data?.allowed) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Only the workspace Owner can see and change payment details.
      </p>
    );
  }
  if (!f) return null;
  const set =
    (k: keyof PaymentDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        IGE is free to use until at least May 2027, so there is no plan to pay for here. These
        details are only used to settle a closed deal through the platform.
      </p>
      {!data.ready && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Payment Details is waiting on a platform update. You can look, but saving won't work yet.
        </p>
      )}

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold">Paying for a closed deal</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Preferred way to pay">
            <select value={f.pay_method} onChange={set("pay_method")} className={input}>
              <option value="">Not set</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="card">Card</option>
              <option value="invoice">Invoice (net terms)</option>
              <option value="other">Other</option>
            </select>
          </F>
          <F label="Billing contact name">
            <input
              value={f.billing_contact_name}
              onChange={set("billing_contact_name")}
              className={input}
            />
          </F>
          <F label="Billing contact email">
            <input
              type="email"
              value={f.billing_contact_email}
              onChange={set("billing_contact_email")}
              className={input}
            />
          </F>
          <F label="Tax / VAT ID">
            <input value={f.tax_id} onChange={set("tax_id")} className={input} />
          </F>
        </div>
        <F label="Billing address">
          <textarea
            rows={2}
            value={f.billing_address}
            onChange={set("billing_address")}
            className={input}
          />
        </F>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold">Receiving net proceeds</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Payout method">
            <select value={f.payout_method} onChange={set("payout_method")} className={input}>
              <option value="">Not set</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="paystack">Paystack</option>
              <option value="stripe">Stripe</option>
              <option value="other">Other</option>
            </select>
          </F>
          <F label="Payout currency">
            <select value={f.payout_currency} onChange={set("payout_currency")} className={input}>
              <option value="">Not set</option>
              {["NGN", "USD", "GBP", "EUR"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </F>
          <F label="Bank country">
            <input value={f.bank_country} onChange={set("bank_country")} className={input} />
          </F>
          <F label="Bank name">
            <input value={f.bank_name} onChange={set("bank_name")} className={input} />
          </F>
          <F label="Account name">
            <input value={f.account_name} onChange={set("account_name")} className={input} />
          </F>
          <F label="Account number">
            <input
              value={f.account_number}
              onChange={set("account_number")}
              onFocus={() => f.account_number.includes("•") && setF({ ...f, account_number: "" })}
              className={input}
              autoComplete="off"
            />
          </F>
          <F label="Sort code / routing number">
            <input
              value={f.sort_or_routing_code}
              onChange={set("sort_or_routing_code")}
              className={input}
            />
          </F>
          <F label="SWIFT / BIC">
            <input value={f.swift_bic} onChange={set("swift_bic")} className={input} />
          </F>
          <F label="IBAN">
            <input
              value={f.iban}
              onChange={set("iban")}
              onFocus={() => f.iban.includes("•") && setF({ ...f, iban: "" })}
              className={input}
              autoComplete="off"
            />
          </F>
          <F label="Paystack or Stripe account reference">
            <input
              value={f.processor_account_ref}
              onChange={set("processor_account_ref")}
              className={input}
            />
          </F>
        </div>
        <F label="Notes for IGE finance">
          <textarea rows={2} value={f.notes} onChange={set("notes")} className={input} />
        </F>
      </section>

      <Button disabled={mut.isPending || !data.ready} onClick={() => mut.mutate()}>
        Save payment details
      </Button>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold">Platform payment history</h3>
        {data.history.length ? (
          <div className="mt-3 overflow-x-auto">
            <PaginatedTable className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Event</th>
                  <th>Paid</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Commission</th>
                  <th className="text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.history.map((h) => (
                  <tr key={h.id}>
                    <td className="py-2">
                      {h.event ?? "Deal"}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({h.side === "sponsor" ? "you paid" : "you received"})
                      </span>
                    </td>
                    <td>{h.paid_at ? new Date(h.paid_at).toLocaleDateString() : "—"}</td>
                    <td className="text-right tabular-nums">
                      {h.gross != null ? fmtMoney(h.currency, h.gross) : "—"}
                    </td>
                    <td className="text-right tabular-nums">
                      {h.commission != null ? fmtMoney(h.currency, h.commission) : "—"}
                    </td>
                    <td className="text-right tabular-nums">
                      {h.net != null ? fmtMoney(h.currency, h.net) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </PaginatedTable>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No platform-processed payments yet.</p>
        )}
      </section>
    </div>
  );
}

/** Notifications: per-alert, per-channel toggles and the digest emails. */
export function NotificationsTab() {
  return (
    <div className="space-y-6">
      <AlertPreferences />
      <DigestPreference />
    </div>
  );
}

function AlertPreferences() {
  const qc = useQueryClient();
  const fetchPrefs = useServerFn(getNotificationPreferences);
  const save = useServerFn(setNotificationPreference);
  const { data } = useQuery({ queryKey: ["notification-prefs"], queryFn: () => fetchPrefs() });
  const mut = useMutation({
    mutationFn: (p: NotificationPreference) => save({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-prefs"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-semibold">Alerts</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Choose where each kind of alert reaches you. Account, security and sign-in notices, and any
        change IGE makes to your record, always reach you.
      </p>
      {data && !data.ready && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Alert settings are waiting on a platform update.
        </p>
      )}
      <PaginatedTable className="mt-4 w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="pb-2 font-medium">Alert</th>
            <th className="pb-2 text-center font-medium">In-app</th>
            <th className="pb-2 text-center font-medium">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {NOTIFICATION_CATEGORIES.map((c) => {
            const p = data?.prefs.find((x) => x.category === c.id) ?? {
              category: c.id,
              in_app: true,
              email: true,
            };
            const toggle = (channel: "in_app" | "email") =>
              mut.mutate({ ...p, [channel]: !p[channel] });
            return (
              <tr key={c.id}>
                <td className="py-3 pr-3">
                  <span className="block font-medium text-foreground">{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.body}</span>
                </td>
                {(["in_app", "email"] as const).map((ch) => (
                  <td key={ch} className="text-center">
                    <input
                      type="checkbox"
                      checked={p[ch]}
                      disabled={mut.isPending || (data && !data.ready)}
                      onChange={() => toggle(ch)}
                      aria-label={`${c.label} ${ch === "in_app" ? "in-app" : "email"}`}
                      className="h-4 w-4 accent-[#6B3FA0]"
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </PaginatedTable>
    </div>
  );
}

/** The digest emails (TAB 18 §18.4). */
function DigestPreference() {
  const qc = useQueryClient();
  const fetchPref = useServerFn(getDigestPreference);
  const save = useServerFn(setDigestPreference);
  const { data } = useQuery({ queryKey: ["digest-pref"], queryFn: () => fetchPref() });
  const mut = useMutation({
    mutationFn: (frequency: "daily" | "weekly" | "off") => save({ data: { frequency } }),
    onSuccess: () => {
      toast.success("Saved.");
      qc.invalidateQueries({ queryKey: ["digest-pref"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const options = [
    {
      id: "daily",
      label: "Daily brief and weekly recap",
      body: "A short morning email with your budget pace or funding gap, new matches and stalled deals, plus a Monday week in review.",
    },
    {
      id: "weekly",
      label: "Weekly recap only",
      body: "One email on Mondays: pipeline movement, score changes, new matches and the week ahead.",
    },
    {
      id: "off",
      label: "Off",
      body: "No digest emails. You'll still get emails about matches, meetings and anything that needs you.",
    },
  ] as const;
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <h3 className="font-semibold">Digest emails</h3>
      {data && !data.ready && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Digest settings are waiting on a platform update.
        </p>
      )}
      <div className="space-y-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${data?.frequency === o.id ? "border-primary bg-brand-soft" : "border-border"}`}
          >
            <input
              type="radio"
              name="digest"
              checked={data?.frequency === o.id}
              disabled={mut.isPending || (data && !data.ready)}
              onChange={() => mut.mutate(o.id)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">{o.label}</span>
              <span className="block text-xs text-muted-foreground">{o.body}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
