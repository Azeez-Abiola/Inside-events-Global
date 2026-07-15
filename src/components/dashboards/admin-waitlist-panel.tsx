import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Globe2, Handshake, Megaphone, Newspaper, Users, Mail, Phone, Building2, MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KpiTile } from "@/components/dashboards/voom-primitives";
import { StatusPill } from "@/components/dashboards/shared";
import { DashboardPanel, DashboardTable, DashboardTableHead } from "@/components/dashboards/dashboard-shell";
import { DashboardDataToolbar } from "@/components/dashboards/dashboard-data-toolbar";
import { DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { datedCsvFilename, downloadCsv } from "@/lib/csv-export";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  WAITLIST_AUDIENCES, type WaitlistAudience, waitlistAudienceLabel, isWaitlistAudience,
} from "@/lib/waitlist-audiences";
import { reviewWaitlistSignup } from "@/lib/waitlist.functions";

export type WaitlistSignup = {
  id: string;
  created_at: string;
  audience: string;
  full_name: string;
  email: string;
  company: string | null;
  role_title: string | null;
  country: string | null;
  phone: string | null;
  notes: string | null;
  referral_source: string | null;
  referred_by: string | null;
  consent_given: boolean;
  status: string;
  rejection_reason: string | null;
  form_data: Record<string, string | string[]> | null;
};

const AUDIENCE_ICONS: Record<WaitlistAudience, typeof Megaphone> = {
  organiser: Megaphone,
  sponsor: Globe2,
  referral_partner: Handshake,
  media_partner: Newspaper,
};

type AudienceFilter = "all" | WaitlistAudience;

function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFormValue(value: string | string[] | undefined) {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value) || "—";
}

function exportWaitlistCsv(rows: WaitlistSignup[]) {
  const headers = [
    "created_at", "audience", "full_name", "email", "phone", "company", "role_title", "country",
    "referral_source", "referred_by", "status", "notes", "rejection_reason", "form_data",
  ];
  downloadCsv(
    datedCsvFilename("ige-waitlist"),
    headers,
    rows.map((r) =>
      headers.map((h) =>
        h === "form_data" ? JSON.stringify(r.form_data ?? {}) : (r as Record<string, unknown>)[h] ?? "",
      ),
    ),
  );
}

function isWaitlistApproved(status: string) {
  return ["approved", "invited", "converted"].includes(status);
}

function isWaitlistRejected(status: string) {
  return ["rejected", "declined"].includes(status);
}

function WaitlistDetailSheet({
  signup,
  open,
  onOpenChange,
  onReviewed,
}: {
  signup: WaitlistSignup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewed: (patch: Pick<WaitlistSignup, "status" | "rejection_reason">) => void;
}) {
  const review = useServerFn(reviewWaitlistSignup);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    setRejectNote("");
  }, [signup?.id]);

  const reviewMut = useMutation({
    mutationFn: (action: "approve" | "reject") =>
      review({
        data: {
          id: signup!.id,
          action,
          note: action === "reject" ? rejectNote.trim() : undefined,
        },
      }),
    onSuccess: (res) => {
      if (res.status === "approved") {
        toast.success("Approved — invite email sent");
        onReviewed({ status: "approved", rejection_reason: null });
      } else {
        toast.success("Rejected — applicant notified by email");
        onReviewed({ status: "rejected", rejection_reason: rejectNote.trim() });
      }
      setRejectNote("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!signup) return null;
  const approved = isWaitlistApproved(signup.status);
  const rejected = isWaitlistRejected(signup.status);
  const canReview = !approved && !rejected;
  const formEntries = Object.entries(signup.form_data ?? {}).filter(
    ([, v]) => v != null && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== ""),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{signup.full_name}</SheetTitle>
          <SheetDescription>
            {waitlistAudienceLabel(signup.audience as WaitlistAudience)} ·{" "}
            {new Date(signup.created_at).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <StatusPill status={signup.audience} />
            <StatusPill status={signup.status} />
            {signup.consent_given && (
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                Consent given
              </span>
            )}
          </div>

          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h4>
            <dl className="space-y-2 text-sm">
              {[
                { icon: Mail, label: "Email", value: signup.email, href: `mailto:${signup.email}` },
                { icon: Phone, label: "Phone", value: signup.phone },
                { icon: Building2, label: "Company", value: signup.company },
                { icon: Users, label: "Job title", value: signup.role_title },
                { icon: MapPin, label: "Country", value: signup.country },
              ].map((row) => (
                <div key={row.label} className="flex gap-3">
                  <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-xs text-muted-foreground">{row.label}</dt>
                    <dd className="font-medium text-foreground">
                      {row.href && row.value ? (
                        <a href={row.href} className="text-primary hover:underline">{row.value}</a>
                      ) : (
                        row.value ?? "—"
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          {(signup.referral_source || signup.referred_by) && (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referral</h4>
              <p className="text-sm text-foreground">
                {signup.referral_source ?? "—"}
                {signup.referred_by ? ` · Referred by ${signup.referred_by}` : ""}
              </p>
            </section>
          )}

          {signup.notes && (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h4>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{signup.notes}</p>
            </section>
          )}

          {signup.rejection_reason && (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rejection note</h4>
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900 whitespace-pre-wrap">
                {signup.rejection_reason}
              </p>
            </section>
          )}

          {formEntries.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role-specific intake ({formEntries.length} fields)
              </h4>
              <dl className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20">
                {formEntries.map(([key, value]) => (
                    <div key={key} className="px-4 py-3">
                      <dt className="text-xs font-medium text-muted-foreground">{humanizeKey(key)}</dt>
                      <dd className="mt-1 text-sm text-foreground">{formatFormValue(value)}</dd>
                    </div>
                  ))}
              </dl>
            </section>
          )}
        </div>

        <div className="mt-8 space-y-4 border-t border-border pt-6">
          {canReview && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rejection note (required to reject)
              </span>
              <Textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Explain why this application was not approved — the applicant will receive this by email."
              />
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!canReview || reviewMut.isPending}
              onClick={() => reviewMut.mutate("approve")}
            >
              {reviewMut.isPending ? "Saving…" : approved ? "Approved" : "Approve"}
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              disabled={!canReview || reviewMut.isPending || !rejectNote.trim()}
              onClick={() => reviewMut.mutate("reject")}
            >
              {rejected ? "Rejected" : reviewMut.isPending ? "Saving…" : "Reject"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AdminWaitlistPanel() {
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WaitlistSignup | null>(null);

  const { data: signups = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-waitlist-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist_signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        form_data: (row.form_data as Record<string, string | string[]> | null) ?? null,
      })) as WaitlistSignup[];
    },
  });

  const counts = useMemo(() => {
    const base: Record<AudienceFilter, number> = {
      all: signups.length,
      organiser: 0,
      sponsor: 0,
      referral_partner: 0,
      media_partner: 0,
    };
    for (const s of signups) {
      if (isWaitlistAudience(s.audience)) base[s.audience]++;
    }
    return base;
  }, [signups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return signups.filter((s) => {
      if (audienceFilter !== "all" && s.audience !== audienceFilter) return false;
      if (!q) return true;
      return (
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.company ?? "").toLowerCase().includes(q) ||
        (s.country ?? "").toLowerCase().includes(q)
      );
    });
  }, [signups, audienceFilter, search]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setAudienceFilter("all")}
          className={`text-left transition-opacity ${audienceFilter === "all" ? "ring-2 ring-primary ring-offset-2 rounded-2xl" : "opacity-80 hover:opacity-100"}`}
        >
          <KpiTile icon={Users} label="All signups" value={counts.all} loading={isLoading} />
        </button>
        {WAITLIST_AUDIENCES.map((a) => {
          const Icon = AUDIENCE_ICONS[a.id];
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAudienceFilter(a.id)}
              className={`text-left transition-opacity ${audienceFilter === a.id ? "ring-2 ring-primary ring-offset-2 rounded-2xl" : "opacity-80 hover:opacity-100"}`}
            >
              <KpiTile icon={Icon} label={a.shortLabel} value={counts[a.id]} loading={isLoading} />
            </button>
          );
        })}
      </div>

      <DashboardPanel
        title={
          audienceFilter === "all"
            ? "All waitlist signups"
            : `${waitlistAudienceLabel(audienceFilter)} signups`
        }
        description="Click a row to view full intake details and role-specific answers."
        bodyClassName="p-0"
      >
        <DashboardDataToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, email, company, country…"
          onExport={() => exportWaitlistCsv(filtered)}
          exportDisabled={!filtered.length}
          exportCount={filtered.length}
        />
        {isLoading ? (
          <DashboardTableSkeleton rows={8} cols={8} />
        ) : !filtered.length ? (
          <div className="p-8 text-center text-muted-foreground">
            {signups.length ? "No signups match your filters." : "No waitlist signups yet."}
          </div>
        ) : (
          <DashboardTable>
            <DashboardTableHead>
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer transition-colors hover:bg-muted/20"
                  onClick={() => setSelected(r)}
                >
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.audience} />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{r.full_name}</td>
                  <td className="px-4 py-3 text-sm text-primary">{r.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.company ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </DashboardTable>
        )}
      </DashboardPanel>

      <WaitlistDetailSheet
        signup={selected}
        open={!!selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        onReviewed={(patch) => {
          void refetch();
          if (selected) setSelected({ ...selected, ...patch });
        }}
      />
    </div>
  );
}
