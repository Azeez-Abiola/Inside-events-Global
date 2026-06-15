import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { b as useQueryClient, a as useQuery, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useServerFn, e as createSsrRpc } from "./router-CyTgVp-T.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { supabase } from "./client-DBr2rXmP.mjs";
import { A as AppShell, S as StatusBadge } from "./app-shell-B3fq3Cpm.mjs";
import { a as DashboardHeader, e as StatCard, A as AdminAnalyticsPanel } from "./dashboard-analytics-D8pPgueL.mjs";
import { d as createServerFn } from "./server-DRh9RfeA.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-t0GaQtdd.mjs";
import { b as adminGetRevenue, c as adminListFraudFlags, e as adminResolveFraudFlag, g as adminUpsertCommissionConfig, a as adminCreateDeal, f as adminUpdateDealStatus, d as adminMarkCommissionPaid } from "./deals.functions-CswHRnbl.mjs";
import { a as fmtMoney } from "./currency-Cm9QA4xQ.mjs";
import { a2 as ShieldCheck, ad as Users, D as DollarSign, M as LoaderCircle, a9 as TriangleAlert, i as Check, af as X, a3 as SlidersHorizontal, b as Award, ae as Wallet, I as Inbox, a as ArrowRight, m as CircleCheck, W as Pencil, n as CircleX } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";
const listEventsForVetting = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("bda00c310fa4568441e620fa4b7901e1b8699194489e81ecf9bd779642b0b27d"));
const getEventForAdmin = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("773d8acef26731b95061f34b034599a7953aef266332f3e549f6bef17c96c138"));
const SetStatusInput = objectType({
  id: stringType().uuid(),
  to_status: enumType(["under_review", "revision_requested", "approved", "rejected", "listed", "closed", "archived"]),
  note: stringType().max(2e3).optional().nullable()
});
const setEventVettingStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => SetStatusInput.parse(d)).handler(createSsrRpc("a901d51839bdbcdf14cadafa26818c8fe62ee10b51bf69c9d8fa3674abbe2220"));
const DEAL_STATUSES = [
  "inquiry_received",
  "vetting",
  "intro_made",
  "in_negotiation",
  "verbal_commitment",
  "contract_sent",
  "contract_signed",
  "payment_received",
  "closed_lost",
  "cancelled"
];
function AdminDashboard({ section = "overview" }) {
  const [activeSubTab, setActiveSubTab] = reactExports.useState("waitlist");
  const [drawerOpen, setDrawerOpen] = reactExports.useState(null);
  const qc = useQueryClient();
  const fetchVetting = useServerFn(listEventsForVetting);
  const fetchRevenue = useServerFn(adminGetRevenue);
  const fetchFraud = useServerFn(adminListFraudFlags);
  const resolveFlag = useServerFn(adminResolveFraudFlag);
  const upsertConfig = useServerFn(adminUpsertCommissionConfig);
  const fraud = useQuery({ queryKey: ["admin", "fraud"], queryFn: () => fetchFraud() });
  const resolveMut = useMutation({
    mutationFn: (v) => resolveFlag({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "fraud"] });
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      toast.success("Flag updated");
    },
    onError: (e) => toast.error(e.message)
  });
  const configMut = useMutation({
    mutationFn: (v) => upsertConfig({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      toast.success("Rates saved");
    },
    onError: (e) => toast.error(e.message)
  });
  const createDeal = useServerFn(adminCreateDeal);
  const updateDeal = useServerFn(adminUpdateDealStatus);
  const markPaid = useServerFn(adminMarkCommissionPaid);
  const createDealMut = useMutation({
    mutationFn: (commitment_form_id) => createDeal({ data: { commitment_form_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      toast.success("Deal created from inquiry");
    },
    onError: (e) => toast.error(e.message)
  });
  const statusMut = useMutation({
    mutationFn: (v) => updateDeal({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "revenue"] }),
    onError: (e) => toast.error(e.message)
  });
  const paidMut = useMutation({
    mutationFn: (deal_id) => markPaid({ data: { deal_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      toast.success("Commission marked paid");
    },
    onError: (e) => toast.error(e.message)
  });
  const { data: vettingData, isLoading: vettingLoading } = useQuery({
    queryKey: ["admin", "vetting"],
    queryFn: () => fetchVetting()
  });
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => fetchRevenue()
  });
  const waitlist = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase.from("waitlist_signups").select("id,created_at,audience,full_name,email,company,role_title,country,phone,notes,status").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    }
  });
  const contact = useQuery({
    queryKey: ["admin-contact"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_submissions").select("id,created_at,name,email,company,subject,message,status").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    }
  });
  const groupedVetting = {
    submitted: [],
    under_review: [],
    revision_requested: [],
    approved: [],
    rejected: []
  };
  (vettingData?.events ?? []).forEach((e) => {
    if (groupedVetting[e.status]) groupedVetting[e.status].push(e);
  });
  const vettingCount = vettingData?.events?.length ?? 0;
  const waitlistCount = waitlist.data?.length ?? 0;
  const adminGmv = `$${(revenueData?.totals.gmv ?? 0).toLocaleString(void 0, { maximumFractionDigits: 0 })}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardHeader,
      {
        title: "Admin control center",
        subtitle: "Vet submitted events, manage inbound signups, and track platform revenue and referral commissions."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ShieldCheck, label: "Vetting queue", value: vettingCount, loading: vettingLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Users, label: "Waitlist signups", value: waitlistCount, loading: waitlist.isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: DollarSign, label: "Deal volume (GMV)", value: adminGmv, loading: revenueLoading })
    ] }),
    section === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [
      { to: "/dashboard/vetting", label: "Event queue", desc: "Review submitted listings" },
      { to: "/dashboard/submissions", label: "Submissions", desc: "Waitlist & contact inbox" },
      { to: "/dashboard/revenue", label: "Revenue & deals", desc: "GMV, deals & payouts" },
      { to: "/dashboard/controls", label: "Fraud & rates", desc: "Flags & commission config" },
      { to: "/dashboard/analytics", label: "Analytics", desc: "Platform metrics" }
    ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: item.to, className: "rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition-all", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: item.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: item.desc })
    ] }, item.to)) }),
    section === "analytics" ? /* @__PURE__ */ jsxRuntimeExports.jsx(AdminAnalyticsPanel, {}) : section === "vetting" ? vettingLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 xl:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-1", children: [
      { key: "submitted", label: "New submissions" },
      { key: "under_review", label: "Under review" },
      { key: "revision_requested", label: "Revision requested" },
      { key: "approved", label: "Approved" },
      { key: "rejected", label: "Rejected" }
    ].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-muted/20 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: c.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-card px-2 py-0.5 border border-border text-[10px] font-bold", children: groupedVetting[c.key]?.length ?? 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        (groupedVetting[c.key] ?? []).map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setDrawerOpen(e.id), className: "block w-full rounded-lg border border-border bg-card p-3 text-left text-sm hover:border-primary hover:shadow-soft transition-all cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground truncate", children: e.name || "Untitled" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground truncate", children: [e.event_type, e.city, e.country].filter(Boolean).join(" · ") || "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 text-[10px] font-mono text-muted-foreground/80 truncate border-t border-border/50 pt-1", children: e.organiser_email })
        ] }, e.id)),
        groupedVetting[c.key]?.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground italic", children: "Empty" })
      ] })
    ] }, c.key)) }) : section === "submissions" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 border-b border-border/60 pb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveSubTab("waitlist"), className: `px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeSubTab === "waitlist" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`, children: [
          "Waitlist (",
          waitlistCount,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveSubTab("contact"), className: `px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeSubTab === "contact" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`, children: [
          "Contact Messages (",
          contact.data?.length ?? 0,
          ")"
        ] })
      ] }),
      activeSubTab === "waitlist" ? waitlist.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground", children: "Loading…" }) : !waitlist.data?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground", children: "No waitlist signups." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[800px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "When" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Audience" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Company" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Country" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: waitlist.data.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground whitespace-nowrap", children: new Date(r.created_at).toLocaleString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-muted px-2 py-0.5 text-xs font-medium border border-border", children: r.audience }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-medium text-foreground", children: r.full_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `mailto:${r.email}`, className: "text-primary hover:underline font-medium", children: r.email }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground", children: r.company ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground", children: r.role_title ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground", children: r.country ?? "—" })
        ] }, r.id)) })
      ] }) }) }) : contact.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground", children: "Loading…" }) : !contact.data?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground", children: "No contact messages." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[800px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "When" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "From" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Subject" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Message" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: contact.data.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground whitespace-nowrap", children: new Date(r.created_at).toLocaleString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground", children: r.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `mailto:${r.email}`, className: "text-xs text-primary hover:underline", children: r.email }),
            r.company && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: r.company })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-medium text-foreground max-w-[150px] truncate", title: r.subject, children: r.subject }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground text-xs whitespace-pre-wrap max-w-[400px]", children: r.message }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-muted px-2 py-0.5 text-xs font-semibold", children: r.status }) })
        ] }, r.id)) })
      ] }) }) })
    ] }) : section === "controls" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-display text-base font-bold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-destructive" }),
          " Fraud flags"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Self-referral and suspicious-attribution flags raised by the system." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 rounded-xl border border-border bg-card overflow-hidden", children: fraud.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 text-center text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "inline h-4 w-4 animate-spin" }),
          " Loading…"
        ] }) : !(fraud.data?.flags ?? []).length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground text-sm", children: "No fraud flags. Clean slate." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Action" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: (fraud.data?.flags ?? []).map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-semibold text-foreground capitalize", children: (f.flag_type || "").replace(/_/g, " ") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground max-w-[360px]", children: f.description ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${f.status === "open" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`, children: f.status }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: f.status === "open" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => resolveMut.mutate({ id: f.id, status: "actioned" }), disabled: resolveMut.isPending, className: "inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }),
                " Action"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => resolveMut.mutate({ id: f.id, status: "dismissed" }), disabled: resolveMut.isPending, className: "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }),
                " Dismiss"
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground italic", children: "reviewed" }) })
          ] }, f.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-display text-base font-bold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-4 w-4 text-primary" }),
          " Commission rates"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Per event-type category. Standard/premium = referral partner share; platform = IGE take." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 rounded-xl border border-border bg-card overflow-hidden overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[640px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Category" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Standard %" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Premium %" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Platform %" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
            (revenueData?.commissionConfig ?? []).map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(CommissionRow, { config: c, onSave: (v) => configMut.mutate(v), saving: configMut.isPending }, c.event_type_category)),
            !(revenueData?.commissionConfig ?? []).length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "px-4 py-8 text-center text-muted-foreground text-sm", children: "No commission config rows." }) })
          ] })
        ] }) })
      ] })
    ] }) : section === "revenue" ? revenueLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: DollarSign, label: "Deal GMV (Total)", value: `$${Number(revenueData?.totals.gmv ?? 0).toLocaleString()}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Award, label: "IGE Commission (Total)", value: `$${Number(revenueData?.totals.abw ?? 0).toLocaleString()}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Wallet, label: "Partner Owed", value: `$${Number(revenueData?.totals.refOwed ?? 0).toLocaleString()}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Inbox, label: "Open Deals", value: revenueData?.totals.open ?? 0 })
      ] }),
      (revenueData?.inquiries ?? []).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-amber-300/60 bg-amber-50/50 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-4 border-b border-amber-200/60 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { className: "h-4 w-4 text-amber-700" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-display font-semibold text-base text-foreground", children: [
            "Pending inquiries (",
            (revenueData?.inquiries ?? []).length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[700px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-amber-100/40 text-left text-xs uppercase tracking-wide border-b border-amber-200/60 text-amber-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Event" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Company" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Budget" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Referral" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Action" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-amber-200/40", children: (revenueData?.inquiries ?? []).map((f) => {
            const ev = revenueData.events[f.event_id];
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-amber-100/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-semibold text-foreground", children: ev?.name ?? "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-foreground", children: f.company_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: f.contact_name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs font-semibold", children: f.budget_range_min || f.budget_range_max ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}` : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                f.referral_partner_id ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary-deep", children: "Attributed" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Direct" }),
                Array.isArray(f.fraud_flags) && f.fraud_flags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-2.5 w-2.5" }),
                  " flag"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => createDealMut.mutate(f.id),
                  disabled: createDealMut.isPending,
                  className: "inline-flex items-center gap-1 rounded-md bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" }),
                    " Create deal"
                  ]
                }
              ) })
            ] }, f.id);
          }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/20 px-5 py-4 border-b border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-semibold text-base text-foreground", children: "Deal pipeline" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Set the deal value, advance the stage; commission auto-calculates at “payment received.”" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[920px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Event" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Value" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "USD" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "IGE" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Partner" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Stage" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Payout" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
            (revenueData?.deals ?? []).map((d) => {
              const ev = revenueData.events[d.event_id];
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10 transition-colors align-top", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground", children: ev?.name ?? "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: [ev?.city, ev?.country].filter(Boolean).join(", ") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "number",
                      defaultValue: d.deal_value_native ?? "",
                      onBlur: (e) => {
                        const v = Number(e.target.value);
                        if (v && v !== Number(d.deal_value_native)) statusMut.mutate({ id: d.id, status: d.status, deal_value_native: v });
                      },
                      className: "w-28 rounded border border-border bg-transparent px-2 py-1 text-xs"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-[10px] text-muted-foreground", children: d.deal_currency })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-mono text-xs", children: d.deal_value_usd ? fmtMoney("USD", Number(d.deal_value_usd)) : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-mono text-xs", children: d.abw_commission_usd ? fmtMoney("USD", Number(d.abw_commission_usd)) : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: d.referral_partner_id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-xs", children: d.referral_commission_usd ? fmtMoney("USD", Number(d.referral_commission_usd)) : "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: d.referral_commission_paid ? "Paid" : "Owed" })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "select",
                  {
                    value: d.status,
                    onChange: (e) => statusMut.mutate({ id: d.id, status: e.target.value }),
                    className: "rounded border border-border bg-transparent px-2 py-1 text-xs capitalize",
                    children: DEAL_STATUSES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: s.replace(/_/g, " ") }, s))
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: d.referral_partner_id && d.status === "payment_received" && !d.referral_commission_paid ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => paidMut.mutate(d.id), disabled: paidMut.isPending, className: "rounded bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:opacity-90 disabled:opacity-50", children: "Mark paid" }) : d.referral_commission_paid ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800", children: "Paid" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground italic", children: "—" }) })
              ] }, d.id);
            }),
            !(revenueData?.deals ?? []).length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "px-4 py-10 text-center text-muted-foreground", children: "No deals yet. Convert a pending inquiry above to start the pipeline." }) })
          ] })
        ] }) })
      ] })
    ] }) : null,
    drawerOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(VettingDrawer, { id: drawerOpen, onClose: () => setDrawerOpen(null) })
  ] }) });
}
function VettingDrawer({ id, onClose }) {
  const qc = useQueryClient();
  const fetchOne = useServerFn(getEventForAdmin);
  const setStatus = useServerFn(setEventVettingStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "event", id],
    queryFn: () => fetchOne({ data: { id } })
  });
  const [note, setNote] = reactExports.useState("");
  const transition = useMutation({
    mutationFn: (to) => setStatus({ data: { id, to_status: to, note: note || null } }),
    onSuccess: (_res, to) => {
      toast.success(`Moved to ${to.replace(/_/g, " ")}`);
      qc.invalidateQueries({ queryKey: ["admin", "vetting"] });
      qc.invalidateQueries({ queryKey: ["admin", "event", id] });
      setNote("");
      if (to === "approved" || to === "rejected" || to === "listed") onClose();
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex justify-end bg-black/50", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-2xl border-l border-border flex flex-col justify-between", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border pb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer", children: "✕ Close" }),
      data && /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: data.event.status })
    ] }),
    isLoading || !data ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex justify-center text-muted-foreground text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin text-primary" }),
      " Loading event details…"
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-bold text-foreground leading-tight", children: data.event.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground font-mono", children: data.organiser?.email })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "grid grid-cols-2 gap-4 text-sm border-t border-b border-border/60 py-4 bg-muted/10 px-4 rounded-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Type", value: data.event.event_type }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Format", value: data.event.format }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Start", value: data.event.start_date ? new Date(data.event.start_date).toLocaleDateString() : "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "End", value: data.event.end_date ? new Date(data.event.end_date).toLocaleDateString() : "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Location", value: [data.event.city, data.event.country].filter(Boolean).join(", ") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Attendance", value: data.event.attendance_size ? Number(data.event.attendance_size).toLocaleString() : "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Primary sector", value: data.event.primary_sector }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Min spend", value: data.event.min_sponsorship_spend ? `${data.event.currency} ${Number(data.event.min_sponsorship_spend).toLocaleString()}` : "-" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-xs uppercase tracking-wide text-muted-foreground", children: "Event Resources" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLinkItem, { label: "Sponsorship deck", url: data.event.sponsorship_deck_url }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLinkItem, { label: "Banner image", url: data.event.banner_image_url }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLinkItem, { label: "Floor plan", url: data.event.floor_plan_url }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLinkItem, { label: "Event website", url: data.event.website })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2", children: [
          "Tiers (",
          data.tiers.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: data.tiers.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-foreground", children: t.tier_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            t.currency,
            " ",
            Number(t.price).toLocaleString(),
            " · ",
            t.slots_total,
            " slots"
          ] })
        ] }, t.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border pt-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Action notes (Required for revision/rejection)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 3, value: note, onChange: (e) => setNote(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary", placeholder: "Enter review comments here..." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          data.event.status === "submitted" && /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("under_review"), variant: "primary", icon: ArrowRight, label: "Start review", pending: transition.isPending }),
          data.event.status === "under_review" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("approved"), variant: "success", icon: CircleCheck, label: "Approve", pending: transition.isPending }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("revision_requested"), variant: "warning", icon: Pencil, label: "Request revision", pending: transition.isPending }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("rejected"), variant: "danger", icon: CircleX, label: "Reject", pending: transition.isPending })
          ] }),
          data.event.status === "approved" && /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("listed"), variant: "primary", icon: ArrowRight, label: "List publicly", pending: transition.isPending })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-4 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/events/edit/$id", params: { id }, className: "text-xs text-primary font-semibold hover:underline", children: "View full event editor →" }),
          (data.event.status === "approved" || data.event.status === "listed") && data.event.slug && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/events/$slug", params: { slug: data.event.slug }, className: "text-xs text-primary font-semibold hover:underline", children: "View public listing →" })
        ] })
      ] })
    ] })
  ] }) }) });
}
function CommissionRow({ config, onSave, saving }) {
  const [std, setStd] = reactExports.useState(String((Number(config.standard_rate) * 100).toFixed(1)));
  const [prem, setPrem] = reactExports.useState(String((Number(config.premium_rate) * 100).toFixed(1)));
  const [plat, setPlat] = reactExports.useState(String((Number(config.abw_platform_rate) * 100).toFixed(1)));
  const dirty = Number(std) !== Number((config.standard_rate * 100).toFixed(1)) || Number(prem) !== Number((config.premium_rate * 100).toFixed(1)) || Number(plat) !== Number((config.abw_platform_rate * 100).toFixed(1));
  const cell = "w-20 rounded border border-border bg-transparent px-2 py-1 text-xs";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-medium text-foreground", children: config.event_type_category }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.1", min: 0, max: 100, value: std, onChange: (e) => setStd(e.target.value), className: cell }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.1", min: 0, max: 100, value: prem, onChange: (e) => setPrem(e.target.value), className: cell }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.1", min: 0, max: 100, value: plat, onChange: (e) => setPlat(e.target.value), className: cell }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        disabled: !dirty || saving,
        onClick: () => onSave({
          event_type_category: config.event_type_category,
          standard_rate: Number(std) / 100,
          premium_rate: Number(prem) / 100,
          abw_platform_rate: Number(plat) / 100
        }),
        className: "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40 hover:bg-primary/90",
        children: "Save"
      }
    ) })
  ] });
}
function InfoItem({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-0.5 text-foreground font-medium", children: value ?? "-" })
  ] });
}
function AssetLinkItem({ label, url }) {
  if (!url) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
    label,
    ": ",
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic", children: "not provided" })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: url, target: "_blank", rel: "noreferrer", className: "block truncate text-sm text-primary font-bold hover:underline", children: [
    label,
    " ↗"
  ] });
}
function ActionBtn({ onClick, variant, icon: Icon, label, pending }) {
  const cls = variant === "primary" ? "bg-brand-gradient text-white" : variant === "success" ? "bg-emerald-600 text-white hover:bg-emerald-700" : variant === "warning" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: pending, onClick, className: `inline-flex items-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${cls}`, children: [
    pending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5" }),
    " ",
    label
  ] });
}
export {
  AdminDashboard as A
};
