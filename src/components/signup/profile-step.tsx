import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  upsertOrganiserProfile,
  upsertSponsorProfile,
  upsertReferralProfile,
  upsertMediaPartnerProfile,
  updateBaseProfile,
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
import { readSignupAccountDraft, clearSignupAccountDraft } from "@/lib/signup-roles";
import { ChipMulti, Field, SelectField, TextArea } from "@/components/signup/profile-fields";

const signupPrimaryBtn =
  "inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60";

/** Turn Zod / server error payloads into a short toast message. */
function friendlyFormError(err: unknown, fallback = "Could not save profile") {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === "object") {
      const first = parsed[0] as { message?: string; path?: string[] };
      if (first.message) {
        const field = first.path?.[0];
        if (field === "event_history") return first.message.includes("at most")
          ? first.message
          : "Event track record is too long. Please shorten it and try again.";
        if (field === "bio") return first.message.includes("at most")
          ? first.message
          : "Short bio is too long. Please shorten it and try again.";
        return first.message;
      }
    }
  } catch {
    /* not JSON */
  }
  if (raw.includes("too_big") && raw.includes("event_history")) {
    return "Event track record must be at most 10,000 characters.";
  }
  return raw.length > 180 ? fallback : raw;
}

async function applyAccountDraft(
  updateProfile: (args: { data: { display_name?: string | null; phone?: string | null } }) => Promise<unknown>,
) {
  const draft = readSignupAccountDraft();
  if (!draft) return null;
  await updateProfile({
    data: {
      display_name: draft.fullName || null,
      phone: draft.phone || null,
    },
  });
  return draft;
}

export function SignupProfileStep({ role, onDone }: { role: SignupRole; onDone: () => void }) {
  if (role === "organiser") return <OrganiserForm onDone={onDone} />;
  if (role === "sponsor") return <SponsorForm onDone={onDone} />;
  if (role === "referral_partner") return <ReferralForm onDone={onDone} />;
  return <MediaForm onDone={onDone} />;
}

function MediaForm({ onDone }: { onDone: () => void }) {
  const draft = readSignupAccountDraft();
  const submit = useServerFn(upsertMediaPartnerProfile);
  const updateProfile = useServerFn(updateBaseProfile);
  const [outletName, setOutletName] = useState(draft?.companyName ?? "");
  const [saving, setSaving] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!outletName.trim()) return toast.error("Outlet / company name is required");
        setSaving(true);
        try {
          await applyAccountDraft(updateProfile);
          await submit({ data: { outlet_name: outletName.trim(), beat_sectors: [] } });
          clearSignupAccountDraft();
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
      <p className="text-sm text-muted-foreground">
        Media partner accounts get tailored onboarding from our partnerships team after approval.
      </p>
      <Field label="Outlet / company name" value={outletName} onChange={setOutletName} required />
      <button type="submit" disabled={saving} className={signupPrimaryBtn}>
        {saving ? "Saving…" : "Finish & go to dashboard"}
      </button>
    </form>
  );
}

function OrganiserForm({ onDone }: { onDone: () => void }) {
  const draft = readSignupAccountDraft();
  const submit = useServerFn(upsertOrganiserProfile);
  const updateProfile = useServerFn(updateBaseProfile);
  const [form, setForm] = useState({
    org_name: draft?.companyName || draft?.fullName || "",
    bio: "",
    website: "",
    event_history: "",
  });
  const [saving, setSaving] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.org_name.trim()) return toast.error("Organisation name is required");
        setSaving(true);
        try {
          await applyAccountDraft(updateProfile);
          await submit({ data: form });
          clearSignupAccountDraft();
          toast.success("Profile saved");
          onDone();
        } catch (err: any) {
          toast.error(friendlyFormError(err));
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-4"
    >
      <Field label="Organisation name" value={form.org_name} onChange={(v) => setForm({ ...form, org_name: v })} required />
      <Field label="Website" type="url" placeholder="https://…" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
      <TextArea
        label="Short bio"
        rows={3}
        value={form.bio}
        onChange={(v) => setForm({ ...form, bio: v })}
        placeholder="What does your org do?"
        maxLength={5000}
      />
      <TextArea
        label="Event track record"
        rows={6}
        value={form.event_history}
        onChange={(v) => setForm({ ...form, event_history: v })}
        placeholder="Past editions, notable speakers / sponsors…"
        maxLength={10000}
        hint="List past editions and key highlights — up to 10,000 characters."
      />
      <button type="submit" disabled={saving} className={signupPrimaryBtn}>
        {saving ? "Saving…" : "Finish & go to dashboard"}
      </button>
    </form>
  );
}

function SponsorForm({ onDone }: { onDone: () => void }) {
  const draft = readSignupAccountDraft();
  const submit = useServerFn(upsertSponsorProfile);
  const updateProfile = useServerFn(updateBaseProfile);
  const [form, setForm] = useState({
    brand_name: draft?.companyName || draft?.fullName || "",
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
          await applyAccountDraft(updateProfile);
          await submit({
            data: {
              ...form,
              budget_range_min: form.budget_range_min ? Number(form.budget_range_min) : null,
              budget_range_max: form.budget_range_max ? Number(form.budget_range_max) : null,
            },
          });
          clearSignupAccountDraft();
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
      <button type="submit" disabled={saving} className={signupPrimaryBtn}>
        {saving ? "Saving…" : "Finish & go to dashboard"}
      </button>
    </form>
  );
}

function ReferralForm({ onDone }: { onDone: () => void }) {
  const draft = readSignupAccountDraft();
  const submit = useServerFn(upsertReferralProfile);
  const updateProfile = useServerFn(updateBaseProfile);
  const [form, setForm] = useState({
    full_name: draft?.fullName || "",
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
          await applyAccountDraft(updateProfile);
          await submit({ data: form });
          clearSignupAccountDraft();
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
      <button type="submit" disabled={saving} className={signupPrimaryBtn}>
        {saving ? "Saving…" : "Finish & go to dashboard"}
      </button>
    </form>
  );
}
