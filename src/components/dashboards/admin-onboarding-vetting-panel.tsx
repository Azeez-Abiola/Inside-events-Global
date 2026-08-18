/**
 * Admin Onboarding Vetting Queue (PRD §3.2.7, §3.7)
 * Lists all submitted/under_review applications filterable by role.
 * Opening an application shows every section + field in full.
 * Actions: Approve / Reject (with decline note) / Request changes (with per-section notes).
 * All actions are logged to the Audit Log.
 */
"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, RefreshCw, Clock, Eye, ChevronRight,
  AlertCircle, Loader2, Filter, User, CalendarDays,
} from "lucide-react";
import {
  listOnboardingApplications,
  getOnboardingApplicationDetail,
  reviewOnboardingApplication,
  markApplicationUnderReview,
} from "@/lib/onboarding.functions";
import { ROLE_DISPLAY, getSectionsForRole, type OnboardingStatus } from "@/lib/onboarding-constants";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<OnboardingStatus, string> = {
  draft:              "bg-muted text-muted-foreground",
  submitted:          "bg-primary/10 text-primary-deep",
  under_review:       "bg-amber-100 text-amber-800",
  approved:           "bg-secondary/10 text-secondary-dark",
  rejected:           "bg-destructive/10 text-destructive",
  changes_requested:  "bg-orange-100 text-orange-800",
};

const STATUS_LABELS: Record<OnboardingStatus, string> = {
  draft:              "Draft",
  submitted:          "Submitted",
  under_review:       "Under review",
  approved:           "Approved",
  rejected:           "Rejected",
  changes_requested:  "Changes requested",
};

function StatusBadge({ status }: { status: OnboardingStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Section viewer ───────────────────────────────────────────────────────────

function SectionFieldDisplay({ data }: { data: Record<string, unknown> }) {
  const fields = Object.entries(data).filter(([k]) => !k.startsWith("__"));
  if (!fields.length) return <p className="text-sm text-muted-foreground italic">No data</p>;

  return (
    <div className="space-y-2">
      {fields.map(([key, val]) => {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const display = Array.isArray(val) ? val.join(", ") : typeof val === "boolean" ? (val ? "Yes" : "No") : String(val ?? "—");
        return (
          <div key={key} className="grid grid-cols-[180px_1fr] gap-2 border-b border-border py-2 last:border-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-sm text-foreground break-words">{display || "—"}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Application detail panel ─────────────────────────────────────────────────

interface DetailPanelProps {
  userId: string;
  onClose: () => void;
  onReviewed: () => void;
}

function ApplicationDetailPanel({ userId, onClose, onReviewed }: DetailPanelProps) {
  const getFn = useServerFn(getOnboardingApplicationDetail);
  const reviewFn = useServerFn(reviewOnboardingApplication);
  const markFn = useServerFn(markApplicationUnderReview);
  const queryClient = useQueryClient();

  const [action, setAction] = useState<"approve" | "reject" | "request_changes" | null>(null);
  const [sectionNotes, setSectionNotes] = useState<Record<string, string>>({});
  const [rejectionNote, setRejectionNote] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  type DetailResult = {
    application: { id: string; user_id: string; role: string; status: string; sections: Record<string, Record<string, unknown>>; reviewer_notes: Record<string, string>; reviewed_at: string | null; submitted_at: string | null } | null;
    profile: { id: string; email: string | null; display_name: string | null; phone: string | null; created_at: string } | null;
  };

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-detail", userId],
    queryFn: () => getFn({ data: { user_id: userId } }) as Promise<DetailResult>,
  });

  const app = data?.application;
  const profile = data?.profile;
  const sections = (app?.sections as Record<string, Record<string, unknown>>) ?? {};
  const sectionDefs = app ? getSectionsForRole(app.role as Parameters<typeof getSectionsForRole>[0]) : [];
  const existingNotes = (app?.reviewer_notes as Record<string, string>) ?? {};
  const role = app?.role ? ROLE_DISPLAY[app.role as keyof typeof ROLE_DISPLAY] : null;

  const markUnderReview = useMutation({
    mutationFn: () => markFn({ data: { user_id: userId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-detail", userId] }),
  });

  const review = useMutation({
    mutationFn: (vars: { action: "approve" | "reject" | "request_changes" }) =>
      reviewFn({
        data: {
          user_id:        userId,
          action:         vars.action,
          notes:          vars.action === "request_changes" ? sectionNotes : undefined,
          rejection_note: vars.action === "reject" ? rejectionNote : undefined,
        },
      }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.action === "approve"         ? "Application approved ✓" :
        vars.action === "reject"          ? "Application rejected" :
        "Changes requested — applicant notified",
      );
      queryClient.invalidateQueries({ queryKey: ["onboarding-applications"] });
      onReviewed();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!app || !profile) {
    return <p className="p-6 text-sm text-muted-foreground">Application not found.</p>;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl">
            {role?.icon ?? "👤"}
          </div>
          <div>
            <p className="font-semibold text-foreground">{profile.display_name ?? profile.email}</p>
            <p className="text-xs text-muted-foreground">{profile.email} · {role?.label ?? app.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={app.status as OnboardingStatus} />
          <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">
            Close
          </button>
        </div>
      </div>

      {/* Tabs — section navigation */}
      <div className="overflow-x-auto border-b border-border bg-muted/20 px-4">
        <div className="flex gap-0">
          {sectionDefs.map((sec) => {
            const hasNote = !!existingNotes[sec.key];
            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => setActiveSection(sec.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
                  activeSection === sec.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {sec.key.toUpperCase()}. {sec.title}
                {hasNote && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {!activeSection ? (
          <div className="space-y-4">
            {/* Applicant metadata */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                  <User className="h-3.5 w-3.5" /> Account info
                </div>
                <p className="text-sm font-medium">{profile.display_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <p className="text-xs text-muted-foreground">{profile.phone ?? "No phone"}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                  <CalendarDays className="h-3.5 w-3.5" /> Timeline
                </div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-sm font-medium">{app.submitted_at ? new Date(app.submitted_at as string).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
                {app.reviewed_at && (
                  <>
                    <p className="mt-1 text-xs text-muted-foreground">Last reviewed</p>
                    <p className="text-sm font-medium">{new Date(app.reviewed_at as string).toLocaleDateString("en-GB")}</p>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs text-primary-deep">
                Click a section tab above to review the applicant's submitted data. When ready, use
                the action buttons at the bottom to approve, reject, or request changes.
              </p>
            </div>

            {/* Quick summary of all sections */}
            <div className="space-y-2">
              {sectionDefs.map((sec) => {
                const sData = sections[sec.key];
                const filled = sData ? Object.values(sData).filter(Boolean).length : 0;
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setActiveSection(sec.key)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-muted/30"
                  >
                    <span className="text-sm font-medium text-foreground">
                      Section {sec.key.toUpperCase()} — {sec.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{filled} field{filled !== 1 ? "s" : ""}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back to overview
            </button>

            {(() => {
              const sec = sectionDefs.find((s) => s.key === activeSection)!;
              const sData = sections[activeSection] ?? {};
              return (
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">Section {activeSection.toUpperCase()} — {sec.title}</h3>
                  {existingNotes[activeSection] && (
                    <div className="mb-3 flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <p className="text-xs text-amber-800">Previous note: {existingNotes[activeSection]}</p>
                    </div>
                  )}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <SectionFieldDisplay data={sData} />
                  </div>

                  {action === "request_changes" && (
                    <div className="mt-4">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-foreground">
                          Reviewer note for Section {activeSection.toUpperCase()} (optional)
                        </span>
                        <textarea
                          rows={3}
                          value={sectionNotes[activeSection] ?? ""}
                          onChange={(e) => setSectionNotes((prev) => ({ ...prev, [activeSection]: e.target.value }))}
                          placeholder={`What needs to be changed in ${sec.title}?`}
                          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Action bar */}
      {!["approved", "rejected"].includes(app.status as string) && (
        <div className="border-t border-border bg-card px-6 py-4">
          {/* Mark under review */}
          {app.status === "submitted" && (
            <button
              type="button"
              onClick={() => markUnderReview.mutate()}
              disabled={markUnderReview.isPending}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              {markUnderReview.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
              Mark as under review
            </button>
          )}

          {/* Action selector */}
          {action === null ? (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction("approve")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2.5 text-sm font-semibold text-secondary-dark hover:bg-secondary/20"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setAction("request_changes")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
              >
                <RefreshCw className="h-4 w-4" /> Request changes
              </button>
              <button
                type="button"
                onClick={() => setAction("reject")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
          ) : action === "approve" ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-secondary/30 bg-secondary/5 px-4 py-3">
                <p className="text-sm font-semibold text-secondary-dark">Approving this application</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  The applicant will be notified by email and their dashboard will unlock immediately.
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAction(null)} className="flex-1 rounded-lg border border-border py-2 text-sm text-muted-foreground hover:bg-muted">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ action: "approve" })}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-white hover:bg-secondary/90 disabled:opacity-60"
                >
                  {review.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Confirm approve
                </button>
              </div>
            </div>
          ) : action === "reject" ? (
            <div className="space-y-3">
              <div>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-foreground">
                    Reason for rejection <span className="text-destructive">*</span>
                  </span>
                  <textarea
                    rows={3}
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Explain why the application is being rejected — this will be sent to the applicant."
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAction(null)} className="flex-1 rounded-lg border border-border py-2 text-sm text-muted-foreground hover:bg-muted">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={review.isPending || !rejectionNote.trim()}
                  onClick={() => review.mutate({ action: "reject" })}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-white hover:bg-destructive/90 disabled:opacity-60"
                >
                  {review.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Confirm reject
                </button>
              </div>
            </div>
          ) : (
            /* request_changes */
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-900">Request changes</p>
                <p className="mt-0.5 text-xs text-amber-800">
                  Navigate to each section tab above and leave a note. The applicant will see all
                  section notes when they return to the wizard.
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  {Object.keys(sectionNotes).filter((k) => sectionNotes[k]).length} section{Object.keys(sectionNotes).filter((k) => sectionNotes[k]).length !== 1 ? "s" : ""} have notes.
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAction(null)} className="flex-1 rounded-lg border border-border py-2 text-sm text-muted-foreground hover:bg-muted">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ action: "request_changes" })}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-60"
                >
                  {review.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Send for changes
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main vetting panel ───────────────────────────────────────────────────────

const ROLE_FILTER_OPTIONS = [
  { value: "all",              label: "All roles" },
  { value: "organiser",        label: "🎪 Organiser" },
  { value: "sponsor",          label: "🏢 Sponsor" },
  { value: "referral_partner", label: "🤝 Referral" },
  { value: "media_partner",    label: "📡 Media" },
];

const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all",              label: "All statuses" },
  { value: "submitted",        label: "Submitted" },
  { value: "under_review",     label: "Under review" },
  { value: "changes_requested",label: "Changes requested" },
  { value: "approved",         label: "Approved" },
  { value: "rejected",         label: "Rejected" },
];

export function AdminOnboardingVettingPanel() {
  const getFn = useServerFn(listOnboardingApplications);
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("submitted");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  type OAApp = {
    id: string; user_id: string; role: string; status: string;
    submitted_at: string | null; reviewed_at: string | null;
    sections: Record<string, unknown>; reviewer_notes: Record<string, string>;
    profile: { email: string | null; display_name: string | null };
  };
  type ListResult = { applications: OAApp[] };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["onboarding-applications", statusFilter, roleFilter],
    queryFn: () =>
      getFn({
        data: {
          status: statusFilter as "all" | "submitted" | "under_review" | "approved" | "rejected" | "changes_requested",
          role:   roleFilter !== "all" ? roleFilter : undefined,
          limit:  100,
          offset: 0,
        },
      }) as Promise<ListResult>,
    refetchInterval: 60_000,
  });

  const apps = data?.applications ?? [];

  // Counts for quick stats
  const counts = useMemo(() => {
    const all = apps;
    return {
      submitted:   all.filter((a) => a.status === "submitted").length,
      under_review: all.filter((a) => a.status === "under_review").length,
      changes:     all.filter((a) => a.status === "changes_requested").length,
    };
  }, [apps]);

  if (selectedUserId) {
    return (
      <div className="h-full overflow-hidden rounded-xl border border-border bg-background">
        <ApplicationDetailPanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onReviewed={() => {
            setSelectedUserId(null);
            refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Awaiting review", count: counts.submitted,   color: "text-primary" },
          { label: "Under review",    count: counts.under_review, color: "text-amber-700" },
          { label: "Changes needed",  count: counts.changes,      color: "text-orange-700" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {ROLE_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => refetch()}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Application list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">No applications match this filter</p>
          <p className="mt-1 text-sm text-muted-foreground">Adjust the filters or check back later.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Applicant</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {apps.map((app) => {
                const roleInfo = ROLE_DISPLAY[app.role as keyof typeof ROLE_DISPLAY];
                return (
                  <tr key={app.id as string} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {app.profile.display_name ?? app.profile.email ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">{app.profile.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        {roleInfo?.icon ?? "?"} {roleInfo?.label ?? app.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status as OnboardingStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {app.submitted_at
                        ? new Date(app.submitted_at as string).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(app.user_id as string)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5" /> Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
