import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck, Users, DollarSign, Loader2, ArrowRight, Award, Wallet, Inbox,
  AlertTriangle, Check, X, SlidersHorizontal, BarChart3, TrendingUp, UserCheck, FileText,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard, StatusPill } from "@/components/dashboards/shared";
import { DashboardHeader, DashboardTabs, DashboardPanel, DashboardTable, DashboardTableHead } from "@/components/dashboards/dashboard-shell";
import { DashboardPageSkeleton, DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { AdminAnalyticsPanel } from "@/components/dashboards/dashboard-analytics";
import { AdminOverviewPanel } from "@/components/dashboards/admin-overview";
import { AdminWaitlistPanel } from "@/components/dashboards/admin-waitlist-panel";
import { AdminMediaRequestsPanel } from "@/components/dashboards/admin-media-requests-panel";
import { AdminUsersPanel } from "@/components/dashboards/admin-users-panel";
import { AdminVettingPanel, VettingDrawer } from "@/components/dashboards/admin-vetting-panel";
import { DashboardDataToolbar } from "@/components/dashboards/dashboard-data-toolbar";
import { useTableFilters } from "@/hooks/use-table-filters";
import { datedCsvFilename, downloadCsv } from "@/lib/csv-export";
import { getAdminSectionMeta, greetingName } from "@/lib/dashboard-meta";
import { useAuth } from "@/lib/auth-context";
import { listEventsForVetting } from "@/lib/admin.functions";
import { listAccountComplaints, updateAccountComplaintStatus } from "@/lib/complaints.functions";
import { adminGetRevenue, adminListFraudFlags, adminResolveFraudFlag, adminUpsertCommissionConfig, adminCreateDeal, adminUpdateDealStatus, adminMarkCommissionPaid, adminUpdateRates, adminAssignDeal } from "@/lib/deals.functions";
import { generateDealPaymentLink } from "@/lib/payments.functions";
import { generateDealContract } from "@/lib/contracts.functions";
import { adminUpdateCustomPackageStatus } from "@/lib/custom-package.functions";
import { getCurrentRates } from "@/lib/marketplace.functions";
import { fmtMoney } from "@/lib/currency";
import { useDisplayCurrency } from "@/lib/display-currency-context";

const DEAL_STATUSES = [
  "inquiry_received",
  "qualification_call_scheduled",
  "proposal_sent",
  "negotiation",
  "contract_sent",
  "contract_signed",
  "payment_received",
  "deal_closed",
  "deal_lost",
  "cancelled",
];

export function AdminDashboard({ section = "overview" }: { section?: "overview" | "vetting" | "submissions" | "waitlist" | "revenue" | "controls" | "analytics" | "partners" | "media-requests" | "users" }) {
  const { fmtUsd, displayCurrency, labelSuffix } = useDisplayCurrency();
  const [drawerOpen, setDrawerOpen] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [contactStatus, setContactStatus] = useState("all");
  const [submissionView, setSubmissionView] = useState<"contact" | "complaints">("contact");
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintStatus, setComplaintStatus] = useState("all");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [fraudSearch, setFraudSearch] = useState("");
  const [fraudStatus, setFraudStatus] = useState("all");
  const [dealSearch, setDealSearch] = useState("");
  const [dealStatus, setDealStatus] = useState("all");
  const qc = useQueryClient();
  const { user } = useAuth();
  const meta = getAdminSectionMeta(section);
  const greeting = section === "overview" ? greetingName(user?.email, user?.user_metadata) : undefined;

  const fetchVetting = useServerFn(listEventsForVetting);
  const fetchRevenue = useServerFn(adminGetRevenue);
  const fetchFraud = useServerFn(adminListFraudFlags);
  const resolveFlag = useServerFn(adminResolveFraudFlag);
  const upsertConfig = useServerFn(adminUpsertCommissionConfig);
  const updateRates = useServerFn(adminUpdateRates);
  const fetchRates = useServerFn(getCurrentRates);
  const genPaymentLink = useServerFn(generateDealPaymentLink);
  const genContract = useServerFn(generateDealContract);

  const paymentLinkMut = useMutation({
    mutationFn: (deal_id: string) => genPaymentLink({ data: { deal_id } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      navigator.clipboard.writeText(res.url);
      toast.success("Payment link generated and copied");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const contractMut = useMutation({
    mutationFn: (deal_id: string) => genContract({ data: { deal_id } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      if (res.url) window.open(res.url, "_blank");
      toast.success("Contract generated — opens in new tab");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ratesQuery = useQuery({ queryKey: ["fx-rates"], queryFn: () => fetchRates() });

  const fraud = useQuery({ queryKey: ["admin", "fraud"], queryFn: () => fetchFraud() });

  const resolveMut = useMutation({
    mutationFn: (v: { id: string; status: "actioned" | "dismissed" }) => resolveFlag({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "fraud"] });
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      toast.success("Flag updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const configMut = useMutation({
    mutationFn: (v: any) => upsertConfig({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "revenue"] }); toast.success("Rates saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const ratesMut = useMutation({
    mutationFn: (v: { ngn_rate: number; gbp_rate: number; eur_rate: number }) => updateRates({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fx-rates"] }); toast.success("Exchange rates updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const createDeal = useServerFn(adminCreateDeal);
  const updateDeal = useServerFn(adminUpdateDealStatus);
  const markPaid = useServerFn(adminMarkCommissionPaid);
  const assignDeal = useServerFn(adminAssignDeal);
  const updateCustomPkg = useServerFn(adminUpdateCustomPackageStatus);

  const createDealMut = useMutation({
    mutationFn: (commitment_form_id: string) => createDeal({ data: { commitment_form_id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "revenue"] }); toast.success("Deal created from inquiry"); },
    onError: (e: any) => toast.error(e.message),
  });
  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: string; deal_value_native?: number }) => updateDeal({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "revenue"] }),
    onError: (e: any) => toast.error(e.message),
  });
  const paidMut = useMutation({
    mutationFn: (deal_id: string) => markPaid({ data: { deal_id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "revenue"] }); toast.success("Commission marked paid"); },
    onError: (e: any) => toast.error(e.message),
  });
  const assignMut = useMutation({
    mutationFn: (v: { deal_id: string; assigned_to: string | null }) => assignDeal({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "revenue"] }); toast.success("Deal assigned"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const customPkgMut = useMutation({
    mutationFn: (v: { id: string; status: "pending" | "reviewed" | "converted" | "declined" }) =>
      updateCustomPkg({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "revenue"] }); toast.success("Custom package updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: vettingData, isLoading: vettingLoading } = useQuery({
    queryKey: ["admin", "vetting"],
    queryFn: () => fetchVetting(),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => fetchRevenue(),
  });

  const waitlist = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist_signups")
        .select("id,created_at,audience,full_name,email,company,role_title,country,phone,notes,status")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const contact = useQuery({
    queryKey: ["admin-contact"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("id,created_at,name,email,company,subject,message,status")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const fetchComplaints = useServerFn(listAccountComplaints);
  const updateComplaint = useServerFn(updateAccountComplaintStatus);
  const complaints = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: () => fetchComplaints(),
  });

  const complaintStatusMut = useMutation({
    mutationFn: (v: { id: string; status: "new" | "read" | "resolved" }) => updateComplaint({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-complaints"] });
      toast.success("Complaint updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const vettingCount = vettingData?.events?.length ?? 0;
  const waitlistCount = waitlist.data?.length ?? 0;
  const adminGmvUsd = revenueData?.totals.gmv ?? 0;
  const recentVetting = (vettingData?.events ?? []).filter((e: any) => ["submitted", "under_review", "revision_requested"].includes(e.status));
  const pendingInquiries = revenueData?.inquiries?.length ?? 0;

  const filteredContact = useTableFilters({
    rows: contact.data ?? [],
    searchText: contactSearch,
    statusFilter: contactStatus,
    search: (r: { name: string; email: string; subject: string | null; message: string }) =>
      [r.name, r.email, r.subject, r.message].filter(Boolean).join(" "),
    matchStatus: (r: { status: string }, filter) => r.status === filter,
  });

  const complaintRows = complaints.data?.complaints ?? [];
  const filteredComplaints = useTableFilters({
    rows: complaintRows,
    searchText: complaintSearch,
    statusFilter: complaintStatus,
    search: (r: { display_name?: string | null; email: string; role: string; message: string }) =>
      [r.display_name, r.email, r.role, r.message].filter(Boolean).join(" "),
    matchStatus: (r: { status: string }, filter) => r.status === filter,
  });

  const filteredPartners = useTableFilters({
    rows: revenueData?.partners ?? [],
    searchText: partnerSearch,
    search: (p: { full_name?: string; commission_tier?: string }) =>
      [p.full_name, p.commission_tier].filter(Boolean).join(" "),
  });

  const filteredFraud = useTableFilters({
    rows: fraud.data?.flags ?? [],
    searchText: fraudSearch,
    statusFilter: fraudStatus,
    search: (f: { flag_type?: string; description?: string }) =>
      [f.flag_type, f.description].filter(Boolean).join(" "),
    matchStatus: (f: { status: string }, filter) => f.status === filter,
  });

  const filteredDeals = useTableFilters({
    rows: revenueData?.deals ?? [],
    searchText: dealSearch,
    statusFilter: dealStatus,
    search: (d: { event_id: string; status: string }) => {
      const ev = revenueData?.events?.[d.event_id];
      return [ev?.name, d.status].filter(Boolean).join(" ");
    },
    matchStatus: (d: { status: string }, filter) => d.status === filter,
  });

  const dealStatusCounts = useMemo(() => {
    const deals = revenueData?.deals ?? [];
    const counts: Record<string, number> = { all: deals.length };
    for (const d of deals) counts[d.status] = (counts[d.status] ?? 0) + 1;
    return counts;
  }, [revenueData?.deals]);

  return (
    <AppShell>
      <div className="space-y-6">
        <DashboardHeader
          title={meta.title}
          subtitle={meta.subtitle}
          breadcrumbs={meta.breadcrumbs}
          greeting={greeting}
        />

        {section === "overview" ? (
          <AdminOverviewPanel
            vettingCount={vettingCount}
            waitlistCount={waitlistCount}
            adminGmvUsd={adminGmvUsd}
            openDeals={revenueData?.totals.open ?? 0}
            fraudFlags={revenueData?.fraudFlagsOpen ?? 0}
            pendingInquiries={pendingInquiries}
            recentVetting={recentVetting}
            onVettingClick={setDrawerOpen}
            vettingLoading={vettingLoading}
            revenueLoading={revenueLoading}
          />
        ) : section === "vetting" ? (
          <AdminVettingPanel />
        ) : section === "waitlist" ? (
          <AdminWaitlistPanel />
        ) : section === "media-requests" ? (
          <AdminMediaRequestsPanel />
        ) : section === "users" ? (
          <AdminUsersPanel />
        ) : section === "submissions" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
              <StatCard icon={Inbox} label="Contact messages" value={contact.data?.length ?? 0} loading={contact.isLoading} />
              <StatCard icon={AlertTriangle} label="Account complaints" value={complaintRows.length} loading={complaints.isLoading} />
            </div>

            <DashboardTabs
              tabs={[
                { id: "contact", label: "Contact", count: contact.data?.length ?? 0 },
                { id: "complaints", label: "Complaints", count: complaintRows.length },
              ]}
              active={submissionView}
              onChange={(id) => setSubmissionView(id as "contact" | "complaints")}
            />

            {submissionView === "contact" ? (
              <>
                <DashboardTabs
                  tabs={[
                    { id: "all", label: "All", count: contact.data?.length ?? 0 },
                    { id: "new", label: "New", count: (contact.data ?? []).filter((r: { status: string }) => r.status === "new").length },
                    { id: "read", label: "Read", count: (contact.data ?? []).filter((r: { status: string }) => r.status === "read").length },
                  ]}
                  active={contactStatus}
                  onChange={setContactStatus}
                />

                {contact.isLoading ? (
                  <DashboardTableSkeleton rows={6} cols={5} />
                ) : !contact.data?.length ? (
                  <div className="p-8 text-center text-muted-foreground">No contact messages.</div>
                ) : (
                  <DashboardPanel title="Contact messages" bodyClassName="p-0">
                    <DashboardDataToolbar
                      search={contactSearch}
                      onSearchChange={setContactSearch}
                      searchPlaceholder="Search name, email, subject, message…"
                      onExport={() =>
                        downloadCsv(
                          datedCsvFilename("ige-contact"),
                          ["created_at", "name", "email", "company", "subject", "message", "status"],
                          filteredContact.map((r: { created_at: string; name: string; email: string; company: string | null; subject: string | null; message: string; status: string }) => [
                            r.created_at, r.name, r.email, r.company ?? "", r.subject ?? "", r.message, r.status,
                          ]),
                        )
                      }
                      exportDisabled={!filteredContact.length}
                      exportCount={filteredContact.length}
                    />
                    <DashboardTable>
                      <DashboardTableHead>
                        <tr>
                          <th className="px-4 py-3">When</th><th className="px-4 py-3">From</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Status</th>
                        </tr>
                      </DashboardTableHead>
                      <tbody className="divide-y divide-border/60">
                        {filteredContact.map((r: { id: string; created_at: string; name: string; email: string; subject: string | null; message: string; status: string }) => (
                          <tr key={r.id} className="transition-colors hover:bg-muted/10">
                            <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">{r.name}</div>
                              <a href={`mailto:${r.email}`} className="text-xs text-primary hover:underline">{r.email}</a>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{r.subject ?? "—"}</td>
                            <td className="px-4 py-3 max-w-md text-sm text-muted-foreground line-clamp-3">{r.message}</td>
                            <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                          </tr>
                        ))}
                        {!filteredContact.length && (
                          <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No messages match your filters.</td></tr>
                        )}
                      </tbody>
                    </DashboardTable>
                  </DashboardPanel>
                )}
              </>
            ) : (
              <>
                <DashboardTabs
                  tabs={[
                    { id: "all", label: "All", count: complaintRows.length },
                    { id: "new", label: "New", count: complaintRows.filter((r: { status: string }) => r.status === "new").length },
                    { id: "read", label: "Read", count: complaintRows.filter((r: { status: string }) => r.status === "read").length },
                    { id: "resolved", label: "Resolved", count: complaintRows.filter((r: { status: string }) => r.status === "resolved").length },
                  ]}
                  active={complaintStatus}
                  onChange={setComplaintStatus}
                />

                {complaints.isLoading ? (
                  <DashboardTableSkeleton rows={6} cols={6} />
                ) : !complaintRows.length ? (
                  <div className="p-8 text-center text-muted-foreground">No account complaints yet.</div>
                ) : (
                  <DashboardPanel title="Account complaints" bodyClassName="p-0">
                    <DashboardDataToolbar
                      search={complaintSearch}
                      onSearchChange={setComplaintSearch}
                      searchPlaceholder="Search name, email, role, message…"
                      onExport={() =>
                        downloadCsv(
                          datedCsvFilename("ige-complaints"),
                          ["created_at", "display_name", "email", "role", "message", "status"],
                          filteredComplaints.map((r: { created_at: string; display_name?: string | null; email: string; role: string; message: string; status: string }) => [
                            r.created_at, r.display_name ?? "", r.email, r.role, r.message, r.status,
                          ]),
                        )
                      }
                      exportDisabled={!filteredComplaints.length}
                      exportCount={filteredComplaints.length}
                    />
                    <DashboardTable>
                      <DashboardTableHead>
                        <tr>
                          <th className="px-4 py-3">When</th>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Message</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </DashboardTableHead>
                      <tbody className="divide-y divide-border/60">
                        {filteredComplaints.map((r: { id: string; created_at: string; display_name?: string | null; email: string; role: string; message: string; status: string }) => (
                          <tr key={r.id} className="transition-colors hover:bg-muted/10">
                            <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">{r.display_name ?? r.email.split("@")[0]}</div>
                              <a href={`mailto:${r.email}`} className="text-xs text-primary hover:underline">{r.email}</a>
                            </td>
                            <td className="px-4 py-3 text-sm capitalize text-muted-foreground">{r.role.replace(/_/g, " ")}</td>
                            <td className="px-4 py-3 max-w-md text-sm text-muted-foreground whitespace-pre-wrap">{r.message}</td>
                            <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                            <td className="px-4 py-3">
                              {r.status !== "resolved" ? (
                                <button
                                  type="button"
                                  onClick={() => complaintStatusMut.mutate({ id: r.id, status: r.status === "new" ? "read" : "resolved" })}
                                  disabled={complaintStatusMut.isPending}
                                  className="rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                                >
                                  Mark {r.status === "new" ? "read" : "resolved"}
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">closed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {!filteredComplaints.length && (
                          <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No complaints match your filters.</td></tr>
                        )}
                      </tbody>
                    </DashboardTable>
                  </DashboardPanel>
                )}
              </>
            )}
          </>
        ) : section === "analytics" ? (
          <AdminAnalyticsPanel />
        ) : section === "controls" ? (
          <div className="space-y-8">
            {/* Fraud flags */}
            <section>
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Fraud flags
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Self-referral and suspicious-attribution flags raised by the system.</p>
              <div className="mt-4">
                <DashboardTabs
                  tabs={[
                    { id: "all", label: "All", count: fraud.data?.flags?.length ?? 0 },
                    { id: "open", label: "Open", count: (fraud.data?.flags ?? []).filter((f: { status: string }) => f.status === "open").length },
                    { id: "actioned", label: "Actioned", count: (fraud.data?.flags ?? []).filter((f: { status: string }) => f.status === "actioned").length },
                    { id: "dismissed", label: "Dismissed", count: (fraud.data?.flags ?? []).filter((f: { status: string }) => f.status === "dismissed").length },
                  ]}
                  active={fraudStatus}
                  onChange={setFraudStatus}
                />
              </div>
              <DashboardPanel title="Flagged activity" bodyClassName="p-0" className="mt-4">
                <DashboardDataToolbar
                  search={fraudSearch}
                  onSearchChange={setFraudSearch}
                  searchPlaceholder="Search type or description…"
                  onExport={() =>
                    downloadCsv(
                      datedCsvFilename("ige-fraud-flags"),
                      ["type", "description", "status", "created_at"],
                      filteredFraud.map((f: { flag_type?: string; description?: string; status: string; created_at?: string }) => [
                        f.flag_type ?? "", f.description ?? "", f.status, f.created_at ?? "",
                      ]),
                    )
                  }
                  exportDisabled={!filteredFraud.length}
                  exportCount={filteredFraud.length}
                />
                {fraud.isLoading ? (
                  <DashboardTableSkeleton rows={5} cols={4} />
                ) : !(fraud.data?.flags ?? []).length ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No fraud flags. Clean slate.</div>
                ) : (
                  <DashboardTable>
                    <DashboardTableHead>
                      <tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr>
                    </DashboardTableHead>
                    <tbody className="divide-y divide-border/60">
                      {filteredFraud.map((f: { id: string; flag_type?: string; description?: string; status: string }) => (
                        <tr key={f.id} className="hover:bg-muted/10">
                          <td className="px-4 py-3 font-semibold text-foreground capitalize">{(f.flag_type || "").replace(/_/g, " ")}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[360px]">{f.description ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${f.status === "open" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>{f.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            {f.status === "open" ? (
                              <div className="flex gap-2">
                                <button type="button" onClick={() => resolveMut.mutate({ id: f.id, status: "actioned" })} disabled={resolveMut.isPending} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                                  <Check className="h-3 w-3" /> Action
                                </button>
                                <button type="button" onClick={() => resolveMut.mutate({ id: f.id, status: "dismissed" })} disabled={resolveMut.isPending} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50">
                                  <X className="h-3 w-3" /> Dismiss
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">reviewed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!filteredFraud.length && (
                        <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No flags match your filters.</td></tr>
                      )}
                    </tbody>
                  </DashboardTable>
                )}
              </DashboardPanel>
            </section>

            {/* Commission config */}
            <section>
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Commission rates
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Per event-type category. Standard/premium = referral partner share; platform = IGE take.</p>
              <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground">
                    <tr><th className="px-4 py-3">Category</th><th className="px-4 py-3">Standard %</th><th className="px-4 py-3">Premium %</th><th className="px-4 py-3">Platform %</th><th className="px-4 py-3"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(revenueData?.commissionConfig ?? []).map((c: any) => (
                      <CommissionRow key={c.event_type_category} config={c} onSave={(v) => configMut.mutate(v)} saving={configMut.isPending} />
                    ))}
                    {!(revenueData?.commissionConfig ?? []).length && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No commission config rows.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <FxRatesSection
              rates={ratesQuery.data?.rates}
              loading={ratesQuery.isLoading}
              saving={ratesMut.isPending}
              onSave={(v) => ratesMut.mutate(v)}
            />
          </div>
        ) : section === "partners" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard icon={UserCheck} label="Partners" value={revenueData?.partners?.length ?? 0} loading={revenueLoading} />
              <StatCard icon={Wallet} label={`Total owed${labelSuffix}`} value={fmtUsd(revenueData?.totals.refOwed ?? 0)} loading={revenueLoading} />
              <StatCard icon={TrendingUp} label="Open deals" value={revenueData?.totals.open ?? 0} loading={revenueLoading} />
            </div>
            {revenueLoading ? (
              <DashboardPageSkeleton kpis={3} tableRows={6} tableCols={8} />
            ) : (
              <DashboardPanel title="Referral partner management" description="Active links, conversion rates, and commissions owed per partner." bodyClassName="p-0">
                <DashboardDataToolbar
                  search={partnerSearch}
                  onSearchChange={setPartnerSearch}
                  searchPlaceholder="Search partner name or tier…"
                  onExport={() =>
                    downloadCsv(
                      datedCsvFilename("ige-referral-partners"),
                      ["partner", "tier", "deals_closed", "active_links", "clicks", "conversions", "owed_usd", "paid_usd"],
                      filteredPartners.map((p: { full_name?: string; commission_tier?: string; deals_closed?: number; active_links?: number; total_clicks?: number; conversions?: number; owed_usd?: number; paid_usd_running?: number }) => [
                        p.full_name ?? "", p.commission_tier ?? "", p.deals_closed ?? 0, p.active_links ?? 0,
                        p.total_clicks ?? 0, p.conversions ?? 0, p.owed_usd ?? 0, p.paid_usd_running ?? 0,
                      ]),
                    )
                  }
                  exportDisabled={!filteredPartners.length}
                  exportCount={filteredPartners.length}
                />
                <DashboardTable className="min-w-[800px]">
                  <DashboardTableHead>
                    <tr>
                      <th className="px-4 py-3">Partner</th><th className="px-4 py-3">Tier</th><th className="px-4 py-3">Deals closed</th>
                      <th className="px-4 py-3">Active links</th><th className="px-4 py-3">Clicks</th><th className="px-4 py-3">Conversions</th>
                      <th className="px-4 py-3">Owed ({displayCurrency})</th><th className="px-4 py-3">Paid ({displayCurrency})</th>
                    </tr>
                  </DashboardTableHead>
                  <tbody className="divide-y divide-border/60">
                    {filteredPartners.map((p: { user_id: string; full_name?: string; commission_tier?: string; deals_closed?: number; active_links?: number; total_clicks?: number; conversions?: number; owed_usd?: number; paid_usd_running?: number }) => (
                      <tr key={p.user_id} className="transition-colors hover:bg-muted/10">
                        <td className="px-4 py-3 font-semibold text-foreground">{p.full_name ?? "—"}</td>
                        <td className="px-4 py-3"><StatusPill status={p.commission_tier ?? "standard"} /></td>
                        <td className="px-4 py-3">{p.deals_closed ?? 0}</td>
                        <td className="px-4 py-3">{p.active_links ?? 0}</td>
                        <td className="px-4 py-3">{p.total_clicks ?? 0}</td>
                        <td className="px-4 py-3">{p.conversions ?? 0}</td>
                        <td className="px-4 py-3 font-mono text-xs text-amber-800">{fmtUsd(p.owed_usd ?? 0)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-emerald-800">{fmtUsd(p.paid_usd_running ?? 0)}</td>
                      </tr>
                    ))}
                    {!filteredPartners.length && (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No partners match your search.</td></tr>
                    )}
                  </tbody>
                </DashboardTable>
              </DashboardPanel>
            )}
          </>
        ) : section === "revenue" ? (
          revenueLoading ? (
            <DashboardPageSkeleton kpis={5} tableRows={8} tableCols={10} showTabs />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard icon={DollarSign} label={`Deal GMV (Total)${labelSuffix}`} value={fmtUsd(revenueData?.totals.gmv ?? 0)} />
                <StatCard icon={Award} label={`IGE Commission (Total)${labelSuffix}`} value={fmtUsd(revenueData?.totals.abw ?? 0)} />
                <StatCard icon={Wallet} label={`Partner Owed${labelSuffix}`} value={fmtUsd(revenueData?.totals.refOwed ?? 0)} />
                <StatCard icon={Inbox} label="Open Deals" value={revenueData?.totals.open ?? 0} />
                <StatCard icon={TrendingUp} label={`Pipeline forecast${labelSuffix}`} value={fmtUsd(revenueData?.totals.forecast ?? 0)} />
              </div>

            {/* Pending inquiries → convert to deal */}
            {(revenueData?.inquiries ?? []).length > 0 && (
              <div className="rounded-xl border border-amber-300/60 bg-amber-50/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-200/60 flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-amber-700" />
                  <h3 className="font-display font-semibold text-base text-foreground">Pending inquiries ({(revenueData?.inquiries ?? []).length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-amber-100/40 text-left text-xs uppercase tracking-wide border-b border-amber-200/60 text-amber-800">
                      <tr>
                        <th className="px-4 py-3">Event</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Budget</th><th className="px-4 py-3">Referral</th><th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-200/40">
                      {(revenueData?.inquiries ?? []).map((f: any) => {
                        const ev = revenueData!.events[f.event_id];
                        return (
                          <tr key={f.id} className="hover:bg-amber-100/20">
                            <td className="px-4 py-3 font-semibold text-foreground">{ev?.name ?? "—"}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">{f.company_name}</div>
                              <div className="text-xs text-muted-foreground">{f.contact_name}</div>
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold">
                              {f.budget_range_min || f.budget_range_max
                                ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}`
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {f.referral_partner_id ? <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary-deep">Attributed</span> : <span className="text-xs text-muted-foreground">Direct</span>}
                              {Array.isArray(f.fraud_flags) && f.fraud_flags.length > 0 && (
                                <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive"><AlertTriangle className="h-2.5 w-2.5" /> flag</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => createDealMut.mutate(f.id)}
                                disabled={createDealMut.isPending}
                                className="inline-flex items-center gap-1 rounded-md bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                <ArrowRight className="h-3 w-3" /> Create deal
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Custom package requests */}
            {(revenueData?.customPackages ?? []).length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-muted/20 px-5 py-4 border-b border-border">
                  <h3 className="font-display font-semibold text-base text-foreground">Custom package requests</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Bespoke sponsorship briefs — separate from standard commitment forms.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Event</th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Budget</th>
                        <th className="px-4 py-3">Brief</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(revenueData?.customPackages ?? []).filter((r: any) => r.status === "pending" || r.status === "reviewed").map((r: any) => {
                        const ev = revenueData!.events[r.event_id];
                        return (
                          <tr key={r.id} className="hover:bg-muted/10 align-top">
                            <td className="px-4 py-3 font-medium">{ev?.name ?? "—"}</td>
                            <td className="px-4 py-3">
                              <div>{r.company_name}</div>
                              <div className="text-xs text-muted-foreground">{r.contact_name}</div>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {r.budget_range_min || r.budget_range_max
                                ? `${fmtMoney(r.currency, Number(r.budget_range_min ?? 0))} – ${fmtMoney(r.currency, Number(r.budget_range_max ?? 0))}`
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs line-clamp-3">{r.package_brief}</td>
                            <td className="px-4 py-3">
                              <select
                                value={r.status}
                                onChange={(e) => customPkgMut.mutate({ id: r.id, status: e.target.value as any })}
                                className="rounded border border-border bg-transparent px-2 py-1 text-xs capitalize"
                              >
                                {["pending", "reviewed", "converted", "declined"].map((s) => (
                                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Deal pipeline — editable */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="bg-muted/20 px-5 py-4 border-b border-border">
                <h3 className="font-display font-semibold text-base text-foreground">Deal pipeline</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Set the deal value, advance the stage; commission auto-calculates at “payment received.”</p>
              </div>
              <DashboardTabs
                tabs={[
                  { id: "all", label: "All", count: dealStatusCounts.all },
                  ...DEAL_STATUSES.filter((s) => dealStatusCounts[s]).map((s) => ({
                    id: s,
                    label: s.replace(/_/g, " "),
                    count: dealStatusCounts[s],
                  })),
                ]}
                active={dealStatus}
                onChange={setDealStatus}
              />
              <DashboardDataToolbar
                search={dealSearch}
                onSearchChange={setDealSearch}
                searchPlaceholder="Search event or deal stage…"
                onExport={() =>
                  downloadCsv(
                    datedCsvFilename("ige-deals"),
                    ["event", "status", "value_native", "currency", "value_usd", "ige_commission", "partner_commission", "assigned_to"],
                    filteredDeals.map((d: { event_id: string; status: string; deal_value_native?: number; deal_currency?: string; deal_value_usd?: number; abw_commission_usd?: number; referral_commission_usd?: number; assigned_to?: string | null }) => {
                      const ev = revenueData?.events?.[d.event_id];
                      return [
                        ev?.name ?? "", d.status, d.deal_value_native ?? "", d.deal_currency ?? "",
                        d.deal_value_usd ?? "", d.abw_commission_usd ?? "", d.referral_commission_usd ?? "", d.assigned_to ?? "",
                      ];
                    }),
                  )
                }
                exportDisabled={!filteredDeals.length}
                exportCount={filteredDeals.length}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[920px]">
                  <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Event</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">{displayCurrency}</th><th className="px-4 py-3">IGE</th><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Contract</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDeals.map((d: any) => {
                      const ev = revenueData!.events[d.event_id];
                      return (
                        <tr key={d.id} className="hover:bg-muted/10 transition-colors align-top">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{ev?.name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">{[ev?.city, ev?.country].filter(Boolean).join(", ")}</div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              defaultValue={d.deal_value_native ?? ""}
                              onBlur={(e) => {
                                const v = Number(e.target.value);
                                if (v && v !== Number(d.deal_value_native)) statusMut.mutate({ id: d.id, status: d.status, deal_value_native: v });
                              }}
                              className="w-28 rounded border border-border bg-transparent px-2 py-1 text-xs"
                            />
                            <div className="mt-0.5 text-[10px] text-muted-foreground">{d.deal_currency}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{d.deal_value_usd ? fmtUsd(Number(d.deal_value_usd)) : "—"}</td>
                          <td className="px-4 py-3 font-mono text-xs">{d.abw_commission_usd ? fmtUsd(Number(d.abw_commission_usd)) : "—"}</td>
                          <td className="px-4 py-3">
                            {d.referral_partner_id ? (
                              <div>
                                <div className="font-mono text-xs">{d.referral_commission_usd ? fmtUsd(Number(d.referral_commission_usd)) : "—"}</div>
                                <div className="text-[10px] text-muted-foreground">{d.referral_commission_paid ? "Paid" : "Owed"}</div>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={d.assigned_to ?? ""}
                              onChange={(e) =>
                                assignMut.mutate({
                                  deal_id: d.id,
                                  assigned_to: e.target.value || null,
                                })
                              }
                              className="max-w-[140px] rounded border border-border bg-transparent px-2 py-1 text-xs"
                            >
                              <option value="">Unassigned</option>
                              {(revenueData?.staff ?? []).map((s: any) => (
                                <option key={s.user_id} value={s.user_id}>
                                  {s.display_name || s.email?.split("@")[0] || s.user_id.slice(0, 8)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={d.status}
                              onChange={(e) => statusMut.mutate({ id: d.id, status: e.target.value })}
                              className="rounded border border-border bg-transparent px-2 py-1 text-xs capitalize"
                            >
                              {DEAL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            {d.contract_url ? (
                              <div className="space-y-1">
                                <a href={d.contract_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                                  <FileText className="h-3 w-3" /> View
                                </a>
                                <button
                                  type="button"
                                  onClick={() => contractMut.mutate(d.id)}
                                  disabled={contractMut.isPending}
                                  className="block text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  Regenerate
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => contractMut.mutate(d.id)}
                                disabled={contractMut.isPending}
                                className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40"
                              >
                                <FileText className="h-3 w-3" /> Generate
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {d.status === "payment_received" ? (
                              <span className="text-xs font-semibold text-emerald-700">Paid</span>
                            ) : d.payment_link_url ? (
                              <div className="space-y-1">
                                <a href={d.payment_link_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">
                                  Open link
                                </a>
                                <button
                                  type="button"
                                  onClick={() => { navigator.clipboard.writeText(d.payment_link_url); toast.success("Copied"); }}
                                  className="block text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  Copy
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => paymentLinkMut.mutate(d.id)}
                                disabled={paymentLinkMut.isPending || !d.deal_value_native}
                                className="rounded border border-primary/40 px-2 py-1 text-xs font-semibold text-primary hover:bg-brand-soft disabled:opacity-40"
                              >
                                Generate link
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {d.referral_partner_id && d.status === "payment_received" && !d.referral_commission_paid ? (
                              <button onClick={() => paidMut.mutate(d.id)} disabled={paidMut.isPending} className="rounded bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:opacity-90 disabled:opacity-50">Mark paid</button>
                            ) : d.referral_commission_paid ? (
                              <span className="inline-flex rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Paid</span>
                            ) : <span className="text-xs text-muted-foreground italic">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {!(revenueData?.deals ?? []).length ? (
                      <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">No deals yet. Convert a pending inquiry above to start the pipeline.</td></tr>
                    ) : !filteredDeals.length ? (
                      <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">No deals match your filters.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
        ) : null}

        {drawerOpen && <VettingDrawer id={drawerOpen} onClose={() => setDrawerOpen(null)} />}
      </div>
    </AppShell>
  );
}

function CommissionRow({ config, onSave, saving }: { config: any; onSave: (v: any) => void; saving: boolean }) {
  const [std, setStd] = useState(String((Number(config.standard_rate) * 100).toFixed(1)));
  const [prem, setPrem] = useState(String((Number(config.premium_rate) * 100).toFixed(1)));
  const [plat, setPlat] = useState(String((Number(config.abw_platform_rate) * 100).toFixed(1)));

  const dirty =
    Number(std) !== Number((config.standard_rate * 100).toFixed(1)) ||
    Number(prem) !== Number((config.premium_rate * 100).toFixed(1)) ||
    Number(plat) !== Number((config.abw_platform_rate * 100).toFixed(1));

  const cell =
    "w-20 rounded border border-border bg-transparent px-2 py-1 text-xs";

  return (
    <tr className="hover:bg-muted/10">
      <td className="px-4 py-3 font-medium text-foreground">{config.event_type_category}</td>
      <td className="px-4 py-3"><input type="number" step="0.1" min={0} max={100} value={std} onChange={(e) => setStd(e.target.value)} className={cell} /></td>
      <td className="px-4 py-3"><input type="number" step="0.1" min={0} max={100} value={prem} onChange={(e) => setPrem(e.target.value)} className={cell} /></td>
      <td className="px-4 py-3"><input type="number" step="0.1" min={0} max={100} value={plat} onChange={(e) => setPlat(e.target.value)} className={cell} /></td>
      <td className="px-4 py-3">
        <button
          disabled={!dirty || saving}
          onClick={() => onSave({
            event_type_category: config.event_type_category,
            standard_rate: Number(std) / 100,
            premium_rate: Number(prem) / 100,
            abw_platform_rate: Number(plat) / 100,
          })}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40 hover:bg-primary/90"
        >
          Save
        </button>
      </td>
    </tr>
  );
}

function FxRatesSection({
  rates,
  loading,
  saving,
  onSave,
}: {
  rates?: { ngn_rate: number; gbp_rate: number; eur_rate: number; fetched_at?: string } | null;
  loading: boolean;
  saving: boolean;
  onSave: (v: { ngn_rate: number; gbp_rate: number; eur_rate: number }) => void;
}) {
  const [form, setForm] = useState({
    ngn_rate: rates?.ngn_rate != null ? String(rates.ngn_rate) : "",
    gbp_rate: rates?.gbp_rate != null ? String(rates.gbp_rate) : "",
    eur_rate: rates?.eur_rate != null ? String(rates.eur_rate) : "",
  });

  useEffect(() => {
    if (rates) {
      setForm({
        ngn_rate: String(rates.ngn_rate),
        gbp_rate: String(rates.gbp_rate),
        eur_rate: String(rates.eur_rate),
      });
    }
  }, [rates?.ngn_rate, rates?.gbp_rate, rates?.eur_rate]);

  const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <section>
      <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" /> FX rates (USD base)
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Manual refresh for dual-currency display. Last updated:{" "}
        {loading ? "…" : rates?.fetched_at ? new Date(rates.fetched_at).toLocaleString() : "never"}
      </p>
      <form
        className="mt-4 grid max-w-xl gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ngn_rate: Number(form.ngn_rate),
            gbp_rate: Number(form.gbp_rate),
            eur_rate: Number(form.eur_rate),
          });
        }}
      >
        {[
          { key: "ngn_rate" as const, label: "1 USD → NGN" },
          { key: "gbp_rate" as const, label: "1 USD → GBP" },
          { key: "eur_rate" as const, label: "1 USD → EUR" },
        ].map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="mb-1 block font-medium">{f.label}</span>
            <input
              type="number"
              step="any"
              min={0}
              required
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className={inputCls}
            />
          </label>
        ))}
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={saving || loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Publish new rates"}
          </button>
        </div>
      </form>
    </section>
  );
}
