import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery, b as useQueryClient, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { o as useServerFn, k as getReferralDashboard, l as listMarketplaceEvents, g as generateReferralLink } from "./router-BT27-cf7.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { A as AppShell } from "./app-shell-ByWYJGa2.mjs";
import { a as DashboardHeader, e as StatCard, R as ReferralAnalyticsPanel } from "./dashboard-analytics-l4Z-ZUzR.mjs";
import { a as fmtMoney } from "./currency-Cm9QA4xQ.mjs";
import { Y as Plus, K as Link2, U as MousePointerClick, a8 as TrendingUp, ae as Wallet, b as Award, p as Copy, R as MessageCircle, a1 as Share2, O as Mail } from "../_libs/lucide-react.mjs";
function ReferralDashboard({ section = "links" }) {
  const [pickerOpen, setPickerOpen] = reactExports.useState(false);
  const fetch = useServerFn(getReferralDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["referral-dash"], queryFn: () => fetch() });
  const activeLinks = data?.stats.linkCount ?? 0;
  const totalClicks = data?.stats.clickCount ?? 0;
  const conversions = data?.stats.conversionCount ?? 0;
  const earnedCommission = `$${(data?.totals.earned ?? 0).toFixed(0)}`;
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied!");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardHeader,
      {
        title: "Referral partner workspace",
        subtitle: "Generate trackable Vouch Links, refer sponsors to vetted events, and monitor commission as deals close.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setPickerOpen(true),
            className: "inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
              " Generate link"
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Link2, label: "Active links", value: activeLinks, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: MousePointerClick, label: "Total clicks", value: totalClicks, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: TrendingUp, label: "Conversions", value: conversions, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Wallet, label: "Earned (USD)", value: earnedCommission, loading: isLoading })
    ] }),
    data?.profile?.igb_partner_badge && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3.5 py-1.5 text-xs font-semibold text-secondary-deep", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-4 w-4" }),
      " IGB Partner — premium commission tier"
    ] }),
    section === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [
      { to: "/dashboard/referrals", label: "My referrals", desc: "Vouch links & sharing" },
      { to: "/dashboard/deals", label: "Commission pipeline", desc: "Attributed deals" },
      { to: "/dashboard/analytics", label: "Analytics", desc: "Clicks & earnings" }
    ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: item.to, className: "rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition-all", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: item.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: item.desc })
    ] }, item.to)) }),
    section === "analytics" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ReferralAnalyticsPanel, {}) : section === "links" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[700px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Event" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Referral Link" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Clicks" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Commission Rate" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Status" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
        (data?.links ?? []).map((l) => {
          const ev = data.events[l.event_id];
          const url = typeof window !== "undefined" ? `${window.location.origin}/r/${l.short_code}` : `/r/${l.short_code}`;
          const shareText = `Sponsor ${ev?.name ?? "this event"} via IGE: ${url}`;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 font-medium text-foreground", children: ev?.name ?? "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleCopy(url), className: "inline-flex items-center gap-1.5 rounded-md bg-muted/80 hover:bg-muted px-2.5 py-1.5 font-mono text-xs text-primary transition-all cursor-pointer border border-border", children: [
                "/r/",
                l.short_code,
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `https://wa.me/?text=${encodeURIComponent(shareText)}`, target: "_blank", rel: "noreferrer", title: "Share on WhatsApp", className: "rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-emerald-600 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-3.5 w-3.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, target: "_blank", rel: "noreferrer", title: "Share on LinkedIn", className: "rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-3.5 w-3.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `mailto:?subject=${encodeURIComponent("Sponsorship opportunity on IGE")}&body=${encodeURIComponent(shareText)}`, title: "Share via email", className: "rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-3.5 w-3.5" }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 font-semibold text-foreground", children: l.click_count }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-3.5 font-medium", children: [
              (Number(l.commission_rate) * 100).toFixed(1),
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary-deep capitalize", children: l.status }) })
          ] }, l.id);
        }),
        !isLoading && !data?.links?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "px-5 py-12 text-center text-muted-foreground", children: "No referral links yet. Generate one to start sharing." }) })
      ] })
    ] }) }) }) : section === "deals" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[700px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Event" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Deal Value" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Your Commission" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Payout" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
        (data?.deals ?? []).map((d) => {
          const ev = data.events[d.event_id];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 font-medium text-foreground", children: ev?.name ?? "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 capitalize text-muted-foreground", children: d.status.replace(/_/g, " ") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 text-xs font-semibold", children: d.deal_value_native ? `${d.deal_currency} ${Number(d.deal_value_native).toLocaleString()}` : "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 text-xs font-semibold text-primary-deep", children: d.referral_commission_usd ? `$${Number(d.referral_commission_usd).toFixed(0)}` : "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5", children: d.referral_commission_paid ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800", children: "Paid" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800", children: "Pending" }) })
          ] }, d.id);
        }),
        !isLoading && !data?.deals?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "px-5 py-12 text-center text-muted-foreground italic", children: "No referred deals in pipeline yet." }) })
      ] })
    ] }) }) }) : null,
    pickerOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(EventPicker, { onClose: () => setPickerOpen(false) })
  ] }) });
}
function EventPicker({ onClose }) {
  const fetchEvents = useServerFn(listMarketplaceEvents);
  const gen = useServerFn(generateReferralLink);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["picker-events"],
    queryFn: () => fetchEvents({ data: { vetted_only: true, per_page: 24 } })
  });
  const mutation = useMutation({
    mutationFn: (event_id) => gen({ data: { event_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-dash"] });
      onClose();
      toast.success("Link generated successfully!");
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-2xl border border-border", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl font-bold text-foreground", children: "Generate Referral Link" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Choose a vetted IGE event to generate a trackable link." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-2", children: [
      (data?.events ?? []).map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => mutation.mutate(e.id),
          disabled: mutation.isPending,
          className: "flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left hover:bg-muted/30 disabled:opacity-50 transition-colors cursor-pointer",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground text-sm", children: e.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: [e.city, e.country].filter(Boolean).join(", ") }),
              e.starting && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-secondary-deep", children: [
                "Est. commission ",
                fmtMoney(e.starting.currency, Number(e.starting.price) * 0.07),
                " – ",
                fmtMoney(e.starting.currency, Number(e.starting.price) * 0.12),
                " on the entry tier"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-primary font-bold hover:underline whitespace-nowrap", children: "Generate →" })
          ]
        },
        e.id
      )),
      data?.events?.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-6 text-muted-foreground text-sm italic", children: "No vetted events available." })
    ] }),
    mutation.error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-destructive", children: mutation.error.message })
  ] }) });
}
export {
  ReferralDashboard as R
};
