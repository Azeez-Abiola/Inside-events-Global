import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  upsertOrganiserProfile,
  upsertSponsorProfile,
  upsertReferralProfile,
  sendWelcomeEmail,
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
import type { SignupRole } from "@/lib/signup-roles";
import { ChipMulti, Field, SelectField, TextArea } from "@/components/signup/profile-fields";

export function SignupProfileStep({ role, onDone }: { role: SignupRole; onDone: () => void }) {
  if (role === "organiser") return <OrganiserForm onDone={onDone} />;
  if (role === "sponsor") return <SponsorForm onDone={onDone} />;
  if (role === "referral_partner") return <ReferralForm onDone={onDone} />;
  return <MediaSkipForm onDone={onDone} />;
}

function MediaSkipForm({ onDone }: { onDone: () => void }) {
  const welcome = useServerFn(sendWelcomeEmail);
  const [loading, setLoading] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Media partner accounts get a custom onboarding from our partnerships team — we'll be in touch.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            await welcome();
          } catch {
            /* welcome is best-effort */
          } finally {
            setLoading(false);
            onDone();
          }
        }}
        className="btn-primary w-full"
      >
        {loading ? "Finishing…" : "Continue to dashboard"}
      </button>
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
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-4"
    >
      <Field label="Organisation name" value={form.org_name} onChange={(v) => setForm({ ...form, org_name: v })} required />
      <Field label="Website" type="url" placeholder="https://…" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
      <TextArea label="Short bio" rows={3} value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} placeholder="What does your org do?" />
      <TextArea
        label="Event track record"
        rows={3}
        value={form.event_history}
        onChange={(v) => setForm({ ...form, event_history: v })}
        placeholder="Past editions, notable speakers / sponsors…"
      />
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Saving…" : "Finish & go to dashboard"}
      </button>
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
          await submit({
            data: {
              ...form,
              budget_range_min: form.budget_range_min ? Number(form.budget_range_min) : null,
              budget_range_max: form.budget_range_max ? Number(form.budget_range_max) : null,
            },
          });
          toast.success("Profile saved");
          onDone();
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setSaving(false);
        }
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
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Saving…" : "Finish & go to dashboard"}
      </button>
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
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setSaving(false);
        }
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
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Saving…" : "Finish & go to dashboard"}
      </button>
    </form>
  );
}
