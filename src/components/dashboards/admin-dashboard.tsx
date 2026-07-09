import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck, Users, DollarSign, Loader2, ArrowRight, CheckCircle2, Pencil, XCircle, Award, Wallet, Inbox,
  AlertTriangle, Check, X, SlidersHorizontal, BarChart3, TrendingUp, UserCheck,
} from "lucide-react";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { StatCard, StatusPill } from "@/components/dashboards/shared";
import { DashboardHeader, DashboardTabs, DashboardPanel, DashboardTable, DashboardTableHead } from "@/components/dashboards/dashboard-shell";
import { AdminAnalyticsPanel } from "@/components/dashboards/dashboard-analytics";
import { AdminOverviewPanel } from "@/components/dashboards/admin-overview";
import { getAdminSectionMeta, greetingName } from "@/lib/dashboard-meta";
import { useAuth } from "@/lib/auth-context";
import { listEventsForVetting, setEventVettingStatus, getEventForAdmin } from "@/lib/admin.functions";
import { adminGetRevenue, adminListFraudFlags, adminResolveFraudFlag, adminUpsertCommissionConfig, adminCreateDeal, adminUpdateDealStatus, adminMarkCommissionPaid } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";

const DEAL_STATUSES = [
  "inquiry_received", "vetting", "intro_made", "in_negotiation",
  "verbal_commitment", "contract_sent", "contract_signed",
  "payment_received", "closed_lost", "cancelled",
];

export function AdminDashboard({ section = "overview" }: { section?: "overview" | "vetting" | "submissions" | "revenue" | "controls" | "analytics" | "partners" }) {
  const [activeSubTab, setActiveSubTab] = useState<"waitlist" | "contact">("waitlist");
  const [drawerOpen, setDrawerOpen] = useState<string | null>(null);
  const qc = useQueryClient();
  const { user } = useAuth();
  const meta = getAdminSectionMeta(section);
  const greeting = section === "overview" ? greetingName(user?.email, user?.user_metadata) : undefined;

  const fetchVetting = useServerFn(listEventsForVetting);
  const fetchRevenue = useServerFn(adminGetRevenue);
  const fetchFraud = useServerFn(adminListFraudFlags);
  const resolveFlag = useServerFn(adminResolveFraudFlag);
  const upsertConfig = useServerFn(adminUpsertCommissionConfig);

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

  const createDeal = useServerFn(adminCreateDeal);
  const updateDeal = useServerFn(adminUpdateDealStatus);
  const markPaid = useServerFn(adminMarkCommissionPaid);

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

  const groupedVetting: Record<string, any[]> = {
    submitted: [], under_review: [], revision_requested: [], approved: [], rejected: [],
  };
  (vettingData?.events ?? []).forEach((e: any) => {
    if (groupedVetting[e.status]) groupedVetting[e.status].push(e);
  });

  const vettingCount = vettingData?.events?.length ?? 0;
  const waitlistCount = waitlist.data?.length ?? 0;
  const adminGmv = `$${(revenueData?.totals.gmv ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const recentVetting = (vettingData?.events ?? []).filter((e: any) => ["submitted", "under_review", "revision_requested"].includes(e.status));
  const pendingInquiries = revenueData?.inquiries?.length ?? 0;

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
            adminGmv={adminGmv}
            openDeals={revenueData?.totals.open ?? 0}
            fraudFlags={revenueData?.fraudFlagsOpen ?? 0}
            pendingInquiries={pendingInquiries}
            recentVetting={recentVetting}
            onVettingClick={setDrawerOpen}
            vettingLoading={vettingLoading}
            revenueLoading={revenueLoading}
          />
        ) : section === "vetting" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard icon={ShieldCheck} label="In queue" value={vettingCount} loading={vettingLoading} />
              <StatCard icon={Users} label="New submissions" value={groupedVetting.submitted?.length ?? 0} loading={vettingLoading} />
              <StatCard icon={Pencil} label="Under review" value={groupedVetting.under_review?.length ?? 0} loading={vettingLoading} />
            </div>
            {vettingLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
              {[
                { key: "submitted", label: "New submissions" },
                { key: "under_review", label: "Under review" },
                { key: "revision_requested", label: "Revision requested" },
                { key: "approved", label: "Approved" },
                { key: "rejected", label: "Rejected" },
              ].map((c) => (
                <div key={c.key} className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
                  <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>{c.label}</span>
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-bold text-primary-deep">{groupedVetting[c.key]?.length ?? 0}</span>
                  </div>
                  <div className="space-y-2">
                    {(groupedVetting[c.key] ?? []).map((e: any) => (
                      <button type="button" key={e.id} onClick={() => setDrawerOpen(e.id)} className="block w-full rounded-xl border border-border/60 bg-muted/20 p-3 text-left text-sm transition-all hover:border-primary/30 hover:bg-card hover:shadow-soft cursor-pointer">
                        <div className="font-semibold text-foreground truncate">{e.name || "Untitled"}</div>
                        <div className="mt-1 text-xs text-muted-foreground truncate">{[e.event_type, e.city, e.country].filter(Boolean).join(" · ") || "-"}</div>
                        <div className="mt-1.5 truncate border-t border-border/50 pt-1 text-[10px] font-mono text-muted-foreground/80">{e.organiser_email}</div>
                      </button>
                    ))}
                    {groupedVetting[c.key]?.length === 0 && (
                      <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground italic">Empty</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </>
        ) : section === "analytics" ? (
          <AdminAnalyticsPanel />
        ) : section === "submissions" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard icon={Users} label="Waitlist signups" value={waitlistCount} loading={waitlist.isLoading} />
              <StatCard icon={Inbox} label="Contact messages" value={contact.data?.length ?? 0} loading={contact.isLoading} />
            </div>

            <DashboardTabs
              tabs={[
                { id: "waitlist", label: "Waitlist", count: waitlistCount },
                { id: "contact", label: "Contact messages", count: contact.data?.length ?? 0 },
              ]}
              active={activeSubTab}
              onChange={(id) => setActiveSubTab(id as "waitlist" | "contact")}
            />

            {activeSubTab === "waitlist" ? (
              waitlist.isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading…</div>
              ) : !waitlist.data?.length ? (
                <div className="p-8 text-center text-muted-foreground">No waitlist signups.</div>
              ) : (
                <DashboardPanel title="Waitlist signups" bodyClassName="p-0">
                  <DashboardTable>
                    <DashboardTableHead>
                      <tr>
                        <th className="px-4 py-3">When</th><th className="px-4 py-3">Audience</th><th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Country</th>
                      </tr>
                    </DashboardTableHead>
                    <tbody className="divide-y divide-border/60">
                      {waitlist.data.map((r: any) => (
                        <tr key={r.id} className="transition-colors hover:bg-muted/10">
                          <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3"><StatusPill status={r.audience} /></td>
                          <td className="px-4 py-3 font-medium text-foreground">{r.full_name}</td>
                          <td className="px-4 py-3"><a href={`mailto:${r.email}`} className="font-medium text-primary hover:underline">{r.email}</a></td>
                          <td className="px-4 py-3 text-muted-foreground">{r.company ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.role_title ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.country ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </DashboardTable>
                </DashboardPanel>
              )
            ) : contact.isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading…</div>
            ) : !contact.data?.length ? (
              <div className="p-8 text-center text-muted-foreground">No contact messages.</div>
            ) : (
              <DashboardPanel title="Contact messages" bodyClassName="p-0">
                <DashboardTable>
                  <DashboardTableHead>
                    <tr>
                      <th className="px-4 py-3">When</th><th className="px-4 py-3">From</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Status</th>
                    </tr>
                  </DashboardTableHead>
                  <tbody className="divide-y divide-border/60">
                    {contact.data.map((r: any) => (
                      <tr key={r.id} className="transition-colors hover:bg-muted/10">
                        <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-semibold text-foreground">{r.name}</div>
                          <a href={`mailto:${r.email}`} className="text-xs text-primary hover:underline">{r.email}</a>
                          {r.company && <div className="text-[11px] text-muted-foreground">{r.company}</div>}
                        </td>
                        <td className="max-w-[150px] truncate px-4 py-3 font-medium text-foreground" title={r.subject}>{r.subject}</td>
                        <td className="max-w-[400px] px-4 py-3 text-xs whitespace-pre-wrap text-muted-foreground">{r.message}</td>
                        <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </DashboardTable>
              </DashboardPanel>
            )}
          </>
        ) : section === "controls" ? (
          <div className="space-y-8">
            {/* Fraud flags */}
            <section>
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Fraud flags
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Self-referral and suspicious-attribution flags raised by the system.</p>
              <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
                {fraud.isLoading ? (
                  <div className="p-8 text-center text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Loading…</div>
                ) : !(fraud.data?.flags ?? []).length ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No fraud flags. Clean slate.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground">
                      <tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(fraud.data?.flags ?? []).map((f: any) => (
                        <tr key={f.id} className="hover:bg-muted/10">
                          <td className="px-4 py-3 font-semibold text-foreground capitalize">{(f.flag_type || "").replace(/_/g, " ")}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[360px]">{f.description ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${f.status === "open" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>{f.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            {f.status === "open" ? (
                              <div className="flex gap-2">
                                <button onClick={() => resolveMut.mutate({ id: f.id, status: "actioned" })} disabled={resolveMut.isPending} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                                  <Check className="h-3 w-3" /> Action
                                </button>
                                <button onClick={() => resolveMut.mutate({ id: f.id, status: "dismissed" })} disabled={resolveMut.isPending} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50">
                                  <X className="h-3 w-3" /> Dismiss
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">reviewed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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
          </div>
        ) : section === "partners" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard icon={UserCheck} label="Partners" value={revenueData?.partners?.length ?? 0} loading={revenueLoading} />
              <StatCard icon={Wallet} label="Total owed" value={`$${Number(revenueData?.totals.refOwed ?? 0).toLocaleString()}`} loading={revenueLoading} />
              <StatCard icon={TrendingUp} label="Open deals" value={revenueData?.totals.open ?? 0} loading={revenueLoading} />
            </div>
            {revenueLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <DashboardPanel title="Referral partner management" description="Active links, conversion rates, and commissions owed per partner." bodyClassName="p-0">
                <DashboardTable className="min-w-[800px]">
                  <DashboardTableHead>
                    <tr>
                      <th className="px-4 py-3">Partner</th><th className="px-4 py-3">Tier</th><th className="px-4 py-3">Deals closed</th>
                      <th className="px-4 py-3">Active links</th><th className="px-4 py-3">Clicks</th><th className="px-4 py-3">Conversions</th>
                      <th className="px-4 py-3">Owed (USD)</th><th className="px-4 py-3">Paid (USD)</th>
                    </tr>
                  </DashboardTableHead>
                  <tbody className="divide-y divide-border/60">
                    {(revenueData?.partners ?? []).map((p: any) => (
                      <tr key={p.user_id} className="transition-colors hover:bg-muted/10">
                        <td className="px-4 py-3 font-semibold text-foreground">{p.full_name ?? "—"}</td>
                        <td className="px-4 py-3"><StatusPill status={p.commission_tier ?? "standard"} /></td>
                        <td className="px-4 py-3">{p.deals_closed ?? 0}</td>
                        <td className="px-4 py-3">{p.active_links ?? 0}</td>
                        <td className="px-4 py-3">{p.total_clicks ?? 0}</td>
                        <td className="px-4 py-3">{p.conversions ?? 0}</td>
                        <td className="px-4 py-3 font-mono text-xs text-amber-800">${Number(p.owed_usd ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-xs text-emerald-800">${Number(p.paid_usd_running ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {!(revenueData?.partners ?? []).length && (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No referral partners registered yet.</td></tr>
                    )}
                  </tbody>
                </DashboardTable>
              </DashboardPanel>
            )}
          </>
        ) : section === "revenue" ? (
          revenueLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard icon={DollarSign} label="Deal GMV (Total)" value={`$${Number(revenueData?.totals.gmv ?? 0).toLocaleString()}`} />
                <StatCard icon={Award} label="IGE Commission (Total)" value={`$${Number(revenueData?.totals.abw ?? 0).toLocaleString()}`} />
                <StatCard icon={Wallet} label="Partner Owed" value={`$${Number(revenueData?.totals.refOwed ?? 0).toLocaleString()}`} />
                <StatCard icon={Inbox} label="Open Deals" value={revenueData?.totals.open ?? 0} />
                <StatCard icon={TrendingUp} label="Pipeline forecast" value={`$${Number(revenueData?.totals.forecast ?? 0).toLocaleString()}`} />
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

            {/* Deal pipeline — editable */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="bg-muted/20 px-5 py-4 border-b border-border">
                <h3 className="font-display font-semibold text-base text-foreground">Deal pipeline</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Set the deal value, advance the stage; commission auto-calculates at “payment received.”</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[920px]">
                  <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Event</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">USD</th><th className="px-4 py-3">IGE</th><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(revenueData?.deals ?? []).map((d: any) => {
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
                          <td className="px-4 py-3 font-mono text-xs">{d.deal_value_usd ? fmtMoney("USD", Number(d.deal_value_usd)) : "—"}</td>
                          <td className="px-4 py-3 font-mono text-xs">{d.abw_commission_usd ? fmtMoney("USD", Number(d.abw_commission_usd)) : "—"}</td>
                          <td className="px-4 py-3">
                            {d.referral_partner_id ? (
                              <div>
                                <div className="font-mono text-xs">{d.referral_commission_usd ? fmtMoney("USD", Number(d.referral_commission_usd)) : "—"}</div>
                                <div className="text-[10px] text-muted-foreground">{d.referral_commission_paid ? "Paid" : "Owed"}</div>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
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
                            {d.referral_partner_id && d.status === "payment_received" && !d.referral_commission_paid ? (
                              <button onClick={() => paidMut.mutate(d.id)} disabled={paidMut.isPending} className="rounded bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:opacity-90 disabled:opacity-50">Mark paid</button>
                            ) : d.referral_commission_paid ? (
                              <span className="inline-flex rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Paid</span>
                            ) : <span className="text-xs text-muted-foreground italic">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {!(revenueData?.deals ?? []).length && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No deals yet. Convert a pending inquiry above to start the pipeline.</td></tr>
                    )}
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

function VettingDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const fetchOne = useServerFn(getEventForAdmin);
  const setStatus = useServerFn(setEventVettingStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "event", id],
    queryFn: () => fetchOne({ data: { id } }),
  });
  const [note, setNote] = useState("");

  const transition = useMutation({
    mutationFn: (to: string) => setStatus({ data: { id, to_status: to as any, note: note || null } }),
    onSuccess: (_res, to) => {
      toast.success(`Moved to ${to.replace(/_/g, " ")}`);
      qc.invalidateQueries({ queryKey: ["admin", "vetting"] });
      qc.invalidateQueries({ queryKey: ["admin", "event", id] });
      setNote("");
      if (to === "approved" || to === "rejected" || to === "listed") onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-2xl border-l border-border flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <button onClick={onClose} className="text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer">✕ Close</button>
            {data && <StatusBadge status={data.event.status} />}
          </div>
          {isLoading || !data ? (
            <div className="mt-8 flex justify-center text-muted-foreground text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> Loading event details…
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground leading-tight">{data.event.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground font-mono">{data.organiser?.email}</p>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm border-t border-b border-border/60 py-4 bg-muted/10 px-4 rounded-xl">
                <InfoItem label="Type" value={data.event.event_type} />
                <InfoItem label="Format" value={data.event.format} />
                <InfoItem label="Start" value={data.event.start_date ? new Date(data.event.start_date).toLocaleDateString() : "-"} />
                <InfoItem label="End" value={data.event.end_date ? new Date(data.event.end_date).toLocaleDateString() : "-"} />
                <InfoItem label="Location" value={[data.event.city, data.event.country].filter(Boolean).join(", ")} />
                <InfoItem label="Attendance" value={data.event.attendance_size ? Number(data.event.attendance_size).toLocaleString() : "-"} />
                <InfoItem label="Primary sector" value={data.event.primary_sector} />
                <InfoItem label="Min spend" value={data.event.min_sponsorship_spend ? `${data.event.currency} ${Number(data.event.min_sponsorship_spend).toLocaleString()}` : "-"} />
              </dl>

              <div className="space-y-2 text-sm">
                <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Event Resources</h4>
                <AssetLinkItem label="Sponsorship deck" url={data.event.sponsorship_deck_url} />
                <AssetLinkItem label="Banner image" url={data.event.banner_image_url} />
                <AssetLinkItem label="Floor plan" url={data.event.floor_plan_url} />
                <AssetLinkItem label="Event website" url={data.event.website} />
              </div>

              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Tiers ({data.tiers.length})</h4>
                <div className="space-y-1.5">
                  {data.tiers.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
                      <span className="font-bold text-foreground">{t.tier_name}</span>
                      <span className="text-xs text-muted-foreground">{t.currency} {Number(t.price).toLocaleString()} · {t.slots_total} slots</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action notes (Required for revision/rejection)</span>
                  <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Enter review comments here..." />
                </label>
                <div className="flex flex-wrap gap-2">
                  {data.event.status === "submitted" && (
                    <ActionBtn onClick={() => transition.mutate("under_review")} variant="primary" icon={ArrowRight} label="Start review" pending={transition.isPending} />
                  )}
                  {data.event.status === "under_review" && (
                    <>
                      <ActionBtn onClick={() => transition.mutate("approved")} variant="success" icon={CheckCircle2} label="Approve" pending={transition.isPending} />
                      <ActionBtn onClick={() => transition.mutate("revision_requested")} variant="warning" icon={Pencil} label="Request revision" pending={transition.isPending} />
                      <ActionBtn onClick={() => transition.mutate("rejected")} variant="danger" icon={XCircle} label="Reject" pending={transition.isPending} />
                    </>
                  )}
                  {data.event.status === "approved" && (
                    <ActionBtn onClick={() => transition.mutate("listed")} variant="primary" icon={ArrowRight} label="List publicly" pending={transition.isPending} />
                  )}
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link to="/events/edit/$id" params={{ id }} className="text-xs text-primary font-semibold hover:underline">View full event editor →</Link>
                  {(data.event.status === "approved" || data.event.status === "listed") && data.event.slug && (
                    <Link to="/events/$slug" params={{ slug: data.event.slug }} className="text-xs text-primary font-semibold hover:underline">View public listing →</Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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

function InfoItem({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground font-medium">{value ?? "-"}</dd>
    </div>
  );
}

function AssetLinkItem({ label, url }: { label: string; url?: string | null }) {
  if (!url) return <div className="text-xs text-muted-foreground">{label}: <span className="italic">not provided</span></div>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block truncate text-sm text-primary font-bold hover:underline">{label} ↗</a>
  );
}

function ActionBtn({ onClick, variant, icon: Icon, label, pending }: any) {
  const cls =
    variant === "primary" ? "bg-brand-gradient text-white"
      : variant === "success" ? "bg-emerald-600 text-white hover:bg-emerald-700"
        : variant === "warning" ? "bg-amber-500 text-white hover:bg-amber-600"
          : "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  return (
    <button disabled={pending} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${cls}`}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />} {label}
    </button>
  );
}
