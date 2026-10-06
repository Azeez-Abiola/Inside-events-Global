/**
 * Partnerships Pro onboarding sections A–H (TAB 3 §3.6.5)
 * A=Professional details, B=Client portfolio, C=Commission & goals, D=CRM setup,
 * E=Matching profile, F=Wishlist, G=Verification, H=Referral & consent
 *
 * This role is a full CRM user for partnerships in any sector, not only events,
 * so the matching fields are client types, partnership types and sectors rather
 * than anything event-specific.
 */
import { useState } from "react";
import { InfoTip } from "@/components/info-tip";
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
  ONBOARDING_SECTORS,
  ONBOARDING_CURRENCIES,
  PRO_EXPERIENCE_YEARS,
  PRO_PROFESSIONAL_TYPES,
  PRO_CLIENT_TYPES,
  PRO_PARTNERSHIP_TYPES,
  PRO_DEALS_PER_QUARTER,
  PRO_INTROS_PER_MONTH,
  PRO_REPORTS_TO,
  PRO_CONTACT_TYPES,
  PRO_DEFAULT_PIPELINE_STAGES,
  REFERRAL_COMMISSION_STRUCTURES,
} from "@/lib/onboarding-constants";
import { AlertCircle } from "lucide-react";

// ─── Data types ───────────────────────────────────────────────────────────────

export interface ProSectionA {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  linkedin_url: string;
  years_experience: string;
  clients_managed: string;
  professional_type: string;
  company_name: string;
}
export interface ProSectionB {
  client_types: string[];
  partnership_types: string[];
  sectors_of_focus: string[];
  pipeline_currency: string;
  pipeline_value: string;
  deals_per_quarter: string;
}
export interface ProSectionC {
  commission_preference: string;
  intros_per_month: string;
  preferred_currency: string;
  currencies_worked_in: string[];
  reports_to: string;
}
export interface ProSectionD {
  contact_types: string[];
  pipeline_stages: string;
}

export type ProSectionData =
  | ProSectionA
  | ProSectionB
  | ProSectionC
  | ProSectionD
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

// ─── Section A · Professional details ─────────────────────────────────────────

function SectionA({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<ProSectionA>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onSkip?: () => void;
  onContinue: (d: ProSectionA) => void;
}) {
  const [form, setForm] = useState<ProSectionA>({
    full_name: initial?.full_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    country: initial?.country ?? "",
    linkedin_url: initial?.linkedin_url ?? "",
    years_experience: initial?.years_experience ?? "",
    clients_managed: initial?.clients_managed ?? "",
    professional_type: initial?.professional_type ?? "",
    company_name: initial?.company_name ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      full_name: { value: form.full_name, label: "Full name" },
      email: { value: form.email, label: "Email" },
      phone: { value: form.phone, label: "Phone number" },
      country: { value: form.country, label: "Country" },
      professional_type: { value: form.professional_type, label: "Professional type" },
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
          label="Full name"
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
        <div>
          <div className="mb-1 flex items-center gap-1 text-sm font-medium">
            Country
            <InfoTip tip="field.country" />
          </div>
          <SelectField
            label=""
            value={form.country}
            onChange={(v) => setForm({ ...form, country: v })}
            options={[...ONBOARDING_COUNTRIES]}
          />
        </div>
        <Field
          label="LinkedIn profile URL (optional)"
          value={form.linkedin_url}
          onChange={(v) => setForm({ ...form, linkedin_url: v })}
        />
        <SelectField
          label="Years of partnerships / sponsorship experience (optional)"
          value={form.years_experience}
          onChange={(v) => setForm({ ...form, years_experience: v })}
          options={[...PRO_EXPERIENCE_YEARS]}
        />
        <Field
          label="Number of clients currently managed (optional)"
          value={form.clients_managed}
          onChange={(v) => setForm({ ...form, clients_managed: v })}
        />
        <Field
          label="Company / agency name (optional)"
          value={form.company_name}
          onChange={(v) => setForm({ ...form, company_name: v })}
          placeholder="Leave blank if you work independently"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Professional type
          <MatchingBadge />
        </div>
        <SelectField
          label=""
          value={form.professional_type}
          onChange={(v) => setForm({ ...form, professional_type: v })}
          options={[...PRO_PROFESSIONAL_TYPES]}
        />
      </div>

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section B · Client portfolio ─────────────────────────────────────────────

function SectionB({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<ProSectionB>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onSkip?: () => void;
  onContinue: (d: ProSectionB) => void;
}) {
  const [form, setForm] = useState<ProSectionB>({
    client_types: initial?.client_types ?? [],
    partnership_types: initial?.partnership_types ?? [],
    sectors_of_focus: initial?.sectors_of_focus ?? [],
    pipeline_currency: initial?.pipeline_currency ?? "",
    pipeline_value: initial?.pipeline_value ?? "",
    deals_per_quarter: initial?.deals_per_quarter ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      client_types: { value: form.client_types, label: "Client types managed", isMulti: true },
      partnership_types: {
        value: form.partnership_types,
        label: "Partnership types you manage",
        isMulti: true,
      },
      sectors_of_focus: { value: form.sectors_of_focus, label: "Sectors of focus", isMulti: true },
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
          Client types managed
          <MatchingBadge />
        </div>
        <ChipMulti
          label=""
          options={[...PRO_CLIENT_TYPES]}
          value={form.client_types}
          onChange={(v) => setForm({ ...form, client_types: v })}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Partnership types you manage
          <MatchingBadge />
        </div>
        <ChipMulti
          label=""
          options={[...PRO_PARTNERSHIP_TYPES]}
          value={form.partnership_types}
          onChange={(v) => setForm({ ...form, partnership_types: v })}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Sectors of focus
          <MatchingBadge />
        </div>
        <ChipMulti
          label=""
          options={[...ONBOARDING_SECTORS]}
          value={form.sectors_of_focus}
          onChange={(v) => setForm({ ...form, sectors_of_focus: v })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Pipeline currency (optional)"
          value={form.pipeline_currency}
          onChange={(v) => setForm({ ...form, pipeline_currency: v })}
          options={[...ONBOARDING_CURRENCIES]}
        />
        <Field
          label="Active pipeline value under management (optional)"
          value={form.pipeline_value}
          onChange={(v) => setForm({ ...form, pipeline_value: v })}
        />
        <SelectField
          label="Average deals closed per quarter (optional)"
          value={form.deals_per_quarter}
          onChange={(v) => setForm({ ...form, deals_per_quarter: v })}
          options={[...PRO_DEALS_PER_QUARTER]}
        />
      </div>

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section C · Commission & goals ───────────────────────────────────────────

function SectionC({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<ProSectionC>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onSkip?: () => void;
  onContinue: (d: ProSectionC) => void;
}) {
  const [form, setForm] = useState<ProSectionC>({
    commission_preference: initial?.commission_preference ?? "",
    intros_per_month: initial?.intros_per_month ?? "",
    preferred_currency: initial?.preferred_currency ?? "",
    currencies_worked_in: initial?.currencies_worked_in ?? [],
    reports_to: initial?.reports_to ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      currencies_worked_in: {
        value: form.currencies_worked_in,
        label: "Currencies you work in",
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center gap-1 text-sm font-medium">
            Commission structure preference (optional)
            <InfoTip tip="field.commission_structure" />
          </div>
          <SelectField
            label=""
            value={form.commission_preference}
            onChange={(v) => setForm({ ...form, commission_preference: v })}
            options={[...REFERRAL_COMMISSION_STRUCTURES]}
          />
        </div>
        <SelectField
          label="Target introductions per month (optional)"
          value={form.intros_per_month}
          onChange={(v) => setForm({ ...form, intros_per_month: v })}
          options={[...PRO_INTROS_PER_MONTH]}
        />
        <SelectField
          label="Preferred payout currency (optional)"
          value={form.preferred_currency}
          onChange={(v) => setForm({ ...form, preferred_currency: v })}
          options={[...ONBOARDING_CURRENCIES]}
        />
        <div>
          <div>
            <div className="mb-1 flex items-center gap-1 text-sm font-medium">
              Who do you report your work to? (optional)
              <InfoTip tip="field.pro_reports_to" />
            </div>
            <SelectField
              label=""
              value={form.reports_to}
              onChange={(v) => setForm({ ...form, reports_to: v })}
              options={[...PRO_REPORTS_TO]}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sets the default format of your Weekly Activity Report.
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">Currencies you work in</p>
        <ChipMulti
          label=""
          options={[...ONBOARDING_CURRENCIES]}
          value={form.currencies_worked_in}
          onChange={(v) => setForm({ ...form, currencies_worked_in: v })}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Your CRM can track several currencies at once.
        </p>
      </div>

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Section D · CRM setup ────────────────────────────────────────────────────

function SectionD({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<ProSectionD>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onSkip?: () => void;
  onContinue: (d: ProSectionD) => void;
}) {
  const [form, setForm] = useState<ProSectionD>({
    contact_types: initial?.contact_types ?? [],
    pipeline_stages: initial?.pipeline_stages ?? PRO_DEFAULT_PIPELINE_STAGES.join(", "),
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      contact_types: { value: form.contact_types, label: "Contact types to track", isMulti: true },
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
        <p className="mb-1 text-sm font-medium">Contact types to track</p>
        <ChipMulti
          label=""
          options={[...PRO_CONTACT_TYPES]}
          value={form.contact_types}
          onChange={(v) => setForm({ ...form, contact_types: v })}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          You can change these later from Contacts.
        </p>
      </div>

      <TextArea
        label="Pipeline stages"
        value={form.pipeline_stages}
        onChange={(v) => setForm({ ...form, pipeline_stages: v })}
        rows={2}
        hint="Comma-separated, in order. Editable later from your pipeline."
      />

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">Import existing contacts</p>
        <p className="mt-1 text-sm text-muted-foreground">
          CSV and Excel import will be available from Contacts once your dashboard is set up, so you
          can bring your list over whenever it suits you.
        </p>
      </div>

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

interface ProSectionProps {
  sectionKey: string;
  initial?: Record<string, unknown>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onSkip?: () => void;
  onContinue: (d: ProSectionData, extra?: { dataConsent: boolean; termsConsent: boolean }) => void;
}

export function PartnershipsProSection({
  sectionKey,
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onSkip,
  onContinue,
}: ProSectionProps) {
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
      return <MatchingProfileSection {...props} role="partnerships_pro" />;
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
