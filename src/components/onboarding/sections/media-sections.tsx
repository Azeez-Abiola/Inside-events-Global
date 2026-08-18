/**
 * Media Partner onboarding sections A–H (PRD §3.6.4)
 * A=Details, B=Coverage profile, C=Accreditation & needs, D=Partnership goals,
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
  ONBOARDING_COUNTRIES,
  MEDIA_TYPES, MEDIA_REACH, MEDIA_BEATS, MEDIA_GEO,
  MEDIA_ACCREDITATION, MEDIA_COVERAGE_VALUE, MEDIA_COVERAGE_PLAN,
} from "@/lib/onboarding-constants";
import { AlertCircle } from "lucide-react";

// ─── Data types ───────────────────────────────────────────────────────────────

export interface MedSectionA {
  full_name: string; outlet_name: string; role_title: string;
  email: string; phone: string; country: string;
  website_url: string; instagram_handle: string;
}
export interface MedSectionB {
  media_types: string[]; audience_reach: string;
  primary_beat: string[]; geographies_covered: string[];
}
export interface MedSectionC {
  past_events_covered: string; accreditation_needed: string[];
  typical_coverage_plan: string;
}
export interface MedSectionD {
  what_you_offer: string[]; exclusive_media_interest: string;
}
export type MedSectionE = MatchingProfileData;
export type MedSectionF = WishlistData;
export type MedSectionG = VerificationData;
export type MedSectionH = ReferralConsentData;

export type MediaSectionData =
  | MedSectionA | MedSectionB | MedSectionC | MedSectionD
  | MedSectionE | MedSectionF | MedSectionG | MedSectionH;

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

function SectionA({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<MedSectionA>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: MedSectionA) => void }) {
  const [form, setForm] = useState<MedSectionA>({
    full_name: initial?.full_name ?? "", outlet_name: initial?.outlet_name ?? "",
    role_title: initial?.role_title ?? "", email: initial?.email ?? "",
    phone: initial?.phone ?? "", country: initial?.country ?? "",
    website_url: initial?.website_url ?? "", instagram_handle: initial?.instagram_handle ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof MedSectionA) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      full_name:   { value: form.full_name,   label: "Full name" },
      outlet_name: { value: form.outlet_name, label: "Outlet / brand name" },
      role_title:  { value: form.role_title,  label: "Your role / title" },
      email:       { value: form.email,       label: "Email address" },
      phone:       { value: form.phone,       label: "Phone number" },
      country:     { value: form.country,     label: "Country" },
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
        <Field label="Outlet / brand name" value={form.outlet_name} onChange={set("outlet_name")} required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your role / title" value={form.role_title} onChange={set("role_title")} required />
        <SelectField label="Country" value={form.country} onChange={set("country")} options={[...ONBOARDING_COUNTRIES]} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email address" type="email" value={form.email} onChange={set("email")} required />
        <Field label="Phone number (WhatsApp preferred)" value={form.phone} onChange={set("phone")} placeholder="+234..." required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Website (optional)" type="url" value={form.website_url} onChange={set("website_url")} placeholder="https://…" />
        <Field label="Instagram handle (optional)" value={form.instagram_handle} onChange={set("instagram_handle")} placeholder="@youroutlet" />
      </div>
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section B ─────────────────────────────────────────────────────────────────

function SectionB({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<MedSectionB>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: MedSectionB) => void }) {
  const [form, setForm] = useState<MedSectionB>({
    media_types: initial?.media_types ?? [],
    audience_reach: initial?.audience_reach ?? "",
    primary_beat: initial?.primary_beat ?? [],
    geographies_covered: initial?.geographies_covered ?? [],
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof MedSectionB) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      media_types:    { value: form.media_types,    label: "Media type", isMulti: true },
      audience_reach: { value: form.audience_reach, label: "Audience reach / following" },
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
          Media type <span className="text-destructive">*</span><MatchingBadge />
        </div>
        <ChipMulti label="" options={[...MEDIA_TYPES]} value={form.media_types} onChange={(v) => setForm(f => ({ ...f, media_types: v }))} />
      </div>
      <SelectField label="Audience reach / following" value={form.audience_reach} onChange={set("audience_reach")} options={[...MEDIA_REACH]} />
      <ChipMulti label="Primary beat (optional)" options={[...MEDIA_BEATS]} value={form.primary_beat} onChange={(v) => setForm(f => ({ ...f, primary_beat: v }))} />
      <ChipMulti label="Geographies covered (optional)" options={[...MEDIA_GEO]} value={form.geographies_covered} onChange={(v) => setForm(f => ({ ...f, geographies_covered: v }))} />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section C ─────────────────────────────────────────────────────────────────

function SectionC({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<MedSectionC>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: MedSectionC) => void }) {
  const [form, setForm] = useState<MedSectionC>({
    past_events_covered: initial?.past_events_covered ?? "",
    accreditation_needed: initial?.accreditation_needed ?? [],
    typical_coverage_plan: initial?.typical_coverage_plan ?? "",
  });
  const set = (k: keyof MedSectionC) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {reviewerNote && <ReviewerNote note={reviewerNote} />}
      <TextArea label="Past events covered (optional)" value={form.past_events_covered} onChange={set("past_events_covered")} rows={3} placeholder="List key events you've covered…" />
      <ChipMulti label="Accreditation type needed (optional)" options={[...MEDIA_ACCREDITATION]} value={form.accreditation_needed} onChange={(v) => setForm(f => ({ ...f, accreditation_needed: v }))} />
      <SelectField label="Typical coverage plan (optional)" value={form.typical_coverage_plan} onChange={set("typical_coverage_plan")} options={[...MEDIA_COVERAGE_PLAN]} />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section D ─────────────────────────────────────────────────────────────────

function SectionD({ initial, reviewerNote, saving, isLastSection, onContinue }: { initial?: Partial<MedSectionD>; reviewerNote?: string; saving: boolean; isLastSection: boolean; onContinue: (d: MedSectionD) => void }) {
  const [form, setForm] = useState<MedSectionD>({
    what_you_offer: initial?.what_you_offer ?? [],
    exclusive_media_interest: initial?.exclusive_media_interest ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof MedSectionD) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      what_you_offer: { value: form.what_you_offer, label: "What you can offer organisers / sponsors", isMulti: true },
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
          What you can offer organisers / sponsors <span className="text-destructive">*</span><MatchingBadge />
        </div>
        <ChipMulti label="" options={[...MEDIA_COVERAGE_VALUE]} value={form.what_you_offer} onChange={(v) => setForm(f => ({ ...f, what_you_offer: v }))} />
      </div>
      <SelectField label="Interested in exclusive media partner status per event? (optional)" value={form.exclusive_media_interest} onChange={set("exclusive_media_interest")} options={["Yes", "No", "Depends"]} />
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Main dispatch ─────────────────────────────────────────────────────────────

interface MediaSectionProps {
  sectionKey: string;
  initial?: Record<string, unknown>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onContinue: (d: MediaSectionData, extra?: { dataConsent: boolean; termsConsent: boolean }) => void;
}

export function MediaSection({ sectionKey, initial, reviewerNote, saving, isLastSection, onContinue }: MediaSectionProps) {
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
