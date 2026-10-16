/**
 * Dashboard-first onboarding. A new account lands on its real dashboard and
 * finishes the compulsory onboarding sections here, in a panel at the top of
 * the dashboard home, instead of being held in a full-screen wizard first.
 * Features that need the missing data stay locked until it is in.
 *
 * Note: this deliberately changes TAB 3 §3.2 ("the person reaches their
 * dashboard immediately after the compulsory sections"), at the product
 * owner's request; the full-screen wizard is still one click away.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronUp, Maximize2, Sparkles } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getOnboardingGateState, loadMyWizardState } from "@/lib/onboarding.functions";
import { getSectionsForRole, ROLE_DISPLAY, type OnboardingRole } from "@/lib/onboarding-constants";

type WizardApp = {
  role: string;
  sections: Record<string, unknown>;
  current_section: number;
  status: string;
  reviewer_notes: Record<string, string>;
};

export function SetupPanel() {
  const qc = useQueryClient();
  const fetchGate = useServerFn(getOnboardingGateState);
  const fetchApp = useServerFn(loadMyWizardState);
  const [open, setOpen] = useState(true);
  const [finished, setFinished] = useState(false);

  const { data: gate } = useQuery({
    queryKey: ["onboarding-gate-state"],
    queryFn: () => fetchGate(),
    retry: false,
  });
  const needsSetup = gate?.progress === "compulsory_incomplete";
  // Finishing the last compulsory section flips the gate state; say so rather
  // than letting the panel silently disappear.
  const wasNeeded = useRef(false);
  useEffect(() => {
    if (needsSetup) wasNeeded.current = true;
    else if (wasNeeded.current && gate) setFinished(true);
  }, [needsSetup, gate]);
  const { data: wiz } = useQuery({
    queryKey: ["onboarding-wizard-state"],
    queryFn: () => fetchApp({ data: undefined as never }) as Promise<{ app: WizardApp | null }>,
    enabled: needsSetup,
    retry: false,
    staleTime: Infinity,
  });

  if (finished) {
    return (
      <div className="mb-6 rounded-2xl border border-secondary/40 bg-secondary/10 px-5 py-4 text-sm">
        <p className="font-semibold text-foreground">You're set up.</p>
        <p className="mt-0.5 text-muted-foreground">
          Everything compulsory is done. Anything optional you skipped is listed in your profile
          completion bar.
        </p>
      </div>
    );
  }
  if (!needsSetup) return null;

  const app = wiz?.app;
  const role = (app?.role ?? null) as OnboardingRole | null;
  const sections = role ? getSectionsForRole(role) : [];
  const outstanding = (gate?.outstanding ?? []) as { key: string; compulsory: boolean }[];
  const compulsoryLeft = outstanding.filter((s) => s.compulsory);
  const compulsoryTotal =
    (gate as { compulsoryTotal?: number } | undefined)?.compulsoryTotal ?? compulsoryLeft.length;
  const doneCount = Math.max(0, compulsoryTotal - compulsoryLeft.length);
  const pct = compulsoryTotal ? Math.round((doneCount / compulsoryTotal) * 100) : 0;
  const nextKey = (compulsoryLeft[0] ?? outstanding[0])?.key;
  const resumeAt = Math.max(
    0,
    sections.findIndex((s) => s.key === nextKey),
  );
  const roleInfo = role ? ROLE_DISPLAY[role] : null;
  // Creative Hub chooses its creative type before the sections start; that
  // step lives on the full-screen wizard.
  const needsCreativeType = role === "creative_hub" && !(app?.sections ?? {}).ctype;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-soft px-5 py-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Finish setting up your account
            {roleInfo && (
              <span className="text-xs font-normal text-muted-foreground">
                {roleInfo.icon} {roleInfo.label}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            This is your dashboard. Complete the compulsory sections to unlock matching, listings
            and the rest of IGE. Progress saves as you go.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-medium text-primary-deep">
              {pct}% of compulsory sections
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/onboarding/wizard"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Full screen
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            {open ? (
              <>
                Hide <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Continue setup <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
      {open && (
        <div className="px-5 py-6">
          {!app ? (
            <p className="text-sm text-muted-foreground">Loading your setup…</p>
          ) : needsCreativeType ? (
            <p className="text-sm">
              First, tell us what kind of creative work you do.{" "}
              <Link to="/onboarding/wizard" className="font-semibold text-primary underline">
                Start setup
              </Link>
            </p>
          ) : (
            <OnboardingWizard
              embedded
              role={app.role as OnboardingRole}
              savedSections={(app.sections as Record<string, never>) ?? {}}
              resumeAt={resumeAt}
              reviewerNotes={app.reviewer_notes ?? {}}
              onSaved={() => {
                void qc.invalidateQueries({ queryKey: ["onboarding-gate-state"] });
              }}
              onFinished={() => {
                setFinished(true);
                void qc.invalidateQueries();
              }}
            />
          )}
        </div>
      )}
    </section>
  );
}
