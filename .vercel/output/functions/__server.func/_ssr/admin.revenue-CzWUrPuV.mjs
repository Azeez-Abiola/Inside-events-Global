import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { n as useServerFn, h as getCurrentRates } from "./router-4-w4Upb_.mjs";
import { b as useQueryClient, a as useQuery, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { A as AppShell } from "./app-shell-B89gTHZ9.mjs";
import { b as adminGetRevenue, f as adminUpdateDealStatus, d as adminMarkCommissionPaid, g as adminUpdateRates } from "./deals.functions-BR3-t1sS.mjs";
import { a as fmtMoney } from "./currency-Cm9QA4xQ.mjs";
import "../_libs/seroval.mjs";
import { X as RefreshCw, D as DollarSign, a7 as TrendingUp, e as Briefcase, a8 as TriangleAlert } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "./client-BhermGBt.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./server-Dl4ga8RB.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-DnNqQzIF.mjs";
import "../_libs/lovable.dev__webhooks-js.mjs";
import "./client.server-U_pH-Evd.mjs";
import "../_libs/lovable.dev__email-js.mjs";
import "../_libs/react-email__render.mjs";
import "../_libs/prettier.mjs";
import "../_libs/html-to-text.mjs";
import "../_libs/selderee__plugin-htmlparser2.mjs";
import "../_libs/selderee.mjs";
import "../_libs/parseley.mjs";
import "../_libs/leac.mjs";
import "../_libs/peberminta.mjs";
import "../_libs/domhandler.mjs";
import "../_libs/domelementtype.mjs";
import "../_libs/htmlparser2.mjs";
import "../_libs/entities.mjs";
import "../_libs/deepmerge.mjs";
import "../_libs/dom-serializer.mjs";
import "../_libs/react-email__html.mjs";
import "../_libs/react-email__head.mjs";
import "../_libs/react-email__preview.mjs";
import "../_libs/react-email__body.mjs";
import "../_libs/react-email__container.mjs";
import "../_libs/react-email__heading.mjs";
import "../_libs/react-email__text.mjs";
import "../_libs/react-email__hr.mjs";
import "../_libs/react-email__link.mjs";
import "../_libs/react-email__button.mjs";
import "../_libs/zod.mjs";
const DEAL_STATUSES = ["inquiry_received", "vetting", "intro_made", "in_negotiation", "verbal_commitment", "contract_sent", "contract_signed", "payment_received", "closed_lost", "cancelled"];
function AdminRevenue() {
  const fetch = useServerFn(adminGetRevenue);
  const fetchRates = useServerFn(getCurrentRates);
  const updateStatus = useServerFn(adminUpdateDealStatus);
  const markPaid = useServerFn(adminMarkCommissionPaid);
  const updateRates = useServerFn(adminUpdateRates);
  const qc = useQueryClient();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => fetch()
  });
  const {
    data: ratesData
  } = useQuery({
    queryKey: ["fx-rates"],
    queryFn: () => fetchRates()
  });
  const statusMut = useMutation({
    mutationFn: (v) => updateStatus({
      data: v
    }),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["admin-revenue"]
    })
  });
  const paidMut = useMutation({
    mutationFn: (deal_id) => markPaid({
      data: {
        deal_id
      }
    }),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["admin-revenue"]
    })
  });
  const [ratesOpen, setRatesOpen] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight", children: "Revenue & deals" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-muted-foreground", children: "All commitments, deal stages, ABW commission, and partner payouts." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setRatesOpen(true), className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
        " Refresh FX rates"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-4 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: DollarSign, label: "GMV (USD)", value: `$${(data?.totals.gmv ?? 0).toLocaleString(void 0, {
        maximumFractionDigits: 0
      })}`, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: TrendingUp, label: "ABW commission", value: `$${(data?.totals.abw ?? 0).toLocaleString(void 0, {
        maximumFractionDigits: 0
      })}`, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: Briefcase, label: "Open deals", value: data?.totals.open ?? 0, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { icon: TriangleAlert, label: "Partner payouts owed", value: `$${(data?.totals.refOwed ?? 0).toLocaleString(void 0, {
        maximumFractionDigits: 0
      })}`, loading: isLoading })
    ] }),
    data?.fraudFlagsOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4" }),
      " ",
      data.fraudFlagsOpen,
      " open fraud flag(s) need review."
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-semibold", children: "Deals pipeline" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 overflow-x-auto rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[1100px] text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Event" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Value" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "USD" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "ABW" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Partner" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Action" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          (data?.deals ?? []).map((d) => {
            const ev = data.events[d.event_id];
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border align-top", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: ev?.name ?? "-" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: [ev?.city, ev?.country].filter(Boolean).join(", ") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", defaultValue: d.deal_value_native ?? "", onBlur: (e) => {
                  const v = Number(e.target.value);
                  if (v && v !== Number(d.deal_value_native)) {
                    statusMut.mutate({
                      id: d.id,
                      status: d.status,
                      deal_value_native: v
                    });
                  }
                }, className: "w-28 rounded border border-border bg-transparent px-2 py-1 text-xs" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-[10px] text-muted-foreground", children: d.deal_currency })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-mono text-xs", children: d.deal_value_usd ? fmtMoney("USD", Number(d.deal_value_usd)) : "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-mono text-xs", children: d.abw_commission_usd ? fmtMoney("USD", Number(d.abw_commission_usd)) : "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: d.referral_partner_id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-xs", children: d.referral_commission_usd ? fmtMoney("USD", Number(d.referral_commission_usd)) : "-" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: d.referral_commission_paid ? "Paid" : "Owed" })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "-" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: d.status, onChange: (e) => statusMut.mutate({
                id: d.id,
                status: e.target.value
              }), className: "rounded border border-border bg-transparent px-2 py-1 text-xs capitalize", children: DEAL_STATUSES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: s.replace(/_/g, " ") }, s)) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: d.referral_partner_id && d.status === "payment_received" && !d.referral_commission_paid && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => paidMut.mutate(d.id), className: "rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:opacity-90", children: "Mark paid" }) })
            ] }, d.id);
          }),
          !data?.deals?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "px-4 py-10 text-center text-muted-foreground", children: "No deals yet." }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-semibold", children: "Referral partners" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 overflow-hidden rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Partner" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Tier" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Deals closed" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Earned (USD)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Owed" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          (data?.partners ?? []).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: p.full_name ?? p.user_id.slice(0, 8) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 capitalize", children: p.commission_tier }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: p.deals_closed }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-mono", children: fmtMoney("USD", Number(p.total_earned_usd ?? 0)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-mono", children: fmtMoney("USD", Number(p.owed_usd ?? 0)) })
          ] }, p.user_id)),
          !data?.partners?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "px-4 py-10 text-center text-muted-foreground", children: "No partners yet." }) })
        ] })
      ] }) })
    ] }),
    ratesOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(RatesDialog, { current: ratesData?.rates, onClose: () => setRatesOpen(false), onSubmit: async (v) => {
      await updateRates({
        data: v
      });
      qc.invalidateQueries({
        queryKey: ["fx-rates"]
      });
      qc.invalidateQueries({
        queryKey: ["admin-revenue"]
      });
      setRatesOpen(false);
    } })
  ] });
}
function Stat({
  icon: Icon,
  label,
  value,
  loading
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5 text-muted-foreground" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-display text-2xl font-bold", children: loading ? "…" : value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label })
  ] });
}
function RatesDialog({
  current,
  onClose,
  onSubmit
}) {
  const [ngn, setNgn] = reactExports.useState(current?.ngn_rate ?? 1650);
  const [gbp, setGbp] = reactExports.useState(current?.gbp_rate ?? 0.79);
  const [eur, setEur] = reactExports.useState(current?.eur_rate ?? 0.92);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onClick: (e) => e.stopPropagation(), onSubmit: (e) => {
    e.preventDefault();
    onSubmit({
      ngn_rate: Number(ngn),
      gbp_rate: Number(gbp),
      eur_rate: Number(eur)
    });
  }, className: "w-full max-w-md space-y-4 rounded-xl bg-card p-6 shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-lg font-bold", children: "Refresh exchange rates (per 1 USD)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm", children: [
      "NGN ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.01", value: ngn, onChange: (e) => setNgn(e.target.value), className: "mt-1 w-full rounded border border-border bg-transparent px-3 py-2" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm", children: [
      "GBP ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.0001", value: gbp, onChange: (e) => setGbp(e.target.value), className: "mt-1 w-full rounded border border-border bg-transparent px-3 py-2" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm", children: [
      "EUR ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.0001", value: eur, onChange: (e) => setEur(e.target.value), className: "mt-1 w-full rounded border border-border bg-transparent px-3 py-2" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "rounded px-3 py-1.5 text-sm hover:bg-muted", children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "rounded bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground", children: "Save" })
    ] })
  ] }) });
}
export {
  AdminRevenue as component
};
