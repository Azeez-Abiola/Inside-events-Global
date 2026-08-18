/**
 * Organiser onboarding sections A–I (PRD §3.6.1)
 * Sections: A=Details, B=Event details, C=Audience data, D=Sponsorship packages,
 *           E=Media, F=Matching profile, G=Wishlist, H=Verification, I=Referral & consent
 */
import { useState } from "react";
import { Field, TextArea, SelectField, Checkbox, ChipMulti } from "@/components/signup/profile-fields";
import { MatchingBadge, ContinueButton, validateRequired } from "@/components/onboarding/onboarding-wizard";
import {
  MatchingProfileSection, WishlistSection, VerificationSection, ReferralConsentSection,
  type MatchingProfileData, type WishlistData, type VerificationData, type ReferralConsentData,
} from "@/components/onboarding/sections/shared-sections";
import {
  ONBOARDING_COUNTRIES, EVENT_TYPES, AUDIENCE_AGE_RANGES, AUDIENCE_INDUSTRIES, AUDIENCE_GEO,
  ONBOARDING_SECTORS, ONBOARDING_CURRENCIES, SUSTAINABILITY_OPTIONS, DIV_INCLUSION_OPTIONS,
} from "@/lib/onboarding-constants";
import { AlertCircle } from "lucide-react";

// ─── Data types ───────────────────────────────────────────────────────────────

export interface OrgSectionA {
  full_name: string; job_title: string; org_name: string;
  email: string; phone: string; country: string;
  linkedin_url: string; instagram_handle: string;
}
export interface OrgSectionB {
  event_name: string; event_tagline: string; event_type: string;
  start_date: string; end_date: string; event_city: string; event_country: string;
  venue_name: string; venue_confirmed: string;
  is_recurring: string; year_first_held: string;
  event_description: string;
}
export interface OrgSectionC {
  expected_attendance: string; past_attendance: string;
  audience_age_ranges: string[]; gender_split: string;
  income_level: string; audience_industries: string[];
  audience_geo: string[]; has_audience_survey: string;
}
export interface OrgSectionD {
  has_prospectus: string;
  tiers: Array<{ name: string; amount: string; slots: string; currency: string; deliverables: string }>;
  booths_available: string; booth_count: string; booth_price: string;
  inkind_accepted: string;
  sponsor_categories: string[];
  sustainability: string;
  div_inclusion: string[];
}
export interface OrgSectionE {
  open_to_documentary: string; has_footage: string;
  photos_link: string; deck_link: string; website_url: string; event_instagram: string;
}
export type OrgSectionF = MatchingProfileData;
export type OrgSectionG = WishlistData;
export type OrgSectionH = VerificationData;
export type OrgSectionI = ReferralConsentData;

export type OrganiserSectionData =
  | OrgSectionA | OrgSectionB | OrgSectionC | OrgSectionD | OrgSectionE
  | OrgSectionF | OrgSectionG | OrgSectionH | OrgSectionI;

// ─── Props shared by all section renderers ────────────────────────────────────

interface SectionProps<T> {
  initial?: Partial<T>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onContinue: (d: T, extra?: { dataConsent: boolean; termsConsent: boolean }) => void;
}

// ─── Section A — Organiser details ───────────────────────────────────────────

function SectionA({ initial, reviewerNote, saving, isLastSection, onContinue }: SectionProps<OrgSectionA>) {
  const [form, setForm] = useState<OrgSectionA>({
    full_name: initial?.full_name ?? "", job_title: initial?.job_title ?? "",
    org_name: initial?.org_name ?? "", email: initial?.email ?? "",
    phone: initial?.phone ?? "", country: initial?.country ?? "",
    linkedin_url: initial?.linkedin_url ?? "", instagram_handle: initial?.instagram_handle ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof OrgSectionA) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      full_name: { value: form.full_name, label: "Full name" },
      job_title: { value: form.job_title, label: "Job title / role" },
      org_name:  { value: form.org_name,  label: "Organisation name" },
      email:     { value: form.email,     label: "Email address" },
      phone:     { value: form.phone,     label: "Phone number" },
      country:   { value: form.country,   label: "Country of operation" },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" value={form.full_name} onChange={set("full_name")} required />
        <Field label="Job title / role" value={form.job_title} onChange={set("job_title")} required />
      </div>
      <Field label="Organisation name" value={form.org_name} onChange={set("org_name")} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email address" type="email" value={form.email} onChange={set("email")} required />
        <Field label="Phone number (WhatsApp preferred)" value={form.phone} onChange={set("phone")} placeholder="+234..." required />
      </div>
      <SelectField label="Country of operation" value={form.country} onChange={set("country")} options={[...ONBOARDING_COUNTRIES]} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="LinkedIn profile URL (optional)" type="url" value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://linkedin.com/in/…" />
        <Field label="Instagram handle (optional)" value={form.instagram_handle} onChange={set("instagram_handle")} placeholder="@yourhandle" />
      </div>
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section B — Event details ────────────────────────────────────────────────

function SectionB({ initial, reviewerNote, saving, isLastSection, onContinue }: SectionProps<OrgSectionB>) {
  const [form, setForm] = useState<OrgSectionB>({
    event_name: initial?.event_name ?? "", event_tagline: initial?.event_tagline ?? "",
    event_type: initial?.event_type ?? "", start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "", event_city: initial?.event_city ?? "",
    event_country: initial?.event_country ?? "", venue_name: initial?.venue_name ?? "",
    venue_confirmed: initial?.venue_confirmed ?? "", is_recurring: initial?.is_recurring ?? "",
    year_first_held: initial?.year_first_held ?? "", event_description: initial?.event_description ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof OrgSectionB) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.event_tagline.length > 150) { setErr('"Event tagline" must be 150 characters or fewer.'); return; }
    const fieldError = validateRequired({
      event_name: { value: form.event_name, label: "Event name" },
      event_tagline: { value: form.event_tagline, label: "Event tagline" },
      event_type: { value: form.event_type, label: "Event type" },
      start_date: { value: form.start_date, label: "Event start date" },
      end_date: { value: form.end_date, label: "Event end date" },
      event_city: { value: form.event_city, label: "Event city" },
      event_country: { value: form.event_country, label: "Event country" },
      venue_name: { value: form.venue_name, label: "Event venue name" },
      venue_confirmed: { value: form.venue_confirmed, label: "Is venue confirmed?" },
      event_description: { value: form.event_description, label: "Event description" },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}
      <Field label="Event name" value={form.event_name} onChange={set("event_name")} required />
      <div>
        <Field label="Event tagline" value={form.event_tagline} onChange={set("event_tagline")} required placeholder="Max 150 characters" />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">{form.event_tagline.length}/150</p>
      </div>
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Event type <span className="text-destructive">*</span> <MatchingBadge />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((t) => (
            <button key={t} type="button"
              onClick={() => setForm(f => ({ ...f, event_type: f.event_type === t ? "" : t }))}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${form.event_type === t ? "border-primary bg-brand-soft text-primary-deep" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Event start date" type="date" value={form.start_date} onChange={set("start_date")} required />
        <Field label="Event end date" type="date" value={form.end_date} onChange={set("end_date")} required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Event city" value={form.event_city} onChange={set("event_city")} required />
        <SelectField label="Event country" value={form.event_country} onChange={set("event_country")} options={[...ONBOARDING_COUNTRIES]} />
      </div>
      <Field label="Event venue name" value={form.venue_name} onChange={set("venue_name")} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Is venue confirmed?" value={form.venue_confirmed} onChange={set("venue_confirmed")} options={["Yes", "No — shortlisting"]} />
        <SelectField label="Is this event recurring?" value={form.is_recurring} onChange={set("is_recurring")} options={["Yes", "No, first edition"]} />
      </div>
      {form.is_recurring === "Yes" && (
        <Field label="Year first held" type="number" value={form.year_first_held} onChange={set("year_first_held")} placeholder="e.g. 2019" />
      )}
      <TextArea label="Event description" value={form.event_description} onChange={set("event_description")} rows={5} placeholder="Max 500 words — tell sponsors about the event" />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section C — Audience data ────────────────────────────────────────────────

function SectionC({ initial, reviewerNote, saving, isLastSection, onContinue }: SectionProps<OrgSectionC>) {
  const [form, setForm] = useState<OrgSectionC>({
    expected_attendance: initial?.expected_attendance ?? "",
    past_attendance: initial?.past_attendance ?? "",
    audience_age_ranges: initial?.audience_age_ranges ?? [],
    gender_split: initial?.gender_split ?? "",
    income_level: initial?.income_level ?? "",
    audience_industries: initial?.audience_industries ?? [],
    audience_geo: initial?.audience_geo ?? [],
    has_audience_survey: initial?.has_audience_survey ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof OrgSectionC) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      expected_attendance: { value: form.expected_attendance, label: "Expected attendance" },
      audience_age_ranges: { value: form.audience_age_ranges, label: "Primary audience age range", isMulti: true },
      gender_split:        { value: form.gender_split,        label: "Primary audience gender split" },
      income_level:        { value: form.income_level,        label: "Primary audience income level" },
      audience_industries: { value: form.audience_industries, label: "Primary audience industry", isMulti: true },
      audience_geo:        { value: form.audience_geo,        label: "Audience geographic spread", isMulti: true },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Expected attendance (this edition)" type="number" value={form.expected_attendance} onChange={set("expected_attendance")} required />
        <Field label="Past attendance (most recent edition, optional)" type="number" value={form.past_attendance} onChange={set("past_attendance")} />
      </div>
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">Primary audience age range <span className="text-destructive">*</span><MatchingBadge /></div>
        <ChipMulti label="" options={[...AUDIENCE_AGE_RANGES]} value={form.audience_age_ranges} onChange={(v) => setForm(f => ({ ...f, audience_age_ranges: v }))} />
      </div>
      <SelectField label="Primary audience gender split" value={form.gender_split} onChange={set("gender_split")} options={["Majority female", "Majority male", "Roughly even"]} />
      <SelectField label="Primary audience income level" value={form.income_level} onChange={set("income_level")} options={["Mass market", "Middle income", "Affluent/HNW", "Mixed"]} />
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">Primary audience industry / occupation <span className="text-destructive">*</span><MatchingBadge /></div>
        <ChipMulti label="" options={[...AUDIENCE_INDUSTRIES]} value={form.audience_industries} onChange={(v) => setForm(f => ({ ...f, audience_industries: v }))} />
      </div>
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">Audience geographic spread <span className="text-destructive">*</span><MatchingBadge /></div>
        <ChipMulti label="" options={[...AUDIENCE_GEO]} value={form.audience_geo} onChange={(v) => setForm(f => ({ ...f, audience_geo: v }))} />
      </div>
      <SelectField label="Audience survey data from past edition?" value={form.has_audience_survey} onChange={set("has_audience_survey")} options={["Yes — happy to share", "No"]} />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section D — Sponsorship packages ────────────────────────────────────────

const EMPTY_TIER = { name: "", amount: "", slots: "", currency: "", deliverables: "" };
const TIER_NAMES = ["Title", "Gold", "Silver", "Bronze"];

function SectionD({ initial, reviewerNote, saving, isLastSection, onContinue }: SectionProps<OrgSectionD>) {
  const [form, setForm] = useState<OrgSectionD>({
    has_prospectus: initial?.has_prospectus ?? "",
    tiers: initial?.tiers ?? TIER_NAMES.map((name) => ({ ...EMPTY_TIER, name })),
    booths_available: initial?.booths_available ?? "",
    booth_count: initial?.booth_count ?? "",
    booth_price: initial?.booth_price ?? "",
    inkind_accepted: initial?.inkind_accepted ?? "",
    sponsor_categories: initial?.sponsor_categories ?? [],
    sustainability: initial?.sustainability ?? "",
    div_inclusion: initial?.div_inclusion ?? [],
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof OrgSectionD) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      has_prospectus:    { value: form.has_prospectus,     label: "Do you have a sponsorship prospectus?" },
      sponsor_categories: { value: form.sponsor_categories, label: "Sponsor categories actively sought", isMulti: true },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  function updateTier(i: number, field: keyof typeof EMPTY_TIER, value: string) {
    setForm(f => {
      const tiers = [...f.tiers];
      tiers[i] = { ...tiers[i], [field]: value };
      return { ...f, tiers };
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}

      <SelectField label="Do you have a current sponsorship prospectus?" value={form.has_prospectus} onChange={set("has_prospectus")} options={["Yes", "No, need help building one"]} />

      <div>
        <div className="mb-2 flex items-center gap-1 text-sm font-medium">
          Sponsorship tiers (optional) <MatchingBadge />
        </div>
        <div className="space-y-4">
          {form.tiers.map((tier, i) => (
            <div key={tier.name} className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{tier.name} tier</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Package name" value={tier.name} onChange={(v) => updateTier(i, "name", v)} />
                <Field label="Investment amount" value={tier.amount} onChange={(v) => updateTier(i, "amount", v)} placeholder="e.g. 5,000,000" />
                <Field label="Slots available" type="number" value={tier.slots} onChange={(v) => updateTier(i, "slots", v)} />
                <SelectField label="Currency" value={tier.currency} onChange={(v) => updateTier(i, "currency", v)} options={[...ONBOARDING_CURRENCIES]} />
              </div>
              <div className="mt-3">
                <TextArea label="Deliverables" value={tier.deliverables} onChange={(v) => updateTier(i, "deliverables", v)} rows={2} placeholder="Logo placement, MC mention, social media…" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SelectField label="Exhibition booths available?" value={form.booths_available} onChange={set("booths_available")} options={["Yes", "No"]} />
      {form.booths_available === "Yes" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Number of booths" type="number" value={form.booth_count} onChange={set("booth_count")} />
          <Field label="Price per booth" value={form.booth_price} onChange={set("booth_price")} placeholder="e.g. ₦500,000" />
        </div>
      )}

      <SelectField label="In-kind sponsorship accepted?" value={form.inkind_accepted} onChange={set("inkind_accepted")} options={["Yes", "No", "Case by case"]} />

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Sponsor categories actively sought <span className="text-destructive">*</span><MatchingBadge />
        </div>
        <ChipMulti label="" options={[...ONBOARDING_SECTORS]} value={form.sponsor_categories} onChange={(v) => setForm(f => ({ ...f, sponsor_categories: v }))} />
      </div>

      <SelectField label="Sustainability practices in place?" value={form.sustainability} onChange={set("sustainability")} options={[...SUSTAINABILITY_OPTIONS]} />

      <ChipMulti label="Diversity & inclusion focus (optional)" options={[...DIV_INCLUSION_OPTIONS]} value={form.div_inclusion} onChange={(v) => setForm(f => ({ ...f, div_inclusion: v }))} />

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section E — Media & documentary ─────────────────────────────────────────

function SectionE({ initial, reviewerNote, saving, isLastSection, onContinue }: SectionProps<OrgSectionE>) {
  const [form, setForm] = useState<OrgSectionE>({
    open_to_documentary: initial?.open_to_documentary ?? "",
    has_footage: initial?.has_footage ?? "",
    photos_link: initial?.photos_link ?? "",
    deck_link: initial?.deck_link ?? "",
    website_url: initial?.website_url ?? "",
    event_instagram: initial?.event_instagram ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof OrgSectionE) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      open_to_documentary: { value: form.open_to_documentary, label: "Open to I.G.Events filming a documentary?" },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}
      <SelectField label="Open to I.G.Events filming a documentary?" value={form.open_to_documentary} onChange={set("open_to_documentary")} options={["Yes", "No", "Tell me more"]} />
      <SelectField label="Have existing event footage to share?" value={form.has_footage} onChange={set("has_footage")} options={["Yes", "No"]} />
      <Field label="Link to event photos (optional)" type="url" value={form.photos_link} onChange={set("photos_link")} placeholder="Google Drive / Dropbox link" />
      <Field label="Link to sponsorship deck / prospectus (optional)" type="url" value={form.deck_link} onChange={set("deck_link")} placeholder="PDF link — Drive / Dropbox / Notion" />
      <Field label="Event website URL (optional)" type="url" value={form.website_url} onChange={set("website_url")} placeholder="https://…" />
      <Field label="Event Instagram handle (optional)" value={form.event_instagram} onChange={set("event_instagram")} placeholder="@event" />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Main dispatch ─────────────────────────────────────────────────────────────

interface OrganiserSectionProps {
  sectionKey: string;
  initial?: Record<string, unknown>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onContinue: (d: OrganiserSectionData, extra?: { dataConsent: boolean; termsConsent: boolean }) => void;
}

export function OrganiserSection({ sectionKey, initial, reviewerNote, saving, isLastSection, onContinue }: OrganiserSectionProps) {
  const props = { initial: initial as any, reviewerNote, saving, isLastSection, onContinue: onContinue as any };
  switch (sectionKey) {
    case "a": return <SectionA {...props} />;
    case "b": return <SectionB {...props} />;
    case "c": return <SectionC {...props} />;
    case "d": return <SectionD {...props} />;
    case "e": return <SectionE {...props} />;
    case "f": return <MatchingProfileSection {...props} />;
    case "g": return <WishlistSection {...props} />;
    case "h": return <VerificationSection {...props} />;
    case "i": return <ReferralConsentSection {...props} />;
    default:  return <div className="text-sm text-muted-foreground">Unknown section.</div>;
  }
}

// ─── Micro-components ─────────────────────────────────────────────────────────

function ReviewerNote({ note }: { note: string }) {
  return (
    <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
      <p className="text-sm text-amber-800">{note}</p>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <p className="text-sm text-destructive">{msg}</p>
    </div>
  );
}
