import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Globe2, Handshake, Megaphone, Newspaper, Users, Search, Download, Mail, Phone, Building2, MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KpiTile } from "@/components/dashboards/voom-primitives";
import { StatusPill } from "@/components/dashboards/shared";
import { DashboardPanel, DashboardTable, DashboardTableHead } from "@/components/dashboards/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  WAITLIST_AUDIENCES, type WaitlistAudience, waitlistAudienceLabel, isWaitlistAudience,
} from "@/lib/waitlist-audiences";
import { inviteWaitlistSignup } from "@/lib/waitlist.functions";

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
    "referral_source", "referred_by", "status", "notes", "form_data",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const raw = h === "form_data"
          ? JSON.stringify(r.form_data ?? {})
          : String((r as Record<string, unknown>)[h] ?? "");
        return `"${raw.replace(/"/g, '""')}"`;
      }).join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ige-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function WaitlistDetailSheet({
  signup,
  open,
  onOpenChange,
  onInvited,
}: {
  signup: WaitlistSignup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
}) {
  const invite = useServerFn(inviteWaitlistSignup);
  const inviteMut = useMutation({
    mutationFn: () => invite({ data: { id: signup!.id } }),
    onSuccess: () => {
      toast.success("Invite email sent");
      onInvited();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!signup) return null;
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

        <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
          <Button
            disabled={inviteMut.isPending || signup.status === "invited"}
            onClick={() => inviteMut.mutate()}
          >
            {signup.status === "invited" ? "Already invited" : inviteMut.isPending ? "Sending…" : "Send founding-member invite"}
          </Button>
          <Button variant="outline" asChild>
            <a href={`mailto:${signup.email}`}>Email directly</a>
          </Button>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company, country…"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!filtered.length}
          onClick={() => exportWaitlistCsv(filtered)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV ({filtered.length})
        </Button>
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
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading waitlist…</div>
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
        onInvited={() => {
          void refetch();
          if (selected) setSelected({ ...selected, status: "invited" });
        }}
      />
    </div>
  );
}
