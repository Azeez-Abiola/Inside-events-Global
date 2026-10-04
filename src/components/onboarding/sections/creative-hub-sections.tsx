/**
 * Creative Hub onboarding sections A–H (TAB 3 §3.6.6)
 * A=Creative profile, B=Work & reach, C=Sponsorship fit,
 * D=Production & placement details, E=Matching profile, F=Wishlist,
 * G=Verification, H=Referral & consent
 *
 * Positioned globally: brands anywhere can discover productions that need
 * sponsorship, so the matching fields are production format, placement
 * opportunities, primary platform and amount sought.
 */
import { useState } from "react";
import { Field, TextArea, SelectField, ChipMulti } from "@/components/signup/profile-fields";
import {
  MatchingBadge,
  ContinueButton,
  validateRequired,
} from "@/components/onboarding/onboarding-wizard";
import {
  MatchingProfileSection,
  WishlistSection,
  VerificationSection,
  ReferralConsentSection,
  type MatchingProfileData,
  type WishlistData,
  type VerificationData,
  type ReferralConsentData,
} from "@/components/onboarding/sections/shared-sections";
import {
  ONBOARDING_COUNTRIES,
  ONBOARDING_CURRENCIES,
  CREATIVE_TYPES,
  CREATIVE_FOLLOWING_BANDS,
  CREATIVE_PLATFORMS,
  CREATIVE_AVG_VIEWS,
  CREATIVE_PROJECT_TYPES,
  CREATIVE_BUDGET_NGN,
  CREATIVE_BUDGET_USD,
  CREATIVE_TIMELINE,
  CREATIVE_FORMATS,
  CREATIVE_PRODUCTION_STAGES,
  CREATIVE_PLACEMENTS,
} from "@/lib/onboarding-constants";
import { AlertCircle } from "lucide-react";

// ─── Data types ───────────────────────────────────────────────────────────────

export interface CreativeSectionA {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  portfolio_url: string;
  instagram_handle: string;
  total_following: string;
}
export interface CreativeSectionB {
  primary_platforms: string[];
  avg_views: string;
  past_brand_partnerships: string;
}
export interface CreativeSectionC {
  project_types: string[];
  budget_currency: string;
  budget_band: string;
  timeline: string;
}
export interface CreativeSectionD {
  production_title: string;
  format: string;
  production_stage: string;
  release_window: string;
  placements: string[];
  target_markets: string[];
  amount_currency: string;
  amount_sought: string;
}

export type CreativeSectionData =
  | CreativeSectionA
  | CreativeSectionB
  | CreativeSectionC
  | CreativeSectionD
  | MatchingProfileData
  | WishlistData
  | VerificationData
  | ReferralConsentData;

function Banner({ reviewerNote, err }: { reviewerNote?: string; err: string | null }) {
  return (
    <>
      {reviewerNote && (
        <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p className="text-sm text-amber-800">{reviewerNote}</p>
        </div>
      )}
      {err && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}
    </>
  );
}

/** NGN gets its own bands; every other currency uses the USD ladder. */
function budgetBandsFor(currency: string) {
  return currency.startsWith("NGN") ? [...CREATIVE_BUDGET_NGN] : [...CREATIVE_BUDGET_USD];
}

// ─── Section A · Creative profile ─────────────────────────────────────────────

function SectionA({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<CreativeSectionA>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onSkip?: () => void;
  onContinue: (d: CreativeSectionA) => void;
}) {
  const [form, setForm] = useState<CreativeSectionA>({
    full_name: initial?.full_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    country: initial?.country ?? "",
    portfolio_url: initial?.portfolio_url ?? "",
    instagram_handle: initial?.instagram_handle ?? "",
    total_following: initial?.total_following ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      full_name: { value: form.full_name, label: "Full name / creative-brand name" },
      email: { value: form.email, label: "Email" },
      phone: { value: form.phone, label: "Phone number" },
      country: { value: form.country, label: "Country" },
      portfolio_url: { value: form.portfolio_url, label: "Portfolio / showreel link" },
    });
    if (fieldError) {
      setErr(fieldError);
      return;
    }
    setErr(null);
    onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Banner reviewerNote={reviewerNote} err={err} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name / creative-brand name"
          value={form.full_name}
          onChange={(v) => setForm({ ...form, full_name: v })}
          required
        />
        <Field
          label="Email address"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          required
        />
        <Field
          label="Phone number (WhatsApp preferred)"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          required
        />
        <SelectField
          label="Country"
          value={form.country}
          onChange={(v) => setForm({ ...form, country: v })}
          options={[...ONBOARDING_COUNTRIES]}
        />
        <Field
          label="Portfolio / showreel link"
          value={form.portfolio_url}
          onChange={(v) => setForm({ ...form, portfolio_url: v })}
          required
          placeholder="https://…"
        />
        <Field
          label="Instagram handle (optional)"
          value={form.instagram_handle}
          onChange={(v) => setForm({ ...form, instagram_handle: v })}
          placeholder="without the @"
        />
        <SelectField
          label="Total following across platforms (optional)"
          value={form.total_following}
          onChange={(v) => setForm({ ...form, total_following: v })}
          options={[...CREATIVE_FOLLOWING_BANDS]}
        />
      </div>
      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section B · Work & reach ─────────────────────────────────────────────────

function SectionB({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<CreativeSectionB>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onSkip?: () => void;
  onContinue: (d: CreativeSectionB) => void;
}) {
  const [form, setForm] = useState<CreativeSectionB>({
    primary_platforms: initial?.primary_platforms ?? [],
    avg_views: initial?.avg_views ?? "",
    past_brand_partnerships: initial?.past_brand_partnerships ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      primary_platforms: {
        value: form.primary_platforms,
        label: "Primary platform(s)",
        isMulti: true,
      },
    });
    if (fieldError) {
      setErr(fieldError);
      return;
    }
    setErr(null);
    onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Banner reviewerNote={reviewerNote} err={err} />

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Primary platform(s)
          <MatchingBadge />
        </div>
        <ChipMulti
          label=""
          options={[...CREATIVE_PLATFORMS]}
          value={form.primary_platforms}
          onChange={(v) => setForm({ ...form, primary_platforms: v })}
        />
      </div>

      <SelectField
        label="Average views / attendance per project (optional)"
        value={form.avg_views}
        onChange={(v) => setForm({ ...form, avg_views: v })}
        options={[...CREATIVE_AVG_VIEWS]}
      />

      <TextArea
        label="Past brand partnerships (optional)"
        value={form.past_brand_partnerships}
        onChange={(v) => setForm({ ...form, past_brand_partnerships: v })}
        rows={3}
        placeholder="Brands you have worked with, and what the partnership involved"
      />

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section C · Sponsorship fit ──────────────────────────────────────────────

function SectionC({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<CreativeSectionC>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onSkip?: () => void;
  onContinue: (d: CreativeSectionC) => void;
}) {
  const [form, setForm] = useState<CreativeSectionC>({
    project_types: initial?.project_types ?? [],
    budget_currency: initial?.budget_currency ?? ONBOARDING_CURRENCIES[0],
    budget_band: initial?.budget_band ?? "",
    timeline: initial?.timeline ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      project_types: {
        value: form.project_types,
        label: "Project types seeking sponsorship",
        isMulti: true,
      },
    });
    if (fieldError) {
      setErr(fieldError);
      return;
    }
    setErr(null);
    onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Banner reviewerNote={reviewerNote} err={err} />

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Project types seeking sponsorship
          <MatchingBadge />
        </div>
        <ChipMulti
          label=""
          options={[...CREATIVE_PROJECT_TYPES]}
          value={form.project_types}
          onChange={(v) => setForm({ ...form, project_types: v })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Currency"
          value={form.budget_currency}
          onChange={(v) => setForm({ ...form, budget_currency: v, budget_band: "" })}
          options={[...ONBOARDING_CURRENCIES]}
        />
        <div>
          <div className="mb-1 flex items-center gap-1 text-sm font-medium">
            Typical budget needed per project (optional)
            <MatchingBadge />
          </div>
          <SelectField
            label=""
            value={form.budget_band}
            onChange={(v) => setForm({ ...form, budget_band: v })}
            options={budgetBandsFor(form.budget_currency)}
          />
        </div>
      </div>

      <SelectField
        label="Timeline for next project (optional)"
        value={form.timeline}
        onChange={(v) => setForm({ ...form, timeline: v })}
        options={[...CREATIVE_TIMELINE]}
      />

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section D · Production & placement details ───────────────────────────────

function SectionD({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<CreativeSectionD>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onSkip?: () => void;
  onContinue: (d: CreativeSectionD) => void;
}) {
  const [form, setForm] = useState<CreativeSectionD>({
    production_title: initial?.production_title ?? "",
    format: initial?.format ?? "",
    production_stage: initial?.production_stage ?? "",
    release_window: initial?.release_window ?? "",
    placements: initial?.placements ?? [],
    target_markets: initial?.target_markets ?? [],
    amount_currency: initial?.amount_currency ?? ONBOARDING_CURRENCIES[0],
    amount_sought: initial?.amount_sought ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      production_title: { value: form.production_title, label: "Production or project title" },
      format: { value: form.format, label: "Format" },
      production_stage: { value: form.production_stage, label: "Production stage" },
      placements: {
        value: form.placements,
        label: "Placement opportunities offered",
        isMulti: true,
      },
    });
    if (fieldError) {
      setErr(fieldError);
      return;
    }
    setErr(null);
    onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Banner reviewerNote={reviewerNote} err={err} />

      <Field
        label="Production or project title"
        value={form.production_title}
        onChange={(v) => setForm({ ...form, production_title: v })}
        required
      />
      <p className="-mt-4 text-xs text-muted-foreground">
        You can add more productions later from My Productions.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center gap-1 text-sm font-medium">
            Format
            <MatchingBadge />
          </div>
          <SelectField
            label=""
            value={form.format}
            onChange={(v) => setForm({ ...form, format: v })}
            options={[...CREATIVE_FORMATS]}
          />
        </div>
        <SelectField
          label="Production stage"
          value={form.production_stage}
          onChange={(v) => setForm({ ...form, production_stage: v })}
          options={[...CREATIVE_PRODUCTION_STAGES]}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Expected release window and platform (optional)
          <MatchingBadge />
        </div>
        <Field
          label=""
          value={form.release_window}
          onChange={(v) => setForm({ ...form, release_window: v })}
          placeholder="for example Cinema Q2 2027, or YouTube"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Placement opportunities offered
          <MatchingBadge />
        </div>
        <ChipMulti
          label=""
          options={[...CREATIVE_PLACEMENTS]}
          value={form.placements}
          onChange={(v) => setForm({ ...form, placements: v })}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Target audience and markets (optional)
          <MatchingBadge />
        </div>
        <ChipMulti
          label=""
          options={["Global", ...ONBOARDING_COUNTRIES]}
          value={form.target_markets}
          onChange={(v) => setForm({ ...form, target_markets: v })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Currency"
          value={form.amount_currency}
          onChange={(v) => setForm({ ...form, amount_currency: v })}
          options={[...ONBOARDING_CURRENCIES]}
        />
        <div>
          <div className="mb-1 flex items-center gap-1 text-sm font-medium">
            Sponsorship amount sought (optional)
            <MatchingBadge />
          </div>
          <Field
            label=""
            value={form.amount_sought}
            onChange={(v) => setForm({ ...form, amount_sought: v })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">Pitch deck or script extract</p>
        <p className="mt-1 text-sm text-muted-foreground">
          File upload is coming shortly. It stays private and is visible to the IGE team only until
          a match is approved — never shown publicly.
        </p>
      </div>

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

interface CreativeSectionProps {
  sectionKey: string;
  initial?: Record<string, unknown>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onSkip?: () => void;
  onContinue: (
    d: CreativeSectionData,
    extra?: { dataConsent: boolean; termsConsent: boolean },
  ) => void;
}

export function CreativeHubSection({
  sectionKey,
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onSkip,
  onContinue,
}: CreativeSectionProps) {
  /* eslint-disable @typescript-eslint/no-explicit-any -- the props union is narrowed by each case below */
  const props = {
    initial: initial as any,
    reviewerNote,
    saving,
    isLastSection,
    onSkip,
    onContinue: onContinue as any,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  switch (sectionKey) {
    case "a":
      return <SectionA {...props} />;
    case "b":
      return <SectionB {...props} />;
    case "c":
      return <SectionC {...props} />;
    case "d":
      return <SectionD {...props} />;
    case "e":
      return <MatchingProfileSection {...props} role="creative_hub" />;
    case "f":
      return <WishlistSection {...props} />;
    case "g":
      return <VerificationSection {...props} />;
    case "h":
      return <ReferralConsentSection {...props} />;
    default:
      return <div className="text-sm text-muted-foreground">Unknown section.</div>;
  }
}

// ─── Creative type picker (TAB 3 §3.1 step 4) ─────────────────────────────────

/**
 * Shown before the wizard starts. The choice is stored on the application and
 * displayed as a badge throughout the profile, and it decides which of the
 * sixteen sub-type dashboards renders later (TAB 3 §3.5).
 */
export function CreativeTypePicker({
  saving,
  onPick,
}: {
  saving: boolean;
  onPick: (creativeType: string) => void;
}) {
  const [selected, setSelected] = useState<string>("");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Creative Hub · before we start
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        What kind of creative are you?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This shapes your profile and the way brands discover your work. You can change it later.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CREATIVE_TYPES.map((t) => {
          const active = selected === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setSelected(t)}
              aria-pressed={active}
              className={
                active
                  ? "rounded-xl border-2 border-primary bg-brand-soft/50 px-4 py-3 text-sm font-semibold text-primary"
                  : "rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-muted/40"
              }
            >
              {t}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!selected || saving}
        onClick={() => onPick(selected)}
        className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
      >
        {saving ? "Saving…" : "Continue to onboarding"}
      </button>
    </div>
  );
}
