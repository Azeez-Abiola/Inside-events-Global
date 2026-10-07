import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, Check, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextArea } from "@/components/signup/profile-fields";
import { InfoTip } from "@/components/info-tip";
import {
  ACTIVATION_TYPES,
  addEvidence,
  deleteMilestone,
  getActivationEvidence,
  toggleMilestone,
  upsertActivation,
  upsertMilestone,
  type Activation,
  type ActivationMilestone,
  type ActivationTeamMember,
} from "@/lib/activations.functions";
import { ONBOARDING_COUNTRIES, ONBOARDING_CURRENCIES } from "@/lib/onboarding-constants";

const TYPE_OPTIONS = ACTIVATION_TYPES.map((t) => t.replace(/_/g, " "));

/** One activation: its detail, milestones, and the evidence it produced. */
export function ActivationDrawer({
  activation,
  milestones,
  team,
  editable,
  onClose,
  onSaved,
}: {
  activation: Activation | null;
  milestones: ActivationMilestone[];
  team: ActivationTeamMember[];
  editable: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(upsertActivation);
  const addMilestone = useServerFn(upsertMilestone);
  const toggle = useServerFn(toggleMilestone);
  const removeMilestone = useServerFn(deleteMilestone);
  const logEvidence = useServerFn(addEvidence);
  const fetchEvidence = useServerFn(getActivationEvidence);

  const [form, setForm] = useState({
    name: activation?.name ?? "",
    activation_type: activation?.activation_type ?? "other",
    venue: activation?.venue ?? "",
    city: activation?.city ?? "",
    country: activation?.country ?? "",
    starts_on: activation?.starts_on ?? "",
    ends_on: activation?.ends_on ?? "",
    event_date: activation?.event_date ?? "",
    owner_id: activation?.owner_id ?? "",
    vendor_name: activation?.vendor_name ?? "",
    budget_amount: activation?.budget_amount != null ? String(activation.budget_amount) : "",
    budget_currency: activation?.budget_currency ?? "NGN (₦)",
    notes: activation?.notes ?? "",
  });
  const [milestone, setMilestone] = useState({ title: "", due_on: "" });
  const [evidence, setEvidence] = useState({ kind: "note", caption: "", attendance: "" });

  const { data: evidenceData } = useQuery({
    queryKey: ["activation-evidence", activation?.id],
    enabled: !!activation?.id,
    queryFn: () => fetchEvidence({ data: { activation_id: activation!.id } }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: activation?.id,
          name: form.name.trim(),
          activation_type: form.activation_type as (typeof ACTIVATION_TYPES)[number],
          venue: form.venue.trim() || undefined,
          city: form.city.trim() || undefined,
          country: form.country || undefined,
          starts_on: form.starts_on || null,
          ends_on: form.ends_on || null,
          event_date: form.event_date || null,
          owner_id: form.owner_id || null,
          vendor_name: form.vendor_name.trim() || undefined,
          budget_amount: form.budget_amount ? Number(form.budget_amount) : null,
          budget_currency: form.budget_currency,
          notes: form.notes.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success(activation ? "Activation updated" : "Activation created");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const milestoneMutation = useMutation({
    mutationFn: () =>
      addMilestone({
        data: {
          activation_id: activation!.id,
          title: milestone.title.trim(),
          due_on: milestone.due_on || null,
          position: milestones.length,
        },
      }),
    onSuccess: () => {
      setMilestone({ title: "", due_on: "" });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const evidenceMutation = useMutation({
    mutationFn: () =>
      logEvidence({
        data: {
          activation_id: activation!.id,
          kind: evidence.kind as "photo" | "video" | "attendance" | "note" | "document",
          caption: evidence.caption.trim() || undefined,
          attendance_count: evidence.attendance ? Number(evidence.attendance) : null,
        },
      }),
    onSuccess: () => {
      toast.success("Evidence recorded");
      setEvidence({ kind: "note", caption: "", attendance: "" });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-brand"
        role="dialog"
        aria-label={activation ? `Activation: ${activation.name}` : "New activation"}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-foreground">
            {activation ? activation.name : "New activation"}
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
              toast.error("Give the activation a name.");
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
            label="Type"
            value={form.activation_type.replace(/_/g, " ")}
            onChange={(v) => setForm({ ...form, activation_type: v.replace(/ /g, "_") })}
            options={TYPE_OPTIONS}
          />
          <Field
            label="Venue"
            value={form.venue}
            onChange={(v) => setForm({ ...form, venue: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <SelectField
              label="Country"
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v })}
              options={[...ONBOARDING_COUNTRIES]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Starts"
              type="date"
              value={form.starts_on}
              onChange={(v) => setForm({ ...form, starts_on: v })}
            />
            <Field
              label="Ends"
              type="date"
              value={form.ends_on}
              onChange={(v) => setForm({ ...form, ends_on: v })}
            />
          </div>
          <Field
            label="Event date"
            type="date"
            value={form.event_date}
            onChange={(v) => setForm({ ...form, event_date: v })}
          />

          <label className="block">
            <span className="mb-1.5 flex items-center text-sm font-medium">
              Responsible person
              <InfoTip tip="activation.owner" />
            </span>
            <select
              value={form.owner_id}
              onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring"
            >
              <option value="">Nobody yet</option>
              {team.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Agency or vendor"
            value={form.vendor_name}
            onChange={(v) => setForm({ ...form, vendor_name: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Budget"
              type="number"
              value={form.budget_amount}
              onChange={(v) => setForm({ ...form, budget_amount: v })}
            />
            <SelectField
              label="Currency"
              value={form.budget_currency}
              onChange={(v) => setForm({ ...form, budget_currency: v })}
              options={[...ONBOARDING_CURRENCIES]}
            />
          </div>
          <TextArea
            label="Notes"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
            rows={3}
          />

          {editable && (
            <Button type="submit" disabled={saveMutation.isPending} className="w-full">
              {saveMutation.isPending
                ? "Saving…"
                : activation
                  ? "Save changes"
                  : "Create activation"}
            </Button>
          )}
        </form>

        {activation && (
          <>
            <section className="mt-7">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Milestones</h3>
              {milestones.length === 0 ? (
                <p className="text-xs text-muted-foreground">None yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {milestones.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() =>
                          toggle({ data: { id: m.id, done: !m.completed_at } }).then(onSaved)
                        }
                        aria-label={
                          m.completed_at ? `Mark ${m.title} not done` : `Mark ${m.title} done`
                        }
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          m.completed_at
                            ? "border-secondary bg-secondary text-white"
                            : "border-border"
                        }`}
                      >
                        {m.completed_at && <Check className="h-3 w-3" />}
                      </button>
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${m.completed_at ? "text-muted-foreground line-through" : "text-foreground"}`}
                      >
                        {m.title}
                      </span>
                      {m.due_on && (
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {new Date(m.due_on).toLocaleDateString()}
                        </span>
                      )}
                      {editable && (
                        <button
                          type="button"
                          onClick={() => removeMilestone({ data: { id: m.id } }).then(onSaved)}
                          aria-label={`Delete ${m.title}`}
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
                <div className="mt-2 flex gap-2">
                  <input
                    value={milestone.title}
                    onChange={(e) => setMilestone({ ...milestone, title: e.target.value })}
                    placeholder="Add a milestone"
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <input
                    type="date"
                    value={milestone.due_on}
                    onChange={(e) => setMilestone({ ...milestone, due_on: e.target.value })}
                    className="shrink-0 rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!milestone.title.trim() || milestoneMutation.isPending}
                    onClick={() => milestoneMutation.mutate()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </section>

            <section className="mt-7 rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="mb-1 flex items-center text-sm font-semibold text-foreground">
                <Camera className="mr-1.5 h-4 w-4 text-muted-foreground" />
                Evidence
                <InfoTip tip="activation.evidence" />
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Photos, attendance counts and notes. This is what a renewal conversation is built
                on, and what the Investment Report will read from.
              </p>

              {evidenceData?.evidence.length ? (
                <ul className="mb-3 space-y-1.5">
                  {evidenceData.evidence.map((e) => (
                    <li key={e.id} className="rounded-lg border border-border bg-card px-3 py-2">
                      <p className="text-xs font-medium capitalize text-foreground">
                        {e.kind}
                        {e.attendance_count != null && (
                          <span className="ml-2 font-normal tabular-nums text-muted-foreground">
                            {e.attendance_count.toLocaleString()} attended
                          </span>
                        )}
                      </p>
                      {e.caption && <p className="text-xs text-muted-foreground">{e.caption}</p>}
                    </li>
                  ))}
                </ul>
              ) : null}

              {editable && (
                <div className="space-y-2">
                  <SelectField
                    label="Kind"
                    value={evidence.kind}
                    onChange={(v) => setEvidence({ ...evidence, kind: v })}
                    options={["note", "photo", "video", "attendance", "document"]}
                  />
                  {evidence.kind === "attendance" && (
                    <Field
                      label="How many attended"
                      type="number"
                      value={evidence.attendance}
                      onChange={(v) => setEvidence({ ...evidence, attendance: v })}
                    />
                  )}
                  <Field
                    label="Caption"
                    value={evidence.caption}
                    onChange={(v) => setEvidence({ ...evidence, caption: v })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={evidenceMutation.isPending}
                    onClick={() => evidenceMutation.mutate()}
                  >
                    {evidenceMutation.isPending ? "Recording…" : "Record evidence"}
                  </Button>
                </div>
              )}
            </section>
          </>
        )}
      </aside>
    </div>
  );
}
