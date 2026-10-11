import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, ExternalLink, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextArea } from "@/components/signup/profile-fields";
import { InfoTip } from "@/components/info-tip";
import { IdSelect } from "@/components/payments/payment-drawer";
import { ONBOARDING_CURRENCIES } from "@/lib/onboarding-constants";
import {
  VENDOR_CATEGORIES,
  addVendorAssignment,
  addVendorDocument,
  chooseQuote,
  deleteVendor,
  deleteVendorAssignment,
  deleteVendorDocument,
  upsertVendor,
  type Vendor,
  type VendorAssignment,
  type VendorDocument,
  type WorkspaceEventOption,
} from "@/lib/vendors.functions";

/** One vendor: contact details, quotes and contracts, and what they are delivering. */
export function VendorDrawer({
  vendor,
  documents,
  assignments,
  events,
  editable,
  onClose,
  onSaved,
}: {
  vendor: Vendor | null;
  documents: VendorDocument[];
  assignments: VendorAssignment[];
  events: WorkspaceEventOption[];
  editable: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(upsertVendor);
  const remove = useServerFn(deleteVendor);
  const addDoc = useServerFn(addVendorDocument);
  const removeDoc = useServerFn(deleteVendorDocument);
  const choose = useServerFn(chooseQuote);
  const assign = useServerFn(addVendorAssignment);
  const unassign = useServerFn(deleteVendorAssignment);

  const [form, setForm] = useState({
    name: vendor?.name ?? "",
    category: vendor?.category ?? "other",
    contact_person: vendor?.contact_person ?? "",
    phone: vendor?.phone ?? "",
    email: vendor?.email ?? "",
    payment_reference: vendor?.payment_reference ?? "",
    rating: vendor?.rating ?? 0,
    notes: vendor?.notes ?? "",
  });
  const [doc, setDoc] = useState({
    kind: "quote",
    title: "",
    file_url: "",
    amount: "",
    currency: "NGN (₦)",
    event_id: "",
  });
  const [task, setTask] = useState({ deliverable: "", delivery_on: "", event_id: "" });

  const eventName = (id: string | null) => events.find((e) => e.id === id)?.name ?? null;

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: vendor?.id,
          name: form.name.trim(),
          category: form.category as (typeof VENDOR_CATEGORIES)[number],
          contact_person: form.contact_person.trim() || undefined,
          phone: form.phone.trim() || undefined,
          email: form.email.trim(),
          payment_reference: form.payment_reference.trim() || undefined,
          rating: form.rating || null,
          notes: form.notes.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success(vendor ? "Vendor updated" : "Vendor added");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const docMutation = useMutation({
    mutationFn: () =>
      addDoc({
        data: {
          vendor_id: vendor!.id,
          event_id: doc.event_id || null,
          kind: doc.kind as "quote" | "invoice" | "contract",
          title: doc.title.trim(),
          file_url: doc.file_url.trim(),
          amount: doc.amount ? Number(doc.amount) : null,
          currency: doc.currency,
        },
      }),
    onSuccess: () => {
      setDoc({ ...doc, title: "", file_url: "", amount: "" });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      assign({
        data: {
          vendor_id: vendor!.id,
          deliverable: task.deliverable.trim(),
          delivery_on: task.delivery_on || null,
          event_id: task.event_id || null,
        },
      }),
    onSuccess: () => {
      setTask({ deliverable: "", delivery_on: "", event_id: task.event_id });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const run = (p: Promise<unknown>) => p.then(onSaved).catch((e: Error) => toast.error(e.message));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-brand"
        role="dialog"
        aria-label={vendor ? `Vendor: ${vendor.name}` : "New vendor"}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-foreground">
            {vendor ? vendor.name : "New vendor"}
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
            if (!form.name.trim()) {
              toast.error("Give the vendor a name.");
              return;
            }
            saveMutation.mutate();
          }}
        >
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <SelectField
            label="Category"
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
            options={[...VENDOR_CATEGORIES]}
          />
          <Field
            label="Contact person"
            value={form.contact_person}
            onChange={(v) => setForm({ ...form, contact_person: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
          </div>
          <label className="block">
            <span className="mb-1.5 flex items-center text-sm font-medium">
              Payment details reference
              <InfoTip tip="vendors.payment_reference" />
            </span>
            <input
              value={form.payment_reference}
              onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
              placeholder="e.g. Bank details on their invoice INV-204"
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-sm font-medium">Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={!editable}
                  onClick={() => setForm({ ...form, rating: form.rating === n ? 0 : n })}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className="text-amber-500 disabled:cursor-default"
                >
                  <Star className={`h-5 w-5 ${n <= form.rating ? "fill-current" : ""}`} />
                </button>
              ))}
            </div>
          </div>
          <TextArea
            label="Notes"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
            rows={3}
          />

          {editable && (
            <Button type="submit" disabled={saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? "Saving…" : vendor ? "Save changes" : "Add vendor"}
            </Button>
          )}
        </form>

        {vendor && (
          <>
            <section className="mt-7">
              <h3 className="mb-1 flex items-center text-sm font-semibold text-foreground">
                Quotes, invoices and contracts
                <InfoTip tip="vendors.quotes" />
              </h3>
              <p className="mb-2 text-xs text-muted-foreground">
                Compare quotes side by side on the Vendors tab; mark the one you went with.
              </p>
              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">None yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {documents.map((d) => (
                    <li
                      key={d.id}
                      className={`rounded-lg border px-3 py-2 ${d.is_chosen ? "border-secondary bg-secondary/5" : "border-border"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                          {d.kind}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                          {d.title}
                        </span>
                        {d.file_url && (
                          <a
                            href={d.file_url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${d.title}`}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {editable && (
                          <button
                            type="button"
                            onClick={() => run(removeDoc({ data: { id: d.id } }))}
                            aria-label={`Delete ${d.title}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span>
                          {d.amount != null &&
                            `${d.currency.split(" ")[0]} ${d.amount.toLocaleString()}`}
                          {eventName(d.event_id) && ` · ${eventName(d.event_id)}`}
                        </span>
                        {d.kind === "quote" && editable && (
                          <button
                            type="button"
                            onClick={() =>
                              run(choose({ data: { id: d.id, chosen: !d.is_chosen } }))
                            }
                            className={`inline-flex items-center gap-1 font-medium ${d.is_chosen ? "text-secondary-deep" : "hover:text-foreground"}`}
                          >
                            {d.is_chosen && <Check className="h-3 w-3" />}
                            {d.is_chosen ? "Chosen" : "Choose this quote"}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {editable && (
                <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <SelectField
                      label="Kind"
                      value={doc.kind}
                      onChange={(v) => setDoc({ ...doc, kind: v })}
                      options={["quote", "invoice", "contract"]}
                    />
                    <IdSelect
                      label="Event"
                      value={doc.event_id}
                      onChange={(v) => setDoc({ ...doc, event_id: v })}
                      options={events.map((e) => ({ id: e.id, label: e.name }))}
                      empty="Any event"
                    />
                  </div>
                  <Field
                    label="Title"
                    value={doc.title}
                    onChange={(v) => setDoc({ ...doc, title: v })}
                  />
                  <Field
                    label="Link to the file"
                    type="url"
                    value={doc.file_url}
                    onChange={(v) => setDoc({ ...doc, file_url: v })}
                    placeholder="https://…"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field
                      label="Amount"
                      type="number"
                      value={doc.amount}
                      onChange={(v) => setDoc({ ...doc, amount: v })}
                    />
                    <SelectField
                      label="Currency"
                      value={doc.currency}
                      onChange={(v) => setDoc({ ...doc, currency: v })}
                      options={[...ONBOARDING_CURRENCIES]}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={!doc.title.trim() || docMutation.isPending}
                    onClick={() => docMutation.mutate()}
                  >
                    {docMutation.isPending ? "Adding…" : "Add document"}
                  </Button>
                </div>
              )}
            </section>

            <section className="mt-7">
              <h3 className="mb-1 flex items-center text-sm font-semibold text-foreground">
                What they are delivering
                <InfoTip tip="vendors.assignments" />
              </h3>
              {assignments.length === 0 ? (
                <p className="text-xs text-muted-foreground">Not assigned to anything yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {assignments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {a.deliverable}
                        {eventName(a.event_id) && (
                          <span className="text-muted-foreground"> · {eventName(a.event_id)}</span>
                        )}
                      </span>
                      {a.delivery_on && (
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {new Date(a.delivery_on).toLocaleDateString()}
                        </span>
                      )}
                      {editable && (
                        <button
                          type="button"
                          onClick={() => run(unassign({ data: { id: a.id } }))}
                          aria-label={`Remove ${a.deliverable}`}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {editable && (
                <div className="mt-2 space-y-2">
                  <IdSelect
                    label="For event"
                    value={task.event_id}
                    onChange={(v) => setTask({ ...task, event_id: v })}
                    options={events.map((e) => ({ id: e.id, label: e.name }))}
                    empty="No particular event"
                  />
                  <div className="flex gap-2">
                    <input
                      value={task.deliverable}
                      onChange={(e) => setTask({ ...task, deliverable: e.target.value })}
                      placeholder="e.g. Stage build and teardown"
                      className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                    />
                    <input
                      type="date"
                      value={task.delivery_on}
                      onChange={(e) => setTask({ ...task, delivery_on: e.target.value })}
                      aria-label="Delivery date"
                      className="shrink-0 rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!task.deliverable.trim() || assignMutation.isPending}
                      onClick={() => assignMutation.mutate()}
                      aria-label="Add assignment"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {editable && (
              <Button
                variant="destructive"
                className="mt-8 w-full"
                onClick={() => {
                  if (
                    confirm(
                      `Delete ${vendor.name}? Their quotes and assignments go too. Payments already recorded stay.`,
                    )
                  ) {
                    remove({ data: { id: vendor.id } })
                      .then(() => {
                        onSaved();
                        onClose();
                      })
                      .catch((e: Error) => toast.error(e.message));
                  }
                }}
              >
                Delete vendor
              </Button>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
