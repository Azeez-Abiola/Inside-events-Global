"use client";
/**
 * IGE Onboarding Wizard (PRD §3.2.5)
 * Shared shell used by all 4 current roles.
 * Left rail: logo + role badge + numbered section list.
 * Main panel: thin progress bar, mono step label, section title, field grid, Back/Continue.
 * Matching fields show a 🎯 badge. Validation runs on Continue, not Back.
 * Final section Continue is labelled "Submit application".
 * Progress is saved to the server on every Continue click (save & resume, §3.12.1).
 */
import { useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
  getSectionsForRole,
  ROLE_DISPLAY,
  type OnboardingRole,
  type SectionDef,
} from "@/lib/onboarding-constants";
import { saveOnboardingSection, submitOnboardingApplication } from "@/lib/onboarding.functions";
import type { OrganiserSectionData } from "@/components/onboarding/sections/organiser-sections";
import type { SponsorSectionData } from "@/components/onboarding/sections/sponsor-sections";
import type { ReferralSectionData } from "@/components/onboarding/sections/referral-sections";
import type { MediaSectionData } from "@/components/onboarding/sections/media-sections";
import { OrganiserSection } from "@/components/onboarding/sections/organiser-sections";
import { SponsorSection } from "@/components/onboarding/sections/sponsor-sections";
import { ReferralSection } from "@/components/onboarding/sections/referral-sections";
import { MediaSection } from "@/components/onboarding/sections/media-sections";

// ─── Types ────────────────────────────────────────────────────────────────────

type AllSections =
  | OrganiserSectionData
  | SponsorSectionData
  | ReferralSectionData
  | MediaSectionData;

interface OnboardingWizardProps {
  role: OnboardingRole;
  /** Pre-loaded sections from server (save & resume). Keyed by section letter. */
  savedSections?: Record<string, AllSections>;
  /** Index of section to resume at (0-based). */
  resumeAt?: number;
  /** Reviewer notes when status === 'changes_requested'. Keyed by section letter. */
  reviewerNotes?: Record<string, string>;
}

// ─── MatchingBadge ────────────────────────────────────────────────────────────

export function MatchingBadge() {
  return (
    <span
      title="This field directly powers your match score"
      className="ml-1 inline-flex items-center gap-0.5 rounded-full border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[10px] font-bold text-primary"
    >
      🎯 matching field
    </span>
  );
}

// ─── Left Rail ────────────────────────────────────────────────────────────────

function ProgressRail({
  sections,
  currentIdx,
  roleLabel,
  roleIcon,
}: {
  sections: SectionDef[];
  currentIdx: number;
  roleLabel: string;
  roleIcon: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/30 lg:flex">
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <BrandLogo size="sm" />
      </div>

      <div className="px-6 py-4">
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary-deep">
          <span className="text-lg">{roleIcon}</span>
          {roleLabel}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2">
        <ol className="space-y-1">
          {sections.map((sec, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <li key={sec.key} className="flex items-start gap-3 rounded-lg px-2 py-2.5">
                <span className="mt-0.5 shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-secondary" />
                  ) : active ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                      {i + 1}
                    </span>
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={`truncate text-xs font-medium leading-tight ${
                      active
                        ? "text-primary-deep"
                        : done
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60"
                    }`}
                  >
                    Section {sec.key.toUpperCase()} — {sec.title}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="border-t border-border px-6 py-4">
        <p className="text-[11px] text-muted-foreground">
          Fields marked <span className="font-bold text-primary">🎯</span> power your match score.
        </p>
      </div>
    </aside>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  section,
  currentIdx,
  totalSections,
  roleLabel,
}: {
  section: SectionDef;
  currentIdx: number;
  totalSections: number;
  roleLabel: string;
}) {
  const pct = Math.round((currentIdx / totalSections) * 100);
  const sectionLetter = section.key.toUpperCase();

  return (
    <div className="mb-6">
      {/* Thin progress bar */}
      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-brand-gradient transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Mono step label (PRD §3.2.5) */}
      <p className="mb-1 font-mono text-xs font-medium tracking-widest text-muted-foreground">
        Section {sectionLetter} of {totalSections.toString()} · {roleLabel}
      </p>
      <h2 className="font-display text-2xl font-bold text-foreground">{section.title}</h2>
      {section.subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>
      )}
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function OnboardingWizard({
  role,
  savedSections = {},
  resumeAt = 0,
  reviewerNotes = {},
}: OnboardingWizardProps) {
  const navigate = useNavigate();
  const sections = getSectionsForRole(role);
  const roleInfo = ROLE_DISPLAY[role];
  const [currentIdx, setCurrentIdx] = useState(resumeAt);
  const [sectionData, setSectionData] = useState<Record<string, AllSections>>(savedSections);
  const [error, setError] = useState<string | null>(null);

  const saveFn = useServerFn(saveOnboardingSection);
  const submitFn = useServerFn(submitOnboardingApplication);

  const isLastSection = currentIdx === sections.length - 1;
  const currentSection = sections[currentIdx];

  const saveAndAdvance = useMutation({
    mutationFn: async ({
      sectionKey,
      data,
      isSubmit,
      dataConsent,
      termsConsent,
    }: {
      sectionKey: string;
      data: AllSections;
      isSubmit: boolean;
      dataConsent?: boolean;
      termsConsent?: boolean;
    }) => {
      // Save this section
      await saveFn({
        data: {
          role,
          sectionKey,
          sectionData: data as unknown as Record<string, unknown>,  // AllSections → unknown → Record
          currentSection: currentIdx,
        },
      });

      if (isSubmit) {
        if (!dataConsent || !termsConsent) {
          throw new Error("Both consent checkboxes are required to submit.");
        }
        await submitFn({
          data: {
            dataConsentAccepted:  true,
            termsConsentAccepted: true,
            clientIp:             typeof window !== "undefined" ? "" : "server",
          },
        });
      }
    },
    onSuccess: (_res, vars) => {
      setError(null);
      if (vars.isSubmit) {
        navigate({ to: "/onboarding/pending" as never });
        return;
      }
      setCurrentIdx((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (e: Error) => {
      setError(e.message);
      toast.error(e.message);
    },
  });

  const handleContinue = useCallback(
    (data: AllSections, extra?: { dataConsent: boolean; termsConsent: boolean }) => {
      const key = currentSection.key;
      setSectionData((prev) => ({ ...prev, [key]: data as unknown as AllSections }));
      saveAndAdvance.mutate({
        sectionKey:   key,
        data,
        isSubmit:     isLastSection,
        dataConsent:  extra?.dataConsent,
        termsConsent: extra?.termsConsent,
      });
    },
    [currentSection.key, isLastSection, saveAndAdvance],
  );

  const handleBack = () => {
    setError(null);
    setCurrentIdx((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sectionNote = reviewerNotes[currentSection.key];

  function renderSection() {
    const initial = sectionData[currentSection.key] as unknown as Record<string, unknown> | undefined;
    const pending = saveAndAdvance.isPending;
    const isLast = isLastSection;
    const note = sectionNote;

    if (role === "organiser") {
      return (
        <OrganiserSection
          sectionKey={currentSection.key}
          initial={initial}
          reviewerNote={note}
          isLastSection={isLast}
          saving={pending}
          onContinue={handleContinue}
        />
      );
    }
    if (role === "sponsor") {
      return (
        <SponsorSection
          sectionKey={currentSection.key}
          initial={initial}
          reviewerNote={note}
          isLastSection={isLast}
          saving={pending}
          onContinue={handleContinue}
        />
      );
    }
    if (role === "referral_partner") {
      return (
        <ReferralSection
          sectionKey={currentSection.key}
          initial={initial}
          reviewerNote={note}
          isLastSection={isLast}
          saving={pending}
          onContinue={handleContinue}
        />
      );
    }
    if (role === "media_partner") {
      return (
        <MediaSection
          sectionKey={currentSection.key}
          initial={initial}
          reviewerNote={note}
          isLastSection={isLast}
          saving={pending}
          onContinue={handleContinue}
        />
      );
    }
    return <div className="text-muted-foreground text-sm">Role not yet supported.</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <ProgressRail
        sections={sections}
        currentIdx={currentIdx}
        roleLabel={roleInfo.label}
        roleIcon={roleInfo.icon}
      />

      <main className="flex flex-1 flex-col">
        {/* Mobile progress header */}
        <div className="border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <BrandLogo size="sm" />
            <span className="font-mono text-xs text-muted-foreground">
              {roleInfo.icon} {roleInfo.label} · {currentIdx + 1}/{sections.length}
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand-gradient"
              style={{ width: `${Math.round((currentIdx / sections.length) * 100)}%` }}
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-8">
          <SectionHeader
            section={currentSection}
            currentIdx={currentIdx}
            totalSections={sections.length}
            roleLabel={roleInfo.label}
          />

          {/* Reviewer note banner (changes_requested) */}
          {sectionNote && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-xs font-bold text-amber-900">Reviewer note for this section</p>
                <p className="mt-0.5 text-sm text-amber-800">{sectionNote}</p>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {renderSection()}

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center gap-3">
            {currentIdx > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={saveAndAdvance.isPending}
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            <p className="ml-auto text-xs text-muted-foreground">
              Progress is saved automatically.
            </p>
          </div>
        </div>

        <footer className="border-t border-border px-8 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Need help?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Back to sign-in
            </Link>{" "}
            ·{" "}
            <a href="mailto:hi@insideglobalevents.com" className="font-semibold text-primary hover:underline">
              Contact support
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

// ─── Shared Continue button (used in each section component) ─────────────────

export function ContinueButton({
  saving,
  isLastSection,
}: {
  saving: boolean;
  isLastSection: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
    >
      {saving ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
      ) : isLastSection ? (
        <>Submit application <ChevronRight className="h-4 w-4" /></>
      ) : (
        <>Continue <ChevronRight className="h-4 w-4" /></>
      )}
    </button>
  );
}

// ─── Shared field wrapper with required validation helper ─────────────────────

export function validateRequired(
  fields: Record<string, { value: unknown; label: string; isMulti?: boolean }>,
): string | null {
  for (const [, cfg] of Object.entries(fields)) {
    if (cfg.isMulti) {
      if (!Array.isArray(cfg.value) || cfg.value.length === 0) {
        return `"${cfg.label}" is required — please select at least one option.`;
      }
    } else {
      if (!cfg.value || (typeof cfg.value === "string" && !cfg.value.trim())) {
        return `"${cfg.label}" is required.`;
      }
    }
  }
  return null;
}
