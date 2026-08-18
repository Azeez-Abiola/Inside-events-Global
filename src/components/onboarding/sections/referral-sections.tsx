/**
 * Referral Partner onboarding sections A–H (PRD §3.6.3)
 * A=Details, B=Network & reach, C=Sponsorship experience, D=Goals with IGE,
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
  ONBOARDING_COUNTRIES, ONBOARDING_SECTORS,
  REFERRAL_NETWORK_TYPES, REFERRAL_NETWORK_SIZES, BRAND_SENIORITY,
  REFERRAL_INTROS_PER_QUARTER, REFERRAL_DEAL_RANGES, REFERRAL_COMMISSION_STRUCTURES,
  ONBOARDING_CURRENCIES,
} from "@/lib/onboarding-constants";
import { AlertCircle } from "lucide-react";

// ─── Data types ───────────────────────────────────────────────────────────────

export interface RefSectionA {
  full_name: string; job_title: string; company_name: string;
  email: string; phone: string; country: string;
  linkedin_url: string; instagram_handle: string;
}
export interface RefSectionB {
  network_type: string; network_size: string; brand_seniority: string;
  sectors_of_expertise: string[]; geographies_covered: string[];
  languages_spoken: string;
}
export interface RefSectionC {
  has_facilitated_deals: string; largest_deal_value: string;
  deals_closed_12mo: string; typical_sectors: string[];
  reference_contact: string;
}
export interface RefSectionD {
  intros_per_quarter: string; target_deal_range: string;
  preferred_currency: string; commission_preference: string;
  open_to_exclusivity: string;
}
export type RefSectionE = MatchingProfileData;
export type RefSectionF = WishlistData;
export type RefSectionG = VerificationData;
export type RefSectionH = ReferralConsentData;

export type ReferralSectionData =
  | RefSectionA | RefSectionB | RefSectionC | RefSectionD
  | RefSectionE | RefSectionF | RefSectionG | RefSectionH;

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

function SectionA({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<RefSectionA>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: RefSectionA) => void }) {
  const [form, setForm] = useState<RefSectionA>({
    full_name: initial?.full_name ?? "", job_title: initial?.job_title ?? "",
    company_name: initial?.company_name ?? "", email: initial?.email ?? "",
    phone: initial?.phone ?? "", country: initial?.country ?? "",
    linkedin_url: initial?.linkedin_url ?? "", instagram_handle: initial?.instagram_handle ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof RefSectionA) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      full_name: { value: form.full_name, label: "Full name" },
      job_title: { value: form.job_title, label: "Job title" },
      email:     { value: form.email,     label: "Email address" },
      phone:     { value: form.phone,     label: "Phone number" },
      country:   { value: form.country,   label: "Country" },
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
        <Field label="Job title" value={form.job_title} onChange={set("job_title")} required />
      </div>
      <Field label="Company / organisation (optional)" value={form.company_name} onChange={set("company_name")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email address" type="email" value={form.email} onChange={set("email")} required />
        <Field label="Phone number (WhatsApp preferred)" value={form.phone} onChange={set("phone")} placeholder="+234..." required />
      </div>
      <SelectField label="Country" value={form.country} onChange={set("country")} options={[...ONBOARDING_COUNTRIES]} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="LinkedIn profile URL (optional)" type="url" value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://linkedin.com/in/…" />
        <Field label="Instagram handle (optional)" value={form.instagram_handle} onChange={set("instagram_handle")} placeholder="@yourhandle" />
      </div>
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section B ─────────────────────────────────────────────────────────────────

function SectionB({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<RefSectionB>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: RefSectionB) => void }) {
  const [form, setForm] = useState<RefSectionB>({
    network_type: initial?.network_type ?? "",
    network_size: initial?.network_size ?? "",
    brand_seniority: initial?.brand_seniority ?? "",
    sectors_of_expertise: initial?.sectors_of_expertise ?? [],
    geographies_covered: initial?.geographies_covered ?? [],
    languages_spoken: initial?.languages_spoken ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof RefSectionB) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      network_type:          { value: form.network_type,          label: "Type of network" },
      network_size:          { value: form.network_size,          label: "Network size estimate" },
      sectors_of_expertise:  { value: form.sectors_of_expertise,  label: "Sectors of expertise", isMulti: true },
      geographies_covered:   { value: form.geographies_covered,   label: "Geographies covered", isMulti: true },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Type of network" value={form.network_type} onChange={set("network_type")} options={[...REFERRAL_NETWORK_TYPES]} />
        <SelectField label="Network size estimate" value={form.network_size} onChange={set("network_size")} options={[...REFERRAL_NETWORK_SIZES]} />
      </div>
      <SelectField label="Brand seniority you have access to (optional)" value={form.brand_seniority} onChange={set("brand_seniority")} options={[...BRAND_SENIORITY]} />
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Sectors of expertise <span className="text-destructive">*</span><MatchingBadge />
        </div>
        <ChipMulti label="" options={[...ONBOARDING_SECTORS]} value={form.sectors_of_expertise} onChange={(v) => setForm(f => ({ ...f, sectors_of_expertise: v }))} />
      </div>
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Geographies covered <span className="text-destructive">*</span><MatchingBadge />
        </div>
        <ChipMulti label="" options={["Nigeria", "Ghana", "Kenya", "South Africa", "Côte d'Ivoire", "Senegal", "UK", "France", "USA", "Other"]} value={form.geographies_covered} onChange={(v) => setForm(f => ({ ...f, geographies_covered: v }))} />
      </div>
      <Field label="Languages spoken (optional)" value={form.languages_spoken} onChange={set("languages_spoken")} placeholder="e.g. English, French, Yoruba" />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section C ─────────────────────────────────────────────────────────────────

function SectionC({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<RefSectionC>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: RefSectionC) => void }) {
  const [form, setForm] = useState<RefSectionC>({
    has_facilitated_deals: initial?.has_facilitated_deals ?? "",
    largest_deal_value: initial?.largest_deal_value ?? "",
    deals_closed_12mo: initial?.deals_closed_12mo ?? "",
    typical_sectors: initial?.typical_sectors ?? [],
    reference_contact: initial?.reference_contact ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof RefSectionC) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      has_facilitated_deals: { value: form.has_facilitated_deals, label: "Have you facilitated a sponsorship deal before?" },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}
      <SelectField label="Have you facilitated a sponsorship deal before?" value={form.has_facilitated_deals} onChange={set("has_facilitated_deals")} options={["Yes", "No", "Informally"]} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Largest deal value (optional)" value={form.largest_deal_value} onChange={set("largest_deal_value")} placeholder="e.g. ₦25M / $30k" />
        <Field label="Deals closed in last 12 months (optional)" type="number" value={form.deals_closed_12mo} onChange={set("deals_closed_12mo")} />
      </div>
      <ChipMulti label="Typical sectors of past deals (optional)" options={[...ONBOARDING_SECTORS]} value={form.typical_sectors} onChange={(v) => setForm(f => ({ ...f, typical_sectors: v }))} />
      <Field label="Reference contact (optional)" value={form.reference_contact} onChange={set("reference_contact")} placeholder="Name + email/phone" />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section D ─────────────────────────────────────────────────────────────────

function SectionD({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<RefSectionD>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: RefSectionD) => void }) {
  const [form, setForm] = useState<RefSectionD>({
    intros_per_quarter: initial?.intros_per_quarter ?? "",
    target_deal_range: initial?.target_deal_range ?? "",
    preferred_currency: initial?.preferred_currency ?? "",
    commission_preference: initial?.commission_preference ?? "",
    open_to_exclusivity: initial?.open_to_exclusivity ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof RefSectionD) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      intros_per_quarter: { value: form.intros_per_quarter, label: "Introductions per quarter" },
      target_deal_range:  { value: form.target_deal_range,  label: "Target deal-size range" },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null); onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      {err && <ErrorBanner msg={err} />}
      <SelectField label="Introductions per quarter" value={form.intros_per_quarter} onChange={set("intros_per_quarter")} options={[...REFERRAL_INTROS_PER_QUARTER]} />
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Target deal-size range <span className="text-destructive">*</span><MatchingBadge />
        </div>
        <SelectField label="" value={form.target_deal_range} onChange={set("target_deal_range")} options={[...REFERRAL_DEAL_RANGES]} />
      </div>
      <SelectField label="Preferred payout currency (optional)" value={form.preferred_currency} onChange={set("preferred_currency")} options={[...ONBOARDING_CURRENCIES]} />
      <SelectField label="Commission structure preference (optional)" value={form.commission_preference} onChange={set("commission_preference")} options={[...REFERRAL_COMMISSION_STRUCTURES]} />
      <SelectField label="Open to exclusivity in a sector? (optional)" value={form.open_to_exclusivity} onChange={set("open_to_exclusivity")} options={["Yes", "No", "Depends"]} />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Main dispatch ─────────────────────────────────────────────────────────────

interface ReferralSectionProps {
  sectionKey: string;
  initial?: Record<string, unknown>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onContinue: (d: ReferralSectionData, extra?: { dataConsent: boolean; termsConsent: boolean }) => void;
}

export function ReferralSection({ sectionKey, initial, reviewerNote, saving, isLastSection, onContinue }: ReferralSectionProps) {
  const props = { initial: initial as any, reviewerNote, saving, isLastSection, onContinue: onContinue as any };
  switch (sectionKey) {
    case "a": return <SectionA {...props} />;
    case "b": return <SectionB {...props} />;
    case "c": return <SectionC {...props} />;
    case "d": return <SectionD {...props} />;
    case "e": return <MatchingProfileSection {...props} />;
    case "f": return <WishlistSection {...props} />;
    case "g": return <VerificationSection {...props} />;
    case "h": return <ReferralConsentSection {...props} />;
    default:  return <div className="text-sm text-muted-foreground">Unknown section.</div>;
  }
}
