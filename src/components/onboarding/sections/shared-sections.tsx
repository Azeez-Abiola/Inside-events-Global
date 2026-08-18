/**
 * Shared onboarding sections used identically across all roles (PRD §3.6).
 * - Matching profile (Section F/E/D depending on role)
 * - Wishlist & support needed
 * - Verification & trust
 * - Referral & consent (final section)
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Field, TextArea, SelectField, Checkbox, ChipMulti } from "@/components/signup/profile-fields";
import { MatchingBadge, ContinueButton, validateRequired } from "@/components/onboarding/onboarding-wizard";
import {
  PARTNERSHIP_GOALS,
  SUCCESS_METRICS,
  ROI_MULTIPLES,
  MULTI_YEAR_INTEREST,
  WISHLIST_SUPPORT,
  VALUE_EXCHANGE,
  ONBOARDING_HEAR_ABOUT,
} from "@/lib/onboarding-constants";
import { AlertCircle } from "lucide-react";

// ─── Matching Profile ─────────────────────────────────────────────────────────

export interface MatchingProfileData {
  primary_goal: string;
  success_metrics: string[];
  roi_multiple: string;
  multi_year_interest: string;
}

export function MatchingProfileSection({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<MatchingProfileData>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onContinue: (d: MatchingProfileData) => void;
}) {
  const [form, setForm] = useState<MatchingProfileData>({
    primary_goal:       initial?.primary_goal ?? "",
    success_metrics:    initial?.success_metrics ?? [],
    roi_multiple:       initial?.roi_multiple ?? "",
    multi_year_interest: initial?.multi_year_interest ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      primary_goal:       { value: form.primary_goal,         label: "Primary goal" },
      success_metrics:    { value: form.success_metrics,      label: "Success metrics", isMulti: true },
      multi_year_interest:{ value: form.multi_year_interest,  label: "Interest in multi-year partnership" },
    });
    if (fieldError) { setErr(fieldError); return; }
    setErr(null);
    onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {reviewerNote && (
        <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p className="text-sm text-amber-800">{reviewerNote}</p>
        </div>
      )}
      {err && <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{err}</p>}

      <SelectField
        label="Primary goal for this partnership"
        value={form.primary_goal}
        onChange={(v) => setForm({ ...form, primary_goal: v })}
        options={[...PARTNERSHIP_GOALS]}
      />

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          How will you judge whether this partnership worked?
          <MatchingBadge />
        </div>
        <ChipMulti
          label=""
          options={[...SUCCESS_METRICS]}
          value={form.success_metrics}
          onChange={(v) => setForm({ ...form, success_metrics: v })}
        />
      </div>

      <SelectField
        label="Minimum acceptable ROI / value multiple"
        value={form.roi_multiple}
        onChange={(v) => setForm({ ...form, roi_multiple: v })}
        options={[...ROI_MULTIPLES]}
      />

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          Interest in a multi-year / repeat partnership
          <MatchingBadge />
        </div>
        <SelectField
          label=""
          value={form.multi_year_interest}
          onChange={(v) => setForm({ ...form, multi_year_interest: v })}
          options={[...MULTI_YEAR_INTEREST]}
        />
      </div>

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Wishlist & Support Needed ─────────────────────────────────────────────────

export interface WishlistData {
  support_needed: string[];
  wishlist_other: string;
  value_exchange: string;
}

export function WishlistSection({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<WishlistData>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onContinue: (d: WishlistData) => void;
}) {
  const [form, setForm] = useState<WishlistData>({
    support_needed: initial?.support_needed ?? [],
    wishlist_other: initial?.wishlist_other ?? "",
    value_exchange: initial?.value_exchange ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {reviewerNote && (
        <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p className="text-sm text-amber-800">{reviewerNote}</p>
        </div>
      )}

      <ChipMulti
        label="What do you need support with?"
        options={[...WISHLIST_SUPPORT]}
        value={form.support_needed}
        onChange={(v) => setForm({ ...form, support_needed: v })}
      />

      <TextArea
        label="Anything else on your wishlist?"
        value={form.wishlist_other}
        onChange={(v) => setForm({ ...form, wishlist_other: v })}
        rows={3}
        placeholder='Need a bilingual MC for a Francophone activation'
      />

      <SelectField
        label="Open to value-exchange (in-kind) partnerships?"
        value={form.value_exchange}
        onChange={(v) => setForm({ ...form, value_exchange: v })}
        options={[...VALUE_EXCHANGE]}
      />

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Verification & Trust ─────────────────────────────────────────────────────

export interface VerificationData {
  registration_number: string;
  id_document_stub: string;   // stub for v1 — actual upload flagged for v1.1
  data_processing_consent: boolean;
}

export function VerificationSection({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<VerificationData>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onContinue: (d: VerificationData) => void;
}) {
  const [form, setForm] = useState<VerificationData>({
    registration_number:     initial?.registration_number ?? "",
    id_document_stub:        initial?.id_document_stub ?? "",
    data_processing_consent: initial?.data_processing_consent ?? false,
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.data_processing_consent) {
      setErr("Data processing consent (NDPA / GDPR) is required to proceed.");
      return;
    }
    setErr(null);
    onContinue(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {reviewerNote && (
        <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p className="text-sm text-amber-800">{reviewerNote}</p>
        </div>
      )}
      {err && <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{err}</p>}

      <Field
        label="Business / organisation registration number (optional)"
        value={form.registration_number}
        onChange={(v) => setForm({ ...form, registration_number: v })}
        placeholder="e.g. CAC-RC123456 (Nigeria) or Companies House number (UK)"
      />

      {/* Document upload stub — v1 */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4">
        <p className="text-sm font-medium text-foreground">ID or registration document upload</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Document upload will be available in a future update (v1.1). For now, an IGE team member
          will contact you directly if we need to verify your identity or organisation.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Data processing consent (NDPA / GDPR) <span className="text-destructive">*</span>
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          This consent is separate from general Terms & Privacy. It specifically covers
          cross-border data processing and consent to be matched and introduced to third parties
          on the IGE platform, in accordance with the Nigeria Data Protection Act (NDPA) and GDPR
          for international applicants.
        </p>
        <Checkbox
          label="I consent to IGE processing my data for matching and introductions across borders."
          checked={form.data_processing_consent}
          onChange={(v) => setForm({ ...form, data_processing_consent: v })}
        />
      </div>

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Referral & Consent (final section) ──────────────────────────────────────

export interface ReferralConsentData {
  hear_about: string;
  referred_by: string;
  additional_notes: string;
  specific_event_organiser?: string;  // Sponsor-only optional field
  terms_accepted: boolean;
  data_consent: boolean;
}

export function ReferralConsentSection({
  initial,
  reviewerNote,
  saving,
  showSpecificEventField,
  onContinue,
}: {
  initial?: Partial<ReferralConsentData>;
  reviewerNote?: string;
  saving: boolean;
  showSpecificEventField?: boolean;
  onContinue: (d: ReferralConsentData, extra: { dataConsent: boolean; termsConsent: boolean }) => void;
}) {
  const [form, setForm] = useState<ReferralConsentData>({
    hear_about:              initial?.hear_about ?? "",
    referred_by:             initial?.referred_by ?? "",
    additional_notes:        initial?.additional_notes ?? "",
    specific_event_organiser: initial?.specific_event_organiser ?? "",
    terms_accepted:          initial?.terms_accepted ?? false,
    data_consent:            initial?.data_consent ?? false,
  });
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.terms_accepted) {
      setErr("You must accept the Terms & Privacy Policy to submit your application.");
      return;
    }
    if (!form.data_consent) {
      setErr("Data processing consent (NDPA / GDPR) is required to submit.");
      return;
    }
    setErr(null);
    onContinue(form, { dataConsent: form.data_consent, termsConsent: form.terms_accepted });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {reviewerNote && (
        <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p className="text-sm text-amber-800">{reviewerNote}</p>
        </div>
      )}
      {err && <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{err}</p>}

      <SelectField
        label="How did you hear about IGE?"
        value={form.hear_about}
        onChange={(v) => setForm({ ...form, hear_about: v })}
        options={[...ONBOARDING_HEAR_ABOUT]}
      />

      <Field
        label="Who referred you? (optional)"
        value={form.referred_by}
        onChange={(v) => setForm({ ...form, referred_by: v })}
        placeholder="Name of person or organisation"
      />

      {showSpecificEventField && (
        <Field
          label="Specific event or organiser already in mind? (optional)"
          value={form.specific_event_organiser ?? ""}
          onChange={(v) => setForm({ ...form, specific_event_organiser: v })}
          placeholder="Event name or organiser name"
        />
      )}

      <TextArea
        label="Anything else you'd like us to know? (optional)"
        value={form.additional_notes}
        onChange={(v) => setForm({ ...form, additional_notes: v })}
        rows={3}
        placeholder="Any additional context for your application…"
      />

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-bold text-foreground">Consent &amp; submission</p>

        <div className="space-y-1">
          <Checkbox
            label=""
            checked={form.data_consent}
            onChange={(v) => setForm({ ...form, data_consent: v })}
          />
          <p className="pl-6 text-xs text-muted-foreground">
            I consent to IGE processing my personal data for matching and introductions in
            accordance with the{" "}
            <Link to="/privacy" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            (NDPA / GDPR). <span className="text-destructive">*</span>
          </p>
        </div>

        <div className="space-y-1">
          <Checkbox
            label=""
            checked={form.terms_accepted}
            onChange={(v) => setForm({ ...form, terms_accepted: v })}
          />
          <p className="pl-6 text-xs text-muted-foreground">
            I agree to the IGE{" "}
            <Link to="/terms" className="font-semibold text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </Link>
            . <span className="text-destructive">*</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-xs text-primary-deep">
          <span className="font-bold">What happens next?</span> Your application will be reviewed
          by the IGE team within 1–3 business days. You'll receive an email when it's approved,
          and can check your status at any time on the pending screen.
        </p>
      </div>

      <ContinueButton saving={saving} isLastSection={true} />
    </form>
  );
}
