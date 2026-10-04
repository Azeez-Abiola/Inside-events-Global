/**
 * Shared onboarding sections used identically across all roles (PRD §3.6).
 * - Matching profile (Section F/E/D depending on role)
 * - Wishlist & support needed
 * - Verification & trust
 * - Referral & consent (final section)
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Field,
  TextArea,
  SelectField,
  Checkbox,
  ChipMulti,
} from "@/components/signup/profile-fields";
import {
  MatchingBadge,
  ContinueButton,
  validateRequired,
} from "@/components/onboarding/onboarding-wizard";
import { SuccessMetricsPicker } from "@/components/onboarding/success-metrics-picker";
import { InfoTip } from "@/components/info-tip";
import {
  PARTNERSHIP_GOALS,
  ROI_MULTIPLES,
  MULTI_YEAR_INTEREST,
  WISHLIST_SUPPORT,
  VALUE_EXCHANGE,
  ONBOARDING_HEAR_ABOUT,
  CAN_OFFER_PARTNER,
  ROI_PILLARS,
  WANT_FROM_PARTNER,
  OFFER_BEYOND_CASH,
  ABW_CONSULTING_INTEREST,
  ABW_SERVICES,
  ABW_PAYMENT_PREFERENCE,
  type OnboardingRole,
} from "@/lib/onboarding-constants";
import { AlertCircle } from "lucide-react";

// ─── Matching Profile ─────────────────────────────────────────────────────────

export interface MatchingProfileData {
  primary_goal: string;
  success_metrics: string[];
  roi_multiple: string;
  multi_year_interest: string;
  /** v6.3: asked of every role — what they will give back to a partner. */
  can_offer: string[];
  give_back_text: string;
  /** v6.3: Event Organiser only — the ROI they can offer a sponsor. */
  roi_offer: string[];
  /** v6.3: Brand / Sponsor only — the ROI they expect from a sponsorship. */
  roi_expect: string[];
  /** v6.3: Organiser and Sponsor — what they want from a partner. */
  want_from_partner: string[];
  /** v6.3: Brand / Sponsor only — what they can offer beyond cash. */
  offer_beyond_cash: string[];
}

export function MatchingProfileSection({
  initial,
  role,
  reviewerNote,
  saving,
  isLastSection,
  onContinue,
}: {
  initial?: Partial<MatchingProfileData>;
  /** Drives the Organiser- and Sponsor-only fields (TAB 3 §3.6.1 Section F). */
  role?: OnboardingRole;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  onContinue: (d: MatchingProfileData) => void;
}) {
  const isOrganiser = role === "organiser";
  const isSponsor = role === "sponsor";
  const [form, setForm] = useState<MatchingProfileData>({
    primary_goal: initial?.primary_goal ?? "",
    success_metrics: initial?.success_metrics ?? [],
    roi_multiple: initial?.roi_multiple ?? "",
    multi_year_interest: initial?.multi_year_interest ?? "",
    can_offer: initial?.can_offer ?? [],
    give_back_text: initial?.give_back_text ?? "",
    roi_offer: initial?.roi_offer ?? [],
    roi_expect: initial?.roi_expect ?? [],
    want_from_partner: initial?.want_from_partner ?? [],
    offer_beyond_cash: initial?.offer_beyond_cash ?? [],
  });
  const [err, setErr] = useState<string | null>(null);

  /** Merge a single pillar's selection back into the flat ROI list. */
  function setPillar(field: "roi_offer" | "roi_expect", pillarOptions: string[], next: string[]) {
    const others = form[field].filter((v) => !pillarOptions.includes(v));
    setForm({ ...form, [field]: [...others, ...next] });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldError = validateRequired({
      primary_goal: { value: form.primary_goal, label: "Primary goal" },
      success_metrics: { value: form.success_metrics, label: "Success metrics", isMulti: true },
      multi_year_interest: {
        value: form.multi_year_interest,
        label: "Interest in multi-year partnership",
      },
      can_offer: { value: form.can_offer, label: "What you can offer a partner", isMulti: true },
      ...(isOrganiser
        ? {
            roi_offer: {
              value: form.roi_offer,
              label: "ROI you can offer sponsors",
              isMulti: true,
            },
            want_from_partner: {
              value: form.want_from_partner,
              label: "What you want from a partner",
              isMulti: true,
            },
          }
        : {}),
      ...(isSponsor
        ? {
            roi_expect: {
              value: form.roi_expect,
              label: "ROI you expect from a sponsorship",
              isMulti: true,
            },
            want_from_partner: {
              value: form.want_from_partner,
              label: "What you want from a partner",
              isMulti: true,
            },
          }
        : {}),
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

      <SelectField
        label="Primary goal for this partnership"
        value={form.primary_goal}
        onChange={(v) => setForm({ ...form, primary_goal: v })}
        options={[...PARTNERSHIP_GOALS]}
      />

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          How will you judge whether this partnership worked?
          <InfoTip tip="field.success_metrics" />
          <MatchingBadge />
        </div>
        <SuccessMetricsPicker
          role={role ?? "organiser"}
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

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
          What can you offer a partner?
          <MatchingBadge />
        </div>
        <ChipMulti
          label=""
          options={[...CAN_OFFER_PARTNER]}
          value={form.can_offer}
          onChange={(v) => setForm({ ...form, can_offer: v })}
        />
      </div>

      <TextArea
        label="Tell partners what you would give back (optional)"
        value={form.give_back_text}
        onChange={(v) => setForm({ ...form, give_back_text: v })}
        rows={3}
        placeholder="Summarised for Admin and included in approved match notifications"
      />

      {isOrganiser && (
        <RoiPillarPicker
          heading="ROI you can offer sponsors"
          selected={form.roi_offer}
          onPillarChange={(opts, next) => setPillar("roi_offer", opts, next)}
        />
      )}

      {isSponsor && (
        <RoiPillarPicker
          heading="ROI you expect from a sponsorship"
          selected={form.roi_expect}
          onPillarChange={(opts, next) => setPillar("roi_expect", opts, next)}
        />
      )}

      {(isOrganiser || isSponsor) && (
        <div>
          <div className="mb-1 flex items-center gap-1 text-sm font-medium">
            What you want from a partner
            <MatchingBadge />
          </div>
          <ChipMulti
            label=""
            options={[...WANT_FROM_PARTNER]}
            value={form.want_from_partner}
            onChange={(v) => setForm({ ...form, want_from_partner: v })}
          />
        </div>
      )}

      {isSponsor && (
        <div>
          <div className="mb-1 flex items-center gap-1 text-sm font-medium">
            What you can offer an event beyond cash (optional)
            <MatchingBadge />
          </div>
          <ChipMulti
            label=""
            options={[...OFFER_BEYOND_CASH]}
            value={form.offer_beyond_cash}
            onChange={(v) => setForm({ ...form, offer_beyond_cash: v })}
          />
        </div>
      )}

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

/** The three IEG value pillars, rendered as one pill group per pillar. */
function RoiPillarPicker({
  heading,
  selected,
  onPillarChange,
}: {
  heading: string;
  selected: string[];
  onPillarChange: (pillarOptions: string[], next: string[]) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-1 text-sm font-medium">
        {heading}
        <MatchingBadge />
      </div>
      {ROI_PILLARS.map((p) => (
        <div key={p.pillar}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {p.pillar}
          </p>
          <ChipMulti
            label=""
            options={p.options}
            value={selected.filter((v) => p.options.includes(v))}
            onChange={(next) => onPillarChange(p.options, next)}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Wishlist & Support Needed ─────────────────────────────────────────────────

export interface WishlistData {
  support_needed: string[];
  wishlist_other: string;
  value_exchange: string;
  /** v6.3: answering Yes sends a lead to the Admin Inbox (TAB 6 §6.10). */
  abw_consulting: string;
  abw_services: string[];
  abw_payment_preference: string;
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
    abw_consulting: initial?.abw_consulting ?? "",
    abw_services: initial?.abw_services ?? [],
    abw_payment_preference: initial?.abw_payment_preference ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const wantsConsulting = form.abw_consulting === ABW_CONSULTING_INTEREST[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Compulsory at the 26 September review: "Nothing right now" is an option,
    // but the question has to be answered so IGE knows what support to offer.
    const fieldError = validateRequired({
      support_needed: {
        value: form.support_needed,
        label: "What you need support with",
        isMulti: true,
      },
      abw_consulting: { value: form.abw_consulting, label: "Would you like ABW Consulting?" },
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
        placeholder="Need a bilingual MC for a Francophone activation"
      />

      <SelectField
        label="Open to value-exchange (in-kind) partnerships?"
        value={form.value_exchange}
        onChange={(v) => setForm({ ...form, value_exchange: v })}
        options={[...VALUE_EXCHANGE]}
      />

      <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
        <SelectField
          label="Would you like ABW Consulting?"
          value={form.abw_consulting}
          onChange={(v) => setForm({ ...form, abw_consulting: v })}
          options={[...ABW_CONSULTING_INTEREST]}
        />
        {wantsConsulting && (
          <>
            <div>
              <p className="mb-1 text-sm font-medium">Services of interest</p>
              <ChipMulti
                label=""
                options={[...ABW_SERVICES]}
                value={form.abw_services}
                onChange={(v) => setForm({ ...form, abw_services: v })}
              />
            </div>
            <SelectField
              label="Preferred way to pay"
              value={form.abw_payment_preference}
              onChange={(v) => setForm({ ...form, abw_payment_preference: v })}
              options={[...ABW_PAYMENT_PREFERENCE]}
            />
            <p className="text-xs text-muted-foreground">
              No prices are shown here — the IGE team will follow up to arrange a meeting.
            </p>
          </>
        )}
      </div>

      <ContinueButton saving={saving} isLastSection={isLastSection} />
    </form>
  );
}

// ─── Verification & Trust ─────────────────────────────────────────────────────

export interface VerificationData {
  registration_number: string;
  id_document_stub: string; // stub for v1 — actual upload flagged for v1.1
  data_processing_consent: boolean;
}

export function VerificationSection({
  initial,
  reviewerNote,
  saving,
  isLastSection,
  onSkip,
  onContinue,
}: {
  initial?: Partial<VerificationData>;
  reviewerNote?: string;
  saving: boolean;
  isLastSection: boolean;
  /** Present when the config marks this section deferrable (§3.2A). */
  onSkip?: () => void;
  onContinue: (d: VerificationData) => void;
}) {
  const [form, setForm] = useState<VerificationData>({
    registration_number: initial?.registration_number ?? "",
    id_document_stub: initial?.id_document_stub ?? "",
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
      {err && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}

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
          This consent is separate from general Terms & Privacy. It specifically covers cross-border
          data processing and consent to be matched and introduced to third parties on the IGE
          platform, in accordance with the Nigeria Data Protection Act (NDPA) and GDPR for
          international applicants.
        </p>
        <Checkbox
          label="I consent to IGE processing my data for matching and introductions across borders."
          checked={form.data_processing_consent}
          onChange={(v) => setForm({ ...form, data_processing_consent: v })}
        />
      </div>

      <ContinueButton saving={saving} isLastSection={isLastSection} onSkip={onSkip} />
    </form>
  );
}

// ─── Referral & Consent (final section) ──────────────────────────────────────

export interface ReferralConsentData {
  hear_about: string;
  referred_by: string;
  additional_notes: string;
  specific_event_organiser?: string; // Sponsor-only optional field
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
  onContinue: (
    d: ReferralConsentData,
    extra: { dataConsent: boolean; termsConsent: boolean },
  ) => void;
}) {
  const [form, setForm] = useState<ReferralConsentData>({
    hear_about: initial?.hear_about ?? "",
    referred_by: initial?.referred_by ?? "",
    additional_notes: initial?.additional_notes ?? "",
    specific_event_organiser: initial?.specific_event_organiser ?? "",
    terms_accepted: initial?.terms_accepted ?? false,
    data_consent: initial?.data_consent ?? false,
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
      {err && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      )}

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
          <span className="font-bold">What happens next?</span> Your application will be reviewed by
          the IGE team within 1–3 business days. You'll receive an email when it's approved, and can
          check your status at any time on the pending screen.
        </p>
      </div>

      <ContinueButton saving={saving} isLastSection={true} />
    </form>
  );
}
