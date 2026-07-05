import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Save, Send, Upload, X, Trash2, Plus } from "lucide-react";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { Field, TextArea, SelectField, ChipMulti, Checkbox } from "@/routes/onboarding.profile";
import {
  autosaveEvent, getEventForEdit, submitEvent, upsertTier, deleteTier, pickAutosavePatch,
} from "@/lib/events.functions";
import {
  COUNTRIES, EVENT_TYPES, PRIMARY_AUDIENCES, PRIMARY_SECTORS, SENIORITY,
  GEOGRAPHIC_MIX, EXPOSURE_CHANNELS, PAYMENT_TERMS, CURRENCIES,
} from "@/lib/event-taxonomy";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/events/edit/$id")({
  head: () => ({ meta: [{ title: "Edit event - IGE" }] }),
  component: EventEditor,
});

const STEPS = [
  "Basics", "Contacts", "Track record", "Audience", "Sector & theme",
  "Sponsorship economics", "Tiers", "Assets", "Review & submit",
];

function EventEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchEvent = useServerFn(getEventForEdit);
  const autosave = useServerFn(autosaveEvent);
  const submit = useServerFn(submitEvent);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEvent({ data: { id } }),
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const debouncer = useRef<number | null>(null);
  const initial = useRef(false);
  const formRef = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    if (data?.event && !initial.current) {
      setForm({ ...data.event });
      formRef.current = { ...data.event };
      setStep(Math.min(data.event.form_step_completed ?? 0, STEPS.length - 1));
      setSavedAt(data.event.updated_at ?? null);
      initial.current = true;
    }
  }, [data]);

  useEffect(() => {
    if (step === STEPS.length - 1) refetch();
  }, [step, refetch]);

  const editable = useMemo(() => {
    if (!data?.event) return false;
    return ["draft", "revision_requested"].includes(data.event.status);
  }, [data]);

  function update(patch: Record<string, any>) {
    setForm((f) => {
      const next = { ...(f ?? {}), ...patch };
      formRef.current = next;
      if (debouncer.current) window.clearTimeout(debouncer.current);
      debouncer.current = window.setTimeout(() => doSave(next, step), 700);
      return next;
    });
  }

  async function doSave(formSnapshot: Record<string, any>, nextStep = step) {
    if (!editable) return;
    try {
      const res = await autosave({ data: { id, step: nextStep, patch: pickAutosavePatch(formSnapshot) } });
      setSavedAt(res.savedAt);
      setForm((f) => (f ? { ...f, form_step_completed: Math.max(f.form_step_completed ?? 0, nextStep) } : f));
    } catch (e: any) { toast.error(`Autosave: ${e.message}`); }
  }

  async function flushSave(nextStep = step) {
    if (!editable || !formRef.current) return;
    if (debouncer.current) {
      window.clearTimeout(debouncer.current);
      debouncer.current = null;
    }
    const res = await autosave({ data: { id, step: nextStep, patch: pickAutosavePatch(formRef.current) } });
    setSavedAt(res.savedAt);
    setForm((f) => (f ? { ...f, form_step_completed: Math.max(f.form_step_completed ?? 0, nextStep) } : f));
  }

  async function handleSaveDraft(nextStep = step) {
    if (!editable) return;
    setSaving(true);
    try {
      await flushSave(nextStep);
      await refetch();
      toast.success("Draft saved");
    } catch (e: any) {
      toast.error(e.message ?? "Could not save draft");
    } finally {
      setSaving(false);
    }
  }

  async function goToStep(next: number) {
    if (!editable) {
      setStep(next);
      return;
    }
    setSaving(true);
    try {
      await flushSave(Math.max(step, next));
      setStep(next);
    } catch (e: any) {
      toast.error(e.message ?? "Could not save progress");
    } finally {
      setSaving(false);
    }
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      try {
        await flushSave(STEPS.length - 1);
      } catch (e: any) {
        throw new Error(`Could not save your latest changes: ${e.message}`);
      }
      return submit({ data: { id } });
    },
    onSuccess: () => {
      toast.success("Submitted for vetting");
      qc.invalidateQueries({ queryKey: ["event", id] });
      qc.invalidateQueries({ queryKey: ["events", "mine"] });
      navigate({ to: "/dashboard" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !form) {
    return <AppShell><div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Back to dashboard</Link>
          <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-tight">{form.name || "Untitled event"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={data!.event.status} />
          {savedAt && <span className="hidden text-xs text-muted-foreground sm:inline"><Save className="mr-1 inline h-3 w-3" /> Saved {new Date(savedAt).toLocaleTimeString()}</span>}
          {editable && (
            <button
              type="button"
              onClick={() => handleSaveDraft()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save draft
            </button>
          )}
        </div>
      </div>

      {!editable && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This event is <strong>{data!.event.status.replace(/_/g, " ")}</strong> - it is read-only.
          {data!.event.vetting_notes && <div className="mt-1 text-xs">Reviewer notes: {data!.event.vetting_notes}</div>}
          {data!.event.rejection_reason && <div className="mt-1 text-xs">Rejection reason: {data!.event.rejection_reason}</div>}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Steps */}
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const active = i === step;
            const done = (form.form_step_completed ?? 0) >= i && !active;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  disabled={saving}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active ? "bg-brand-soft font-semibold text-primary-deep" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? "bg-brand-gradient text-white" : done ? "bg-secondary/15 text-secondary-deep" : "bg-muted text-muted-foreground"
                  }`}>{done ? <Check className="h-3 w-3" /> : i + 1}</span>
                  {s}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <fieldset disabled={!editable} className="space-y-5">
            {step === 0 && <StepBasics form={form} update={update} />}
            {step === 1 && <StepContacts form={form} update={update} />}
            {step === 2 && <StepTrackRecord form={form} update={update} />}
            {step === 3 && <StepAudience form={form} update={update} />}
            {step === 4 && <StepSector form={form} update={update} />}
            {step === 5 && <StepEconomics form={form} update={update} />}
          </fieldset>
          {step === 6 && (
            <StepTiers eventId={id} currency={form.currency || "NGN"} tiers={data!.tiers} editable={editable} />
          )}
          <fieldset disabled={!editable} className="space-y-5">
            {step === 7 && <StepAssets eventId={id} form={form} update={update} />}
            {step === 8 && (
              <StepReview
                form={form} update={update}
                tierCount={data!.tiers.length}
                onSubmit={() => submitMutation.mutate()}
                submitting={submitMutation.isPending}
                editable={editable}
              />
            )}
          </fieldset>
          <div className="mt-8 flex justify-between border-t border-border pt-5">
            <button type="button" onClick={() => goToStep(Math.max(0, step - 1))} disabled={step === 0 || saving} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium disabled:opacity-50"><ArrowLeft className="h-4 w-4" /> Back</button>
            <div className="flex items-center gap-2">
              {editable && (
                <button
                  type="button"
                  onClick={() => handleSaveDraft()}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save draft
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button type="button" onClick={() => goToStep(Math.min(STEPS.length - 1, step + 1))} disabled={saving} className="inline-flex items-center gap-1 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Next <ArrowRight className="h-4 w-4" /></>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ──────────── steps ──────────── */
function StepBasics({ form, update }: any) {
  return (
    <>
      <Field label="Event name" required value={form.name ?? ""} onChange={(v: string) => update({ name: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Event type" value={form.event_type ?? ""} onChange={(v) => update({ event_type: v })} options={EVENT_TYPES} />
        <SelectField label="Format" value={form.format ?? ""} onChange={(v) => update({ format: v })} options={["in-person", "virtual", "hybrid"]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" type="date" value={form.start_date ?? ""} onChange={(v: string) => update({ start_date: v })} />
        <Field label="End date" type="date" value={form.end_date ?? ""} onChange={(v: string) => update({ end_date: v })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Country" value={form.country ?? ""} onChange={(v) => update({ country: v })} options={COUNTRIES} />
        <Field label="City" value={form.city ?? ""} onChange={(v: string) => update({ city: v })} />
      </div>
      <Field label="Venue" value={form.venue ?? ""} onChange={(v: string) => update({ venue: v })} />
      <Field label="Event website" type="url" placeholder="https://…" value={form.website ?? ""} onChange={(v: string) => update({ website: v })} />
    </>
  );
}
function StepContacts({ form, update }: any) {
  return (
    <>
      <Field label="Contact name" value={form.organiser_contact_name ?? ""} onChange={(v: string) => update({ organiser_contact_name: v })} />
      <Field label="Role / title" value={form.organiser_contact_role ?? ""} onChange={(v: string) => update({ organiser_contact_role: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" type="email" value={form.organiser_contact_email ?? ""} onChange={(v: string) => update({ organiser_contact_email: v })} />
        <Field label="Phone" value={form.organiser_contact_phone ?? ""} onChange={(v: string) => update({ organiser_contact_phone: v })} />
      </div>
    </>
  );
}
function StepTrackRecord({ form, update }: any) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Years running" type="number" value={form.years_running_event ?? ""} onChange={(v: string) => update({ years_running_event: v ? Number(v) : null })} />
        <Field label="Past editions" type="number" value={form.past_editions ?? ""} onChange={(v: string) => update({ past_editions: v ? Number(v) : null })} />
        <Field label="Expected attendance" type="number" value={form.attendance_size ?? ""} onChange={(v: string) => update({ attendance_size: v ? Number(v) : null })} />
      </div>
    </>
  );
}
function StepAudience({ form, update }: any) {
  return (
    <>
      <ChipMulti label="Primary audience" options={PRIMARY_AUDIENCES} value={form.primary_audience ?? []} onChange={(v) => update({ primary_audience: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Audience seniority" value={form.audience_seniority ?? ""} onChange={(v) => update({ audience_seniority: v })} options={SENIORITY} />
        <Field label="% decision makers" type="number" value={form.decision_makers_pct ?? ""} onChange={(v: string) => update({ decision_makers_pct: v ? Number(v) : null })} />
      </div>
      <ChipMulti label="Geographic mix" options={GEOGRAPHIC_MIX} value={form.geographic_mix ?? []} onChange={(v) => update({ geographic_mix: v })} />
    </>
  );
}
function StepSector({ form, update }: any) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Primary sector" value={form.primary_sector ?? ""} onChange={(v) => update({ primary_sector: v })} options={PRIMARY_SECTORS} />
        <SelectField label="Secondary sector" value={form.secondary_sector ?? ""} onChange={(v) => update({ secondary_sector: v })} options={PRIMARY_SECTORS} />
      </div>
      <Field label="Event theme / tagline" value={form.event_theme ?? ""} onChange={(v: string) => update({ event_theme: v })} />
    </>
  );
}
function StepEconomics({ form, update }: any) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Minimum sponsorship spend" type="number" value={form.min_sponsorship_spend ?? ""} onChange={(v: string) => update({ min_sponsorship_spend: v ? Number(v) : null })} />
        <SelectField label="Currency" value={form.currency ?? "NGN"} onChange={(v) => update({ currency: v })} options={[...CURRENCIES]} />
        <Field label="Speaking slots" type="number" value={form.speaking_slots ?? ""} onChange={(v: string) => update({ speaking_slots: v ? Number(v) : null })} />
      </div>
      <ChipMulti label="Exposure channels offered" options={EXPOSURE_CHANNELS} value={form.exposure_channels ?? []} onChange={(v) => update({ exposure_channels: v })} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Checkbox label="Speaking opportunities" checked={!!form.speaking_opps} onChange={(v) => update({ speaking_opps: v })} />
        <Checkbox label="Lead capture provided" checked={!!form.lead_capture} onChange={(v) => update({ lead_capture: v })} />
        <Checkbox label="Post-event report" checked={!!form.post_event_report} onChange={(v) => update({ post_event_report: v })} />
      </div>
    </>
  );
}

function StepTiers({ eventId, currency, tiers, editable }: { eventId: string; currency: string; tiers: any[]; editable: boolean }) {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertTier);
  const remove = useServerFn(deleteTier);
  const [draft, setDraft] = useState({ tier_name: "", price: "", slots_total: "1", is_exclusive: false, custom_options: "" });
  const upsertMut = useMutation({
    mutationFn: (payload: any) => upsert({ data: payload }),
    onSuccess: (res) => {
      qc.setQueryData(["event", eventId], (old: any) => {
        if (!old) return old;
        const tiers = [...(old.tiers ?? [])];
        const idx = tiers.findIndex((t: any) => t.id === res.tier.id);
        if (idx >= 0) tiers[idx] = res.tier;
        else tiers.push(res.tier);
        return { ...old, tiers };
      });
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      setDraft({ tier_name: "", price: "", slots_total: "1", is_exclusive: false, custom_options: "" });
      toast.success("Tier saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (_res, tierId) => {
      qc.setQueryData(["event", eventId], (old: any) => {
        if (!old) return old;
        return { ...old, tiers: (old.tiers ?? []).filter((t: any) => t.id !== tierId) };
      });
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      toast.success("Tier removed");
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <>
      <div className="space-y-2">
        {tiers.length === 0 && <p className="text-sm text-muted-foreground">No tiers yet - add your first one below.</p>}
        {tiers.map((t, i) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
            <div>
              <div className="font-semibold">{t.tier_name}</div>
              <div className="text-xs text-muted-foreground">
                {t.currency} {Number(t.price).toLocaleString()} · {t.slots_total} slot{t.slots_total === 1 ? "" : "s"}
                {t.is_exclusive && " · exclusive"}
              </div>
            </div>
            {editable && (
              <button type="button" onClick={() => delMut.mutate(t.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            )}
          </div>
        ))}
      </div>
      {editable && (
        <div className="rounded-xl border border-dashed border-border p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Tier name" value={draft.tier_name} onChange={(v: string) => setDraft({ ...draft, tier_name: v })} />
            <Field label={`Price (${currency})`} type="number" value={draft.price} onChange={(v: string) => setDraft({ ...draft, price: v })} />
            <Field label="Total slots" type="number" value={draft.slots_total} onChange={(v: string) => setDraft({ ...draft, slots_total: v })} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Checkbox label="Exclusive (single slot only)" checked={draft.is_exclusive} onChange={(v) => setDraft({ ...draft, is_exclusive: v })} />
            <button
              type="button"
              disabled={upsertMut.isPending}
              onClick={() => {
                if (!draft.tier_name.trim() || !draft.price) return toast.error("Tier name and price required");
                upsertMut.mutate({
                  event_id: eventId, tier_name: draft.tier_name.trim(),
                  price: Number(draft.price), currency,
                  slots_total: Number(draft.slots_total) || 1, is_exclusive: draft.is_exclusive,
                  custom_options: draft.custom_options || null, display_order: tiers.length, assets: [],
                });
              }}
              className="inline-flex items-center gap-1 rounded-md bg-brand-gradient px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >{upsertMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add tier</button>
          </div>
        </div>
      )}
    </>
  );
}

function StepAssets({ eventId, form, update }: any) {
  return (
    <>
      <AssetUpload label="Sponsorship deck (PDF)" accept=".pdf" eventId={eventId} field="sponsorship_deck_url" value={form.sponsorship_deck_url} update={update} />
      <AssetUpload label="Banner image" accept="image/*" eventId={eventId} field="banner_image_url" value={form.banner_image_url} update={update} />
      <AssetUpload label="Floor plan (optional)" accept="image/*,.pdf" eventId={eventId} field="floor_plan_url" value={form.floor_plan_url} update={update} />
    </>
  );
}

function AssetUpload({ label, accept, eventId, field, value, update }: { label: string; accept: string; eventId: string; field: string; value: string | null; update: (p: any) => void }) {
  const [uploading, setUploading] = useState(false);
  async function onFile(f: File | null) {
    if (!f) return;
    setUploading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("You must be signed in to upload files");

      // Storage RLS requires the first path segment to be auth.uid().
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${eventId}/${field}-${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("event-assets").upload(path, f, {
        upsert: true,
        contentType: f.type || undefined,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("event-assets").getPublicUrl(path);
      update({ [field]: pub.publicUrl });
      toast.success(`${label} uploaded`);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium">{label}</div>
      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm">
          <a href={value} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">{value.split("/").pop()}</a>
          <button onClick={() => update({ [field]: null })} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground hover:bg-muted ${uploading ? "opacity-60" : ""}`}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Click to upload"}
          <input type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        </label>
      )}
    </div>
  );
}

function getSubmitBlockers(form: Record<string, any>, tierCount: number) {
  const blockers: string[] = [];
  if (!form.consent_given) blockers.push("Confirm the accuracy consent checkbox");
  if (!form.sponsorship_deck_url) blockers.push("Upload a sponsorship deck (PDF) in the Assets step");
  if (!form.banner_image_url) blockers.push("Upload a banner image in the Assets step");
  if (tierCount < 1) blockers.push("Add at least one sponsorship tier in the Tiers step");
  return blockers;
}

function StepReview({ form, update, tierCount, onSubmit, submitting, editable }: any) {
  const blockers = getSubmitBlockers(form, tierCount);

  // Already through submission — can't re-submit.
  if (!editable) {
    const label = (form.status ?? "").replace(/_/g, " ");
    return (
      <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-6 text-center">
        <div className="font-display text-lg font-bold text-secondary-deep capitalize">
          This event is {label || "submitted"}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          It has already been submitted for vetting and can't be edited or re-submitted.
          {form.status === "approved" || form.status === "listed"
            ? " It's live — you can view it on the marketplace."
            : " You'll be notified when the IGE team completes the review."}
        </p>
        {form.slug && (form.status === "approved" || form.status === "listed") && (
          <a href={`/events/${form.slug}`} className="mt-4 inline-block rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white">
            View public listing →
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sponsorship deadline" type="date" value={form.sponsorship_deadline ?? ""} onChange={(v: string) => update({ sponsorship_deadline: v })} />
        <SelectField label="Payment terms" value={form.payment_terms ?? ""} onChange={(v) => update({ payment_terms: v })} options={PAYMENT_TERMS} />
      </div>
      <Checkbox label="I'd like ABW to manage sponsorships on my behalf (optional)" checked={!!form.abw_management_requested} onChange={(v) => update({ abw_management_requested: v })} />
      <Checkbox
        label="I confirm I have the right to list this event and that the information provided is accurate."
        checked={!!form.consent_given} onChange={(v) => update({ consent_given: v })}
      />
      {blockers.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Before you can submit:</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {blockers.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}
      <div className="rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        Submitting moves your event into IGE's vetting queue. You'll be notified by email when it's approved, listed, or sent back for revisions.
      </div>
      <button
        type="button"
        onClick={() => {
          if (blockers.length > 0) {
            toast.error(blockers[0]);
            return;
          }
          onSubmit();
        }}
        disabled={submitting || !editable || blockers.length > 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit for IGE vetting
      </button>
    </>
  );
}
