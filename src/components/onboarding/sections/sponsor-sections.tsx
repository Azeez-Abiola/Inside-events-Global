/**
 * Sponsor onboarding sections A–H (PRD §3.6.2)
 * A=Brand details, B=Sponsorship interests, C=Investment & timeline, D=Media,
 * E=Matching profile, F=Wishlist, G=Verification, H=Referral & consent
 */
import { useState } from "react";
import { Field, TextArea, SelectField, ChipMulti } from "@/components/signup/profile-fields";
import { MatchingBadge, ContinueButton, validateRequired } from "@/components/onboarding/onboarding-wizard";
import {
  MatchingProfileSection, WishlistSection, VerificationSection, ReferralConsentSection,
  type MatchingProfileData, type WishlistData, type VerificationData, type ReferralConsentData,
} from "@/components/onboarding/sections/shared-sections";
import {
  ONBOARDING_COUNTRIES, ONBOARDING_SECTORS, COMPANY_SIZES_OB,
  TARGET_MARKETS, EVENT_TYPES, SPONSOR_AUDIENCES, ACTIVATION_FORMATS,
  INVESTMENT_RANGES, EVENTS_PER_YEAR, COMMITMENT_TIMELINES,
} from "@/lib/onboarding-constants";
import { AlertCircle } from "lucide-react";

// ─── Data types ───────────────────────────────────────────────────────────────

export interface SpSectionA {
  brand_name: string; full_name: string; job_title: string;
  email: string; phone: string; industry: string; company_size: string;
  hq_country: string; countries_of_operation: string[];
  website_url: string; linkedin_company: string;
}
export interface SpSectionB {
  has_sponsored_before: string; most_recent_event_sponsored: string;
  sponsorship_reasons: string[]; event_types_interested: string[];
  preferred_event_size: string; target_markets: string[];
  target_audience: string[]; activation_formats: string[];
  booth_interest: string; preferred_booth_size: string;
}
export interface SpSectionC {
  cr_sustainability: string; investment_range: string;
  events_per_year: string; dedicated_budget: string;
  commitment_timeline: string;
}
export interface SpSectionD {
  featured_in_documentary: string; produces_content: string[];
  open_to_coproduction: string;
}
export type SpSectionE = MatchingProfileData;
export type SpSectionF = WishlistData;
export type SpSectionG = VerificationData;
export type SpSectionH = ReferralConsentData;

export type SponsorSectionData =
  | SpSectionA | SpSectionB | SpSectionC | SpSectionD
  | SpSectionE | SpSectionF | SpSectionG | SpSectionH;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Section A ─────────────────────────────────────────────────────────────────

function SectionA({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<SpSectionA>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: SpSectionA) => void }) {
  const [form, setForm] = useState<SpSectionA>({
    brand_name: initial?.brand_name ?? "", full_name: initial?.full_name ?? "",
    job_title: initial?.job_title ?? "", email: initial?.email ?? "",
    phone: initial?.phone ?? "", industry: initial?.industry ?? "",
    company_size: initial?.company_size ?? "", hq_country: initial?.hq_country ?? "",
    countries_of_operation: initial?.countries_of_operation ?? [],
    website_url: initial?.website_url ?? "", linkedin_company: initial?.linkedin_company ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof SpSectionA) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      brand_name: { value: form.brand_name, label: "Brand / company name" },
      full_name:  { value: form.full_name,  label: "Your full name" },
      job_title:  { value: form.job_title,  label: "Your job title" },
      email:      { value: form.email,      label: "Email address" },
      phone:      { value: form.phone,      label: "Phone number" },
      industry:   { value: form.industry,   label: "Industry / sector" },
      hq_country: { value: form.hq_country, label: "Primary HQ country" },
      countries_of_operation: { value: form.countries_of_operation, label: "Countries of operation", isMulti: true },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}
      <Field label="Brand / company name" value={form.brand_name} onChange={set("brand_name")} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your full name" value={form.full_name} onChange={set("full_name")} required />
        <Field label="Your job title" value={form.job_title} onChange={set("job_title")} required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email address" type="email" value={form.email} onChange={set("email")} required />
        <Field label="Phone number (WhatsApp preferred)" value={form.phone} onChange={set("phone")} placeholder="+234..." required />
      </div>
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Industry / sector <span className="text-destructive">*</span> <MatchingBadge />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ONBOARDING_SECTORS.map((s) => (
            <button key={s} type="button"
              onClick={() => setForm(f => ({ ...f, industry: f.industry === s ? "" : s }))}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${form.industry === s ? "border-primary bg-brand-soft text-primary-deep" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Company size (optional)" value={form.company_size} onChange={set("company_size")} options={[...COMPANY_SIZES_OB]} />
        <SelectField label="Primary HQ country" value={form.hq_country} onChange={set("hq_country")} options={[...ONBOARDING_COUNTRIES]} />
      </div>
      <ChipMulti label="Countries of operation" options={[...TARGET_MARKETS]} value={form.countries_of_operation} onChange={(v) => setForm(f => ({ ...f, countries_of_operation: v }))} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company website (optional)" type="url" value={form.website_url} onChange={set("website_url")} placeholder="https://…" />
        <Field label="LinkedIn company page (optional)" type="url" value={form.linkedin_company} onChange={set("linkedin_company")} placeholder="https://linkedin.com/company/…" />
      </div>
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section B ─────────────────────────────────────────────────────────────────

function SectionB({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<SpSectionB>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: SpSectionB) => void }) {
  const [form, setForm] = useState<SpSectionB>({
    has_sponsored_before: initial?.has_sponsored_before ?? "",
    most_recent_event_sponsored: initial?.most_recent_event_sponsored ?? "",
    sponsorship_reasons: initial?.sponsorship_reasons ?? [],
    event_types_interested: initial?.event_types_interested ?? [],
    preferred_event_size: initial?.preferred_event_size ?? "",
    target_markets: initial?.target_markets ?? [],
    target_audience: initial?.target_audience ?? [],
    activation_formats: initial?.activation_formats ?? [],
    booth_interest: initial?.booth_interest ?? "",
    preferred_booth_size: initial?.preferred_booth_size ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof SpSectionB) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      has_sponsored_before:   { value: form.has_sponsored_before,   label: "Has your brand sponsored events before?" },
      sponsorship_reasons:    { value: form.sponsorship_reasons,    label: "Primary reasons for considering event sponsorship", isMulti: true },
      event_types_interested: { value: form.event_types_interested, label: "Event types interested in sponsoring", isMulti: true },
      target_markets:         { value: form.target_markets,         label: "Target markets for activation", isMulti: true },
      target_audience:        { value: form.target_audience,        label: "Target audience profile", isMulti: true },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}
      <SelectField label="Has your brand sponsored events before?" value={form.has_sponsored_before} onChange={set("has_sponsored_before")} options={["Yes", "No", "We've explored it"]} />
      {form.has_sponsored_before === "Yes" && (
        <Field label="Most recent event sponsored (optional)" value={form.most_recent_event_sponsored} onChange={set("most_recent_event_sponsored")} />
      )}
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Primary reasons for considering event sponsorship <span className="text-destructive">*</span><MatchingBadge />
        </div>
        <ChipMulti label="" options={["Brand awareness", "Lead generation", "Product launch", "Community engagement", "Audience data", "Content creation", "Market entry", "CSR", "Employee engagement", "Other"]} value={form.sponsorship_reasons} onChange={(v) => setForm(f => ({ ...f, sponsorship_reasons: v }))} />
      </div>
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Event types you're interested in sponsoring <span className="text-destructive">*</span><MatchingBadge />
        </div>
        <ChipMulti label="" options={[...EVENT_TYPES]} value={form.event_types_interested} onChange={(v) => setForm(f => ({ ...f, event_types_interested: v }))} />
      </div>
      <SelectField label="Preferred event size (optional)" value={form.preferred_event_size} onChange={set("preferred_event_size")} options={["Under 500", "500–2,000", "2,000–10,000", "10,000+", "No preference"]} />
      <ChipMulti label="Target markets for activation" options={[...TARGET_MARKETS]} value={form.target_markets} onChange={(v) => setForm(f => ({ ...f, target_markets: v }))} />
      <ChipMulti label="Target audience profile" options={[...SPONSOR_AUDIENCES]} value={form.target_audience} onChange={(v) => setForm(f => ({ ...f, target_audience: v }))} />
      <ChipMulti label="Preferred sponsorship activation formats (optional)" options={[...ACTIVATION_FORMATS]} value={form.activation_formats} onChange={(v) => setForm(f => ({ ...f, activation_formats: v }))} />
      <SelectField label="Interested in booking exhibition spaces?" value={form.booth_interest} onChange={set("booth_interest")} options={["Yes — tell me more", "No", "Maybe depending on event"]} />
      {form.booth_interest === "Yes — tell me more" && (
        <SelectField label="Preferred booth size" value={form.preferred_booth_size} onChange={set("preferred_booth_size")} options={["3×3m", "3×6m", "6×6m", "Custom", "Depends on event"]} />
      )}
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section C ─────────────────────────────────────────────────────────────────

function SectionC({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<SpSectionC>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: SpSectionC) => void }) {
  const [form, setForm] = useState<SpSectionC>({
    cr_sustainability: initial?.cr_sustainability ?? "",
    investment_range: initial?.investment_range ?? "",
    events_per_year: initial?.events_per_year ?? "",
    dedicated_budget: initial?.dedicated_budget ?? "",
    commitment_timeline: initial?.commitment_timeline ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof SpSectionC) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      investment_range:    { value: form.investment_range,    label: "Typical investment range per event" },
      commitment_timeline: { value: form.commitment_timeline, label: "Preferred timeline for first commitment" },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Corporate Responsibility / sustainability standards (optional) <MatchingBadge />
        </div>
        <SelectField label="" value={form.cr_sustainability} onChange={set("cr_sustainability")} options={["Yes, formal requirements", "Some informal expectations", "No formal requirements", "Not applicable"]} />
      </div>
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Typical investment range per event <span className="text-destructive">*</span><MatchingBadge />
        </div>
        <SelectField label="" value={form.investment_range} onChange={set("investment_range")} options={[...INVESTMENT_RANGES]} />
      </div>
      <SelectField label="How many events to sponsor in 2026? (optional)" value={form.events_per_year} onChange={set("events_per_year")} options={[...EVENTS_PER_YEAR]} />
      <SelectField label="Dedicated sponsorship budget for 2026? (optional)" value={form.dedicated_budget} onChange={set("dedicated_budget")} options={["Yes, confirmed", "In planning", "Not yet allocated"]} />
      <SelectField label="Preferred timeline for first commitment" value={form.commitment_timeline} onChange={set("commitment_timeline")} options={[...COMMITMENT_TIMELINES]} />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section D ─────────────────────────────────────────────────────────────────

function SectionD({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<SpSectionD>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: SpSectionD) => void }) {
  const [form, setForm] = useState<SpSectionD>({
    featured_in_documentary: initial?.featured_in_documentary ?? "",
    produces_content: initial?.produces_content ?? [],
    open_to_coproduction: initial?.open_to_coproduction ?? "",
  });
  const set = (k: keyof SpSectionD) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      <SelectField label="Interested in being featured in an I.G.Events documentary?" value={form.featured_in_documentary} onChange={set("featured_in_documentary")} options={["Yes — as sponsoring brand", "Yes — as brand story subject", "No", "Tell me more"]} />
      <ChipMulti label="Does your brand produce event content? (optional)" options={["Video", "Photography", "Social media", "Podcast", "Written reports", "None"]} value={form.produces_content} onChange={(v) => setForm(f => ({ ...f, produces_content: v }))} />
      <SelectField label="Open to co-producing content with I.G.E? (optional)" value={form.open_to_coproduction} onChange={set("open_to_coproduction")} options={["Yes", "No", "Depends"]} />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Main dispatch ─────────────────────────────────────────────────────────────

interface SponsorSectionProps {
  sectionKey: string;
  initial?: Record<string, unknown>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onContinue: (d: SponsorSectionData, extra?: { dataConsent: boolean; termsConsent: boolean }) => void;
}

export function SponsorSection({ sectionKey, initial, reviewerNote, saving, isLastSection, onContinue }: SponsorSectionProps) {
  const props = { initial: initial as any, reviewerNote, saving, isLastSection, onContinue: onContinue as any };
  switch (sectionKey) {
    case "a": return <SectionA {...props} />;
    case "b": return <SectionB {...props} />;
    case "c": return <SectionC {...props} />;
    case "d": return <SectionD {...props} />;
    case "e": return <MatchingProfileSection {...props} />;
    case "f": return <WishlistSection {...props} />;
    case "g": return <VerificationSection {...props} />;
    case "h": return <ReferralConsentSection {...{ ...props, showSpecificEventField: true }} />;
    default:  return <div className="text-sm text-muted-foreground">Unknown section.</div>;
  }
}
