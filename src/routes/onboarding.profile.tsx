import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { useAuth } from "@/lib/auth-context";
import {
  upsertOrganiserProfile,
  upsertSponsorProfile,
  upsertReferralProfile,
} from "@/lib/profile.functions";
import {
  COMPANY_SIZES,
  COUNTRIES,
  PRIMARY_SECTORS,
  PRIMARY_AUDIENCES,
  GEOGRAPHIC_MIX,
  CURRENCIES,
  SECTOR_EXPERTISE,
} from "@/lib/event-taxonomy";

export const Route = createFileRoute("/onboarding/profile")({
  head: () => ({ meta: [{ title: "Complete your profile — IGE" }] }),
  component: OnboardingProfile,
});

function OnboardingProfile() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const primaryRole = roles[0];

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!primaryRole) navigate({ to: "/onboarding" });
  }, [loading, user, primaryRole, navigate]);

  if (loading || !primaryRole) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <AuthShell
      title="Complete your profile"
      subtitle="Just a few details so we can match you with the right opportunities."
    >
      {primaryRole === "organiser" && <OrganiserForm onDone={() => navigate({ to: "/dashboard" })} />}
      {primaryRole === "sponsor" && <SponsorForm onDone={() => navigate({ to: "/dashboard" })} />}
      {primaryRole === "referral_partner" && <ReferralForm onDone={() => navigate({ to: "/dashboard" })} />}
      {primaryRole === "media_partner" && (
        <SkipForm onDone={() => navigate({ to: "/dashboard" })} />
      )}
    </AuthShell>
  );
}

function SkipForm({ onDone }: { onDone: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Media partner accounts get a custom onboarding from our partnerships team — we'll be in touch.
      </p>
      <button onClick={onDone} className="btn-primary w-full">Continue to dashboard</button>
    </div>
  );
}

function OrganiserForm({ onDone }: { onDone: () => void }) {
  const submit = useServerFn(upsertOrganiserProfile);
  const [form, setForm] = useState({ org_name: "", bio: "", website: "", event_history: "" });
  const [saving, setSaving] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.org_name.trim()) return toast.error("Organisation name is required");
        setSaving(true);
        try {
          await submit({ data: form });
          toast.success("Profile saved");
          onDone();
        } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
      }}
      className="space-y-4"
    >
      <Field label="Organisation name" value={form.org_name} onChange={(v) => setForm({ ...form, org_name: v })} required />
      <Field label="Website" type="url" placeholder="https://…" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
      <TextArea label="Short bio" rows={3} value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} placeholder="What does your org do?" />
      <TextArea label="Event track record" rows={3} value={form.event_history} onChange={(v) => setForm({ ...form, event_history: v })} placeholder="Past editions, notable speakers / sponsors…" />
      <button disabled={saving} className="btn-primary w-full">{saving ? "Saving…" : "Save & continue"}</button>
    </form>
  );
}

function SponsorForm({ onDone }: { onDone: () => void }) {
  const submit = useServerFn(upsertSponsorProfile);
  const [form, setForm] = useState({
    brand_name: "",
    industry: "",
    company_size: "",
    hq_country: "",
    hq_city: "",
    preferred_currency: "USD",
    sponsorship_sectors: [] as string[],
    target_geographies: [] as string[],
    audience_types: [] as string[],
    budget_range_min: "" as string,
    budget_range_max: "" as string,
  });
  const [saving, setSaving] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.brand_name.trim()) return toast.error("Brand name is required");
        setSaving(true);
        try {
          await submit({ data: {
            ...form,
            budget_range_min: form.budget_range_min ? Number(form.budget_range_min) : null,
            budget_range_max: form.budget_range_max ? Number(form.budget_range_max) : null,
          } });
          toast.success("Profile saved");
          onDone();
        } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
      }}
      className="space-y-4"
    >
      <Field label="Brand name" value={form.brand_name} onChange={(v) => setForm({ ...form, brand_name: v })} required />
      <Field label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Company size" value={form.company_size} onChange={(v) => setForm({ ...form, company_size: v })} options={COMPANY_SIZES} />
        <SelectField label="HQ country" value={form.hq_country} onChange={(v) => setForm({ ...form, hq_country: v })} options={COUNTRIES} />
      </div>
      <Field label="HQ city" value={form.hq_city} onChange={(v) => setForm({ ...form, hq_city: v })} />
      <ChipMulti label="Sponsorship sectors" options={PRIMARY_SECTORS} value={form.sponsorship_sectors} onChange={(v) => setForm({ ...form, sponsorship_sectors: v })} />
      <ChipMulti label="Target geographies" options={GEOGRAPHIC_MIX} value={form.target_geographies} onChange={(v) => setForm({ ...form, target_geographies: v })} />
      <ChipMulti label="Audience types" options={PRIMARY_AUDIENCES} value={form.audience_types} onChange={(v) => setForm({ ...form, audience_types: v })} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Min budget" type="number" value={form.budget_range_min} onChange={(v) => setForm({ ...form, budget_range_min: v })} />
        <Field label="Max budget" type="number" value={form.budget_range_max} onChange={(v) => setForm({ ...form, budget_range_max: v })} />
        <SelectField label="Currency" value={form.preferred_currency} onChange={(v) => setForm({ ...form, preferred_currency: v })} options={[...CURRENCIES]} />
      </div>
      <button disabled={saving} className="btn-primary w-full">{saving ? "Saving…" : "Save & continue"}</button>
    </form>
  );
}

function ReferralForm({ onDone }: { onDone: () => void }) {
  const submit = useServerFn(upsertReferralProfile);
  const [form, setForm] = useState({
    full_name: "",
    professional_title: "",
    professional_bg: "",
    sponsor_network_desc: "",
    linkedin_url: "",
    payout_currency: "NGN" as "NGN" | "USD" | "GBP" | "EUR",
    sector_expertise: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.full_name.trim()) return toast.error("Full name is required");
        setSaving(true);
        try {
          await submit({ data: form });
          toast.success("Profile saved");
          onDone();
        } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
      }}
      className="space-y-4"
    >
      <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
      <Field label="Professional title" value={form.professional_title} onChange={(v) => setForm({ ...form, professional_title: v })} />
      <Field label="LinkedIn URL" type="url" placeholder="https://linkedin.com/in/…" value={form.linkedin_url} onChange={(v) => setForm({ ...form, linkedin_url: v })} />
      <TextArea label="Professional background" rows={3} value={form.professional_bg} onChange={(v) => setForm({ ...form, professional_bg: v })} />
      <TextArea label="Describe your sponsor network" rows={3} value={form.sponsor_network_desc} onChange={(v) => setForm({ ...form, sponsor_network_desc: v })} />
      <ChipMulti label="Sector expertise" options={SECTOR_EXPERTISE} value={form.sector_expertise} onChange={(v) => setForm({ ...form, sector_expertise: v })} />
      <SelectField label="Payout currency" value={form.payout_currency} onChange={(v) => setForm({ ...form, payout_currency: v as any })} options={[...CURRENCIES]} />
      <button disabled={saving} className="btn-primary w-full">{saving ? "Saving…" : "Save & continue"}</button>
    </form>
  );
}

// ───── Reusable field primitives ─────
export function Field({ label, value, onChange, type = "text", required, placeholder }: any) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
export function TextArea({ label, value, onChange, rows = 3, placeholder }: any) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
export function ChipMulti({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              type="button"
              key={o}
              onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                on ? "border-primary bg-brand-soft text-primary-deep" : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-input" />
      <span>{label}</span>
    </label>
  );
}
