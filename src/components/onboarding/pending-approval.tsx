/**
 * Pending Approval screen (PRD §3.2.6)
 * 3-node status tracker: Submitted → Under review → Approved
 * Read-only summary card of key submitted fields.
 * NO admin controls visible to the applicant on this screen.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { getMyOnboardingApplication } from "@/lib/onboarding.functions";
import { ROLE_DISPLAY, getSectionsForRole, type OnboardingStatus } from "@/lib/onboarding-constants";

// ─── Status tracker ───────────────────────────────────────────────────────────

const NODES: Array<{
  key: OnboardingStatus | "placeholder";
  label: string;
  desc: string;
  icon: React.ElementType;
}> = [
  { key: "submitted",     label: "Submitted",    desc: "Application received",         icon: CheckCircle2 },
  { key: "under_review",  label: "Under review", desc: "IGE team is reviewing",        icon: Clock },
  { key: "approved",      label: "Approved",     desc: "Dashboard access granted",     icon: Sparkles },
];

function getNodeState(nodeKey: string, appStatus: OnboardingStatus): "done" | "active" | "pending" {
  const order: OnboardingStatus[] = ["submitted", "under_review", "approved"];
  const nodeIdx = order.indexOf(nodeKey as OnboardingStatus);
  const currIdx = order.indexOf(appStatus);
  if (appStatus === "rejected") {
    return nodeIdx === 0 ? "done" : "pending";
  }
  if (nodeIdx < currIdx) return "done";
  if (nodeIdx === currIdx) return "active";
  return "pending";
}

function StatusTracker({ status }: { status: OnboardingStatus }) {
  return (
    <div className="relative flex items-start justify-between gap-0">
      {NODES.map((node, i) => {
        const state = getNodeState(node.key, status);
        const Icon = node.icon;
        const isLast = i === NODES.length - 1;

        return (
          <div key={node.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* Left connector */}
              {i > 0 && (
                <div className={`h-0.5 flex-1 transition-colors ${state === "done" ? "bg-secondary" : "bg-border"}`} />
              )}
              {/* Node */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  state === "done"
                    ? "border-secondary bg-secondary text-white"
                    : state === "active"
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              {/* Right connector */}
              {!isLast && (
                <div className={`h-0.5 flex-1 transition-colors ${state === "done" ? "bg-secondary" : "bg-border"}`} />
              )}
            </div>
            <p className={`mt-2 text-center text-[11px] font-semibold ${state === "active" ? "text-primary" : state === "done" ? "text-secondary" : "text-muted-foreground"}`}>
              {node.label}
            </p>
            <p className="text-center text-[10px] text-muted-foreground">{node.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Field summary ────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value?: string | string[] | null }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div className="flex gap-3 border-b border-border py-2.5 last:border-0">
      <p className="w-40 shrink-0 text-xs text-muted-foreground">{label}</p>
      <p className="flex-1 text-sm font-medium text-foreground">{display}</p>
    </div>
  );
}

function ApplicationSummary({ role, sections }: { role: string; sections: Record<string, Record<string, unknown>> }) {
  const roleDisplay = ROLE_DISPLAY[role as keyof typeof ROLE_DISPLAY];
  const sectionA = sections["a"] ?? {};

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border px-5 py-4">
        <p className="text-sm font-bold text-foreground">Application summary</p>
        <p className="text-xs text-muted-foreground">Read-only snapshot of your submitted profile.</p>
      </div>
      <div className="px-5 py-3">
        <SummaryRow label="Role" value={`${roleDisplay?.icon ?? ""} ${roleDisplay?.label ?? role}`} />
        <SummaryRow label="Name" value={(sectionA.full_name ?? sectionA.brand_name ?? sectionA.outlet_name) as string} />
        <SummaryRow label="Organisation" value={(sectionA.org_name ?? sectionA.company_name) as string} />
        <SummaryRow label="Email" value={sectionA.email as string} />
        <SummaryRow label="Country" value={(sectionA.country ?? sectionA.hq_country) as string} />
        {/* Role-specific key fields */}
        {role === "organiser" && sections["b"] && (
          <>
            <SummaryRow label="Event name" value={sections["b"].event_name as string} />
            <SummaryRow label="Event type" value={sections["b"].event_type as string} />
          </>
        )}
        {role === "sponsor" && sections["b"] && (
          <SummaryRow label="Event types of interest" value={sections["b"].event_types_interested as string[]} />
        )}
        {role === "referral_partner" && sections["b"] && (
          <SummaryRow label="Sectors of expertise" value={sections["b"].sectors_of_expertise as string[]} />
        )}
        {role === "media_partner" && sections["b"] && (
          <SummaryRow label="Media type" value={sections["b"].media_types as string[]} />
        )}
        {sections["f"] && (
          <SummaryRow label="Primary goal" value={sections["f"].primary_goal as string} />
        )}
        {sections["e"] && (
          <SummaryRow label="Primary goal" value={sections["e"].primary_goal as string} />
        )}
      </div>
    </div>
  );
}

// ─── Rejected state ───────────────────────────────────────────────────────────

function RejectedCard() {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
      <h3 className="font-display text-xl font-bold text-foreground">Application not approved</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Unfortunately your application could not be approved at this time. You should have received
        an email with further details. Please reach out if you have questions.
      </p>
      <a
        href="mailto:hi@insideglobalevents.com"
        className="mt-4 inline-flex rounded-lg bg-destructive px-5 py-2.5 text-sm font-semibold text-white hover:bg-destructive/90"
      >
        Contact support
      </a>
    </div>
  );
}

// ─── Changes requested state ──────────────────────────────────────────────────

function ChangesRequestedCard({ reviewerNotes }: { reviewerNotes: Record<string, string> }) {
  const hasSectionNotes = Object.keys(reviewerNotes).length > 0;
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <h3 className="font-semibold text-amber-900">Revisions requested</h3>
          <p className="mt-1 text-sm text-amber-800">
            An IGE reviewer has requested changes to your application. Please sign in to your
            wizard and update the flagged sections before resubmitting.
          </p>
          {hasSectionNotes && (
            <div className="mt-3 space-y-2">
              {Object.entries(reviewerNotes).map(([key, note]) => (
                <div key={key} className="rounded-lg border border-amber-200 bg-white px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Section {key.toUpperCase()}</p>
                  <p className="mt-0.5 text-sm text-amber-900">{note}</p>
                </div>
              ))}
            </div>
          )}
          <Link
            to={"/onboarding/wizard" as never}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Go back to wizard
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PendingApprovalScreen() {
  const getFn = useServerFn(getMyOnboardingApplication);

  type AppResult = {
    application: {
      id: string; role: string; status: string; submitted_at?: string | null;
      sections: Record<string, Record<string, unknown>>;
      reviewer_notes: Record<string, string>;
    } | null;
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-onboarding-application"],
    queryFn: () => getFn({ data: undefined as never }) as Promise<AppResult>,
    refetchInterval: 30_000,
  });

  const app = data?.application as {
    id: string; role: string; status: string; submitted_at?: string | null;
    sections: Record<string, Record<string, unknown>>;
    reviewer_notes: Record<string, string>;
  } | null | undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <BrandLogo size="sm" />
          <Link to="/signup" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-12 sm:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !app ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold text-foreground">Your account is under review</p>
            <p className="mt-1 text-sm text-muted-foreground">
              An IGE admin will email you when your dashboard is approved. If you still need to
              finish onboarding, continue the wizard.
            </p>
            <Link
              to="/onboarding/role"
              className="mt-4 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Continue onboarding
            </Link>
          </div>
        ) : app.status === "rejected" ? (
          <RejectedCard />
        ) : app.status === "approved" ? (
          <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-secondary" />
            <h3 className="font-display text-2xl font-bold text-foreground">You're approved!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your IGE application has been approved. Access your dashboard now.
            </p>
            <Link
              to="/dashboard"
              className="mt-5 inline-flex rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-soft hover:-translate-y-0.5"
            >
              Open my dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold text-foreground">Application submitted</h1>
              <p className="mt-2 text-base text-muted-foreground">
                The IGE team will review your application within 1–3 business days.
                You'll receive an email when there's an update.
              </p>
            </div>

            {/* Status tracker */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <StatusTracker status={app.status as OnboardingStatus} />
            </div>

            {/* Changes requested */}
            {app.status === "changes_requested" && (
              <ChangesRequestedCard reviewerNotes={(app.reviewer_notes as Record<string, string>) ?? {}} />
            )}

            {/* Read-only summary */}
            <ApplicationSummary
              role={app.role}
              sections={(app.sections as Record<string, Record<string, unknown>>) ?? {}}
            />

            {/* Submission details */}
            <div className="rounded-xl border border-border bg-muted/20 px-5 py-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium text-foreground">
                  {app.submitted_at ? new Date(app.submitted_at as string).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs text-foreground">{(app.id as string).slice(0, 8).toUpperCase()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh status
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
