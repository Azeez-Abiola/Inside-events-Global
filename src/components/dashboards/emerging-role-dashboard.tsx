import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Clock, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DashboardHeader, DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { DashboardPageSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { InfoTip } from "@/components/info-tip";
import { getMyOnboardingApplication } from "@/lib/onboarding.functions";
import {
  getSectionsForRole,
  outstandingSections,
  ROLE_DISPLAY,
  type OnboardingRole,
  type SectionProgress,
} from "@/lib/onboarding-constants";

/**
 * Landing dashboard for Partnerships Pro and Creative Hub.
 *
 * Both roles went live in v6.2 with full onboarding schemas, but their working
 * surfaces — the Pro CRM and the Creative Hub productions and placement board —
 * are Version 1.1 Section C (TAB 14). Until then these accounts still need
 * somewhere real to land: the no-role fallback tells them their account has no
 * role, which is both wrong and alarming.
 *
 * So this shows what they have actually completed, what is outstanding, and
 * what is coming. It is deliberately honest about the latter rather than
 * mocking up a CRM that does not exist yet.
 */

interface Upcoming {
  title: string;
  body: string;
}

const COMING_SOON: Record<"partnerships_pro" | "creative_hub", Upcoming[]> = {
  partnerships_pro: [
    {
      title: "Contacts and CRM",
      body: "Your contacts, outreach log and pipeline, with the stages you set during onboarding.",
    },
    {
      title: "Commission tracker",
      body: "Every introduction you make, what it is worth, and what has been paid.",
    },
    {
      title: "Weekly Activity Report",
      body: "Downloadable as Excel, formatted for whoever you told us you report to.",
    },
  ],
  creative_hub: [
    {
      title: "Productions",
      body: "List a film, series, show or project and the placement opportunities inside it.",
    },
    {
      title: "Brand placement",
      body: "Brands browsing for creative sponsorship see your work and IGE makes the introduction.",
    },
    {
      title: "Coverage and analytics",
      body: "Reach, engagement and delivery against what you committed to.",
    },
  ],
};

export function EmergingRoleDashboard({ role }: { role: "partnerships_pro" | "creative_hub" }) {
  const fetchApplication = useServerFn(getMyOnboardingApplication);
  const { data, isLoading } = useQuery({
    queryKey: ["my-onboarding-application", role],
    queryFn: () => fetchApplication(),
  });

  if (isLoading) {
    return (
      <AppShell>
        <DashboardPageSkeleton kpis={3} />
      </AppShell>
    );
  }

  const application = data?.application as
    | { section_status?: Record<string, SectionProgress>; verification_status?: string }
    | null
    | undefined;
  const sectionStatus = application?.section_status ?? {};
  const sections = getSectionsForRole(role as OnboardingRole);
  // `compulsory` is undefined until the section config resolves; the dashboard
  // only needs completion state, so default it rather than fetching the config.
  const outstanding = outstandingSections(
    sections.map((sec) => ({ ...sec, compulsory: sec.compulsory ?? true })),
    sectionStatus,
  );
  const display = ROLE_DISPLAY[role as OnboardingRole];

  return (
    <AppShell>
      <div className="space-y-6">
        <DashboardHeader
          title={display?.label ?? "Your workspace"}
          subtitle="Your profile is live with IGE. Here is where it stands, and what lands next."
        />

        <DashboardPanel
          title="Profile completion"
          description="What is left, and what each remaining item unlocks."
        >
          <ul className="divide-y divide-border/60">
            {sections.map((section) => {
              const status = sectionStatus[section.key] ?? "not_started";
              const done = status === "complete";
              return (
                <li key={section.key} className="flex items-center gap-3 px-5 py-3">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span
                    className={`flex-1 text-sm ${done ? "text-muted-foreground" : "font-medium text-foreground"}`}
                  >
                    {section.title}
                  </span>
                  {status === "skipped" && (
                    <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Skipped
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {outstanding.length > 0 && (
            <div className="border-t border-border/60 bg-muted/20 px-5 py-4">
              <p className="flex items-center text-sm text-muted-foreground">
                {outstanding.length} section{outstanding.length === 1 ? "" : "s"} still to finish.
                <InfoTip tip="dash.profile_completion" />
              </p>
              <Link to="/onboarding/wizard" className="btn-primary mt-3 inline-block">
                Finish my profile
              </Link>
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Coming to your dashboard"
          description="Being built now, in the order listed."
        >
          <ul className="divide-y divide-border/60">
            {COMING_SOON[role].map((item) => (
              <li key={item.title} className="flex gap-3 px-5 py-4">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="block text-sm font-medium text-foreground">{item.title}</span>
                  <span className="block text-sm text-muted-foreground">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </DashboardPanel>

        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-brand-soft px-5 py-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-primary-deep">
            In the meantime, IGE is matching your profile against live opportunities. Approved
            matches arrive here and by email — there is nothing you need to watch.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
