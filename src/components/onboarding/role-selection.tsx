/**
 * Role Selection screen (PRD §3.2.3, §3.4)
 * Grid of 7 role cards — single-select — with exact copy from §3.4.
 * 4 current live roles + 3 deferred stubs (greyed out with "Coming soon").
 */
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { ChevronRight, Loader2, LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/lib/auth-context";
import { ensureSignupRole } from "@/lib/signup.functions";
import { saveOnboardingSection } from "@/lib/onboarding.functions";
import { isSignupRole, type SignupRole } from "@/lib/signup-roles";
import type { OnboardingRole } from "@/lib/onboarding-constants";

// ─── Role definitions (§3.4 verbatim copy) ───────────────────────────────────

const ROLES: Array<{
  id: OnboardingRole;
  icon: string;
  label: string;
  desc: string;
  features: string[];
  live: boolean;
  adminNote?: string;
}> = [
  {
    id: "organiser",
    icon: "🎪",
    label: "Event Organiser",
    desc: "Manage your event portfolio, attract sponsors, track deals, and run deliverables across multiple events a year.",
    features: ["Event Pipeline", "Sponsor Matching", "CRM", "Analytics"],
    live: true,
  },
  {
    id: "sponsor",
    icon: "🏢",
    label: "Brand / Sponsor",
    desc: "Plan your annual sponsorship budget, discover vetted events, track activations, and measure ROI.",
    features: ["Budget Planner", "Event Discovery", "ROI Analytics", "Commitments"],
    live: true,
  },
  {
    id: "referral_partner",
    icon: "🤝",
    label: "Referral Partner",
    desc: "Refer event organisers and sponsors to IGE, track your referrals, and earn commission on every closed deal.",
    features: ["Referral Tracker", "Commission", "Link Generator"],
    live: true,
  },
  {
    id: "media_partner",
    icon: "📡",
    label: "Media Partner",
    desc: "Request media accreditation, access press materials, and build long-term partnerships with event organisers.",
    features: ["Media Requests", "Press Kits", "Coverage Tracker"],
    live: true,
  },
  {
    id: "ige_admin",
    icon: "⚡",
    label: "IGE Admin",
    desc: "Platform oversight — vetting, revenue, users, match quality, fraud controls, and market intelligence.",
    features: ["Vetting Queue", "Revenue", "Match Engine", "Audit Log"],
    live: false,
    adminNote: "Admin access is invite-only — selecting it routes you to a short access-request form instead of full onboarding.",
  },
  {
    id: "partnerships_pro",
    icon: "🌍",
    label: "Partnerships Pro",
    desc: "ABW affiliate professionals managing multiple clients — track pipeline, outreach, and commissions across all brands.",
    features: ["Multi-Client CRM", "Pipeline", "Commission"],
    live: false,
  },
  {
    id: "creative_hub",
    icon: "🎬",
    label: "Creative Hub",
    desc: "Connect your creative project with brand sponsors and partners — IGE matches your content, reach, and audience with brands actively budgeting for creative sponsorship.",
    features: ["Product Placement", "Content Pipeline", "CRM", "Analytics"],
    live: false,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function RoleSelectionScreen() {
  const { user, roles, loading } = useAuth();
  const primaryRole = roles.find((r): r is SignupRole => isSignupRole(r));
  const [selected, setSelected] = useState<OnboardingRole | null>(primaryRole ?? null);
  const navigate = useNavigate();
  const saveFn = useServerFn(saveOnboardingSection);
  const ensureRole = useServerFn(ensureSignupRole);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/signup", replace: true });
    }
  }, [user, loading, navigate]);

  const selectRole = useMutation({
    mutationFn: async (role: OnboardingRole) => {
      if (role !== "organiser" && role !== "sponsor" && role !== "referral_partner" && role !== "media_partner") {
        throw new Error("That role is not open for public onboarding yet.");
      }
      await ensureRole({ data: { role } });
      await saveFn({
        data: {
          role,
          sectionKey: "__role",
          sectionData: { role },
          currentSection: 0,
        },
      });
    },
    onSuccess: () => {
      navigate({ to: "/onboarding/wizard" });
    },
  });

  const liveRoles = ROLES.filter((r) => r.live);
  const deferredRoles = ROLES.filter((r) => !r.live);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <BrandLogo size="sm" />
          <span className="font-mono text-xs text-muted-foreground">Step 3 of 8 — Role selection</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            What best describes you?
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Choose one role — this determines your onboarding wizard and dashboard.
          </p>
        </div>

        {/* Live roles */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {liveRoles.map((role) => {
            const isSelected = selected === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                className={`group relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/30 hover:shadow-soft"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{role.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{role.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{role.desc}</p>
                  </div>
                  {isSelected && (
                    <span className="shrink-0 text-primary">✓</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.features.map((f) => (
                    <span key={f} className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Deferred roles — coming soon */}
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Also coming to IGE
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {deferredRoles.map((role) => (
              <div
                key={role.id}
                className="relative flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/10 p-4 opacity-60"
              >
                <span className="text-2xl grayscale">{role.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{role.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{role.desc}</p>
                  {role.adminNote && (
                    <p className="mt-1 text-[10px] text-amber-700">{role.adminNote}</p>
                  )}
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <LockKeyhole className="h-3 w-3" /> Coming soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            disabled={!selected || selectRole.isPending}
            onClick={() => selected && selectRole.mutate(selected)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-8 py-3.5 text-sm font-bold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {selectRole.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Setting up…</>
            ) : (
              <>Continue <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
        {!selected && (
          <p className="mt-3 text-center text-xs text-muted-foreground">Select a role above to continue.</p>
        )}
      </main>
    </div>
  );
}
