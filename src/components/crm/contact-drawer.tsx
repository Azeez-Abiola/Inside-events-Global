import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextArea } from "@/components/signup/profile-fields";
import {
  getContactTimeline,
  logOutreach,
  upsertContact,
  type CrmCompany,
  type CrmContact,
  type CrmDeal,
} from "@/lib/crm.functions";
import {
  PRO_CONTACT_TYPES,
  ONBOARDING_SECTORS,
  ONBOARDING_COUNTRIES,
} from "@/lib/onboarding-constants";

const CHANNELS = ["email", "call", "whatsapp", "meeting", "event", "other"] as const;

/**
 * One contact: their details, and everything logged against them.
 *
 * Outreach is logged from here rather than a separate screen because §4.4.2
 * ties the touch to the person — "log every outreach touch, its outcome and
 * the next follow-up date", with follow-ups feeding the calendar.
 */
export function ContactDrawer({
  contact,
  companies,
  deals,
  editable,
  onClose,
  onSaved,
}: {
  contact: CrmContact | null;
  companies: CrmCompany[];
  deals: CrmDeal[];
  editable: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(upsertContact);
  const log = useServerFn(logOutreach);
  const fetchTimeline = useServerFn(getContactTimeline);

  const [form, setForm] = useState({
    full_name: contact?.full_name ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    job_title: contact?.job_title ?? "",
    company_id: contact?.company_id ?? "",
    contact_type: contact?.contact_type ?? "",
    sector: contact?.sector ?? "",
    country: contact?.country ?? "",
    notes: contact?.notes ?? "",
    source: contact?.source ?? "",
  });
  const [touch, setTouch] = useState({ channel: "email", outcome: "", next_follow_up: "" });

  const { data: timeline } = useQuery({
    queryKey: ["crm-timeline", contact?.id],
    enabled: !!contact?.id,
    queryFn: () => fetchTimeline({ data: { contact_id: contact!.id } }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: contact?.id,
          full_name: form.full_name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          job_title: form.job_title.trim() || undefined,
          company_id: form.company_id || null,
          contact_type: form.contact_type || undefined,
          sector: form.sector || undefined,
          country: form.country || undefined,
          notes: form.notes.trim() || undefined,
          source: form.source.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success(contact ? "Contact updated" : "Contact added");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logMutation = useMutation({
    mutationFn: () =>
      log({
        data: {
          contact_id: contact!.id,
          channel: touch.channel as (typeof CHANNELS)[number],
          outcome: touch.outcome.trim() || undefined,
          next_follow_up: touch.next_follow_up || null,
        },
      }),
    onSuccess: () => {
      toast.success("Outreach logged");
      setTouch({ channel: "email", outcome: "", next_follow_up: "" });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linkedDeals = deals.filter((d) => d.contact_id === contact?.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-brand"
        role="dialog"
        aria-label={contact ? `Contact: ${contact.full_name}` : "New contact"}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-foreground">
            {contact ? contact.full_name : "New contact"}
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
            if (!form.full_name.trim()) {
              toast.error("A name is required.");
              return;
            }
            saveMutation.mutate();
          }}
        >
          <Field
            label="Full name"
            value={form.full_name}
            onChange={(v) => setForm({ ...form, full_name: v })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
          </div>
          <Field
            label="Job title"
            value={form.job_title}
            onChange={(v) => setForm({ ...form, job_title: v })}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Company</span>
            <select
              value={form.company_id}
              onChange={(e) => setForm({ ...form, company_id: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring"
            >
              <option value="">—</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <SelectField
            label="Contact type"
            value={form.contact_type}
            onChange={(v) => setForm({ ...form, contact_type: v })}
            options={[...PRO_CONTACT_TYPES]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Sector"
              value={form.sector}
              onChange={(v) => setForm({ ...form, sector: v })}
              options={[...ONBOARDING_SECTORS]}
            />
            <SelectField
              label="Country"
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v })}
              options={[...ONBOARDING_COUNTRIES]}
            />
          </div>
          <Field
            label="Source"
            value={form.source}
            onChange={(v) => setForm({ ...form, source: v })}
            placeholder="Where did this contact come from?"
          />
          <TextArea
            label="Notes"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
            rows={3}
          />

          {editable && (
            <Button type="submit" disabled={saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? "Saving…" : contact ? "Save changes" : "Add contact"}
            </Button>
          )}
        </form>

        {contact && (
          <>
            {linkedDeals.length > 0 && (
              <section className="mt-7">
                <h3 className="mb-2 text-sm font-semibold text-foreground">Deals</h3>
                <ul className="space-y-1.5">
                  {linkedDeals.map((d) => (
                    <li key={d.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                      <span className="font-medium text-foreground">{d.title}</span>
                      {d.value_amount != null && (
                        <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                          {d.value_currency} {Number(d.value_amount).toLocaleString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {editable && (
              <section className="mt-7 rounded-xl border border-border bg-muted/20 p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Log outreach</h3>
                <div className="space-y-3">
                  <SelectField
                    label="Channel"
                    value={touch.channel}
                    onChange={(v) => setTouch({ ...touch, channel: v })}
                    options={[...CHANNELS]}
                  />
                  <Field
                    label="Outcome"
                    value={touch.outcome}
                    onChange={(v) => setTouch({ ...touch, outcome: v })}
                    placeholder="What came of it?"
                  />
                  <Field
                    label="Next follow-up"
                    type="date"
                    value={touch.next_follow_up}
                    onChange={(v) => setTouch({ ...touch, next_follow_up: v })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={logMutation.isPending}
                    onClick={() => logMutation.mutate()}
                  >
                    {logMutation.isPending ? "Logging…" : "Log this touch"}
                  </Button>
                </div>
              </section>
            )}

            <section className="mt-7">
              <h3 className="mb-2 text-sm font-semibold text-foreground">History</h3>
              {!timeline ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : timeline.outreach.length === 0 && timeline.meetings.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing logged yet.</p>
              ) : (
                <ul className="space-y-2">
                  {timeline.outreach.map((o) => (
                    <li key={o.id} className="rounded-lg border border-border px-3 py-2">
                      <p className="text-xs font-medium capitalize text-foreground">
                        {o.channel}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {new Date(o.occurred_at).toLocaleDateString()}
                        </span>
                      </p>
                      {o.outcome && <p className="text-xs text-muted-foreground">{o.outcome}</p>}
                      {o.next_follow_up && (
                        <p className="mt-1 text-[11px] text-primary">
                          Follow up {new Date(o.next_follow_up).toLocaleDateString()}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </aside>
    </div>
  );
}
