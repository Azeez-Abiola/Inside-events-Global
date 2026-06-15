import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { o as useServerFn, f as createSsrRpc } from "./router-BT27-cf7.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { d as createServerFn } from "./server-CqdVJ_Eq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DeHWLdHU.mjs";
import { a2 as ShieldCheck, a8 as TrendingUp, D as DollarSign, ad as Users, M as LoaderCircle, K as Link2, h as ChartColumn, ae as Wallet, V as Newspaper, c as Bookmark, v as Eye, S as MessageSquare, I as Inbox } from "../_libs/lucide-react.mjs";
import { c as LineChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, L as Line, R as ResponsiveContainer, a as BarChart, B as Bar, d as PieChart, P as Pie, b as Cell } from "../_libs/recharts.mjs";
function StatCard({
  icon: Icon,
  label,
  value,
  loading
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5 hover:shadow-soft transition-all duration-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5 text-primary" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 font-display text-2xl font-bold text-foreground", children: loading ? "…" : value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground", children: label })
  ] });
}
function fmtDateRange(s, e) {
  if (!s) return "";
  const fmt = (d) => new Date(d).toLocaleDateString(void 0, { day: "numeric", month: "short", year: "numeric" });
  return e && e !== s ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
}
function DashboardHeader({
  title,
  subtitle,
  action
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 max-w-2xl text-sm text-muted-foreground", children: subtitle })
    ] }),
    action
  ] });
}
function DashboardTabs({
  tabs,
  active,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 overflow-x-auto pb-px", children: tabs.map((tab) => {
    const selected = active === tab.id;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => onChange(tab.id),
        className: `shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${selected ? "border-primary text-primary-deep" : "border-transparent text-muted-foreground hover:text-foreground"}`,
        children: [
          tab.label,
          tab.count !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `ml-2 rounded-full px-2 py-0.5 text-[11px] ${selected ? "bg-brand-soft text-primary-deep" : "bg-muted text-muted-foreground"}`, children: tab.count })
        ]
      },
      tab.id
    );
  }) }) });
}
function DashboardPanel({
  title,
  description,
  children,
  action
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card overflow-hidden", children: [
    (title || action) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        title && /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-base font-bold text-foreground", children: title }),
        description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: description })
      ] }),
      action
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5", children })
  ] });
}
function DashboardEmpty({
  icon: Icon,
  title,
  description,
  action
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "mx-auto h-10 w-10 text-muted-foreground" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 font-display text-lg font-bold text-foreground", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-2 max-w-md text-sm text-muted-foreground", children: description }),
    action && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5", children: action })
  ] });
}
function DashboardLoading({ label = "Loading workspace…" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-16 text-muted-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin text-primary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: label })
  ] });
}
const VETTING_STEPS = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under review" },
  { key: "approved", label: "Approved" },
  { key: "listed", label: "Listed" }
];
function VettingTimeline({ status }) {
  const terminal = ["revision_requested", "rejected", "closed", "archived"].includes(status);
  const activeIdx = VETTING_STEPS.findIndex((s) => s.key === status);
  const revision = status === "revision_requested";
  const rejected = status === "rejected";
  if (terminal && !revision && !rejected && !VETTING_STEPS.some((s) => s.key === status)) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-lg border border-border bg-muted/20 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", children: "Vetting progress" }),
    revision && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-amber-800", children: "IGE requested revisions — update your listing and resubmit when ready." }),
    rejected && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-800", children: "This listing was not approved. Check reviewer notes on the event editor." }),
    !revision && !rejected && /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "mt-2 flex flex-wrap gap-2", children: VETTING_STEPS.map((step, i) => {
      const done = activeIdx > i;
      const current = activeIdx === i;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "li",
        {
          className: `rounded-full px-2.5 py-1 text-[11px] font-semibold ${current ? "bg-brand-gradient text-white" : done ? "bg-secondary/15 text-secondary-deep" : "bg-muted text-muted-foreground"}`,
          children: step.label
        },
        step.key
      );
    }) })
  ] });
}
const THEMES = { light: "", dark: ".dark" };
const ChartContext = reactExports.createContext(null);
function useChart() {
  const context = reactExports.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}
const ChartContainer = reactExports.forwardRef(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = reactExports.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContext.Provider, { value: { config }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-chart": chartId,
      ref,
      className: cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartStyle, { id: chartId, config }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { children })
      ]
    }
  ) });
});
ChartContainer.displayName = "Chart";
const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(([, config2]) => config2.theme || config2.color);
  if (!colorConfig.length) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "style",
    {
      dangerouslySetInnerHTML: {
        __html: Object.entries(THEMES).map(
          ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig.map(([key, itemConfig]) => {
            const color = itemConfig.theme?.[theme] || itemConfig.color;
            return color ? `  --color-${key}: ${color};` : null;
          }).join("\n")}
}
`
        ).join("\n")
      }
    }
  );
};
const ChartTooltip = Tooltip;
const ChartTooltipContent = reactExports.forwardRef(
  ({
    active,
    payload,
    className,
    indicator = "dot",
    hideLabel = false,
    hideIndicator = false,
    label,
    labelFormatter,
    labelClassName,
    formatter,
    color,
    nameKey,
    labelKey
  }, ref) => {
    const { config } = useChart();
    const tooltipLabel = reactExports.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }
      const [item] = payload;
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value = !labelKey && typeof label === "string" ? config[label]?.label || label : itemConfig?.label;
      if (labelFormatter) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("font-medium", labelClassName), children: labelFormatter(value, payload) });
      }
      if (!value) {
        return null;
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("font-medium", labelClassName), children: value });
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);
    if (!active || !payload?.length) {
      return null;
    }
    const nestLabel = payload.length === 1 && indicator !== "dot";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref,
        className: cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        ),
        children: [
          !nestLabel ? tooltipLabel : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-1.5", children: payload.filter((item) => item.type !== "none").map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color || item.payload.fill || item.color;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                ),
                children: formatter && item?.value !== void 0 && item.name ? formatter(item.value, item.name, item, index, item.payload) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  itemConfig?.icon ? /* @__PURE__ */ jsxRuntimeExports.jsx(itemConfig.icon, {}) : !hideIndicator && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: cn(
                        "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                        {
                          "h-2.5 w-2.5": indicator === "dot",
                          "w-1": indicator === "line",
                          "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                          "my-0.5": nestLabel && indicator === "dashed"
                        }
                      ),
                      style: {
                        "--color-bg": indicatorColor,
                        "--color-border": indicatorColor
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      ),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-1.5", children: [
                          nestLabel ? tooltipLabel : null,
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: itemConfig?.label || item.name })
                        ] }),
                        item.value && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-medium tabular-nums text-foreground", children: item.value.toLocaleString() })
                      ]
                    }
                  )
                ] })
              },
              item.dataKey
            );
          }) })
        ]
      }
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltip";
const ChartLegendContent = reactExports.forwardRef(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart();
  if (!payload?.length) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref,
      className: cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      ),
      children: payload.filter((item) => item.type !== "none").map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            ),
            children: [
              itemConfig?.icon && !hideIcon ? /* @__PURE__ */ jsxRuntimeExports.jsx(itemConfig.icon, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-2 w-2 shrink-0 rounded-[2px]",
                  style: {
                    backgroundColor: item.color
                  }
                }
              ),
              itemConfig?.label
            ]
          },
          item.value
        );
      })
    }
  );
});
ChartLegendContent.displayName = "ChartLegend";
function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) {
    return void 0;
  }
  const payloadPayload = "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? payload.payload : void 0;
  let configLabelKey = key;
  if (key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key];
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key];
  }
  return configLabelKey in config ? config[configLabelKey] : config[key];
}
const getOrganiserAnalytics = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("b374f0e1177d21e83f921ddd6af739a326dcf0d7c8aea2720c08415b85262d78"));
const getSponsorAnalytics = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("1697b24b19a571c5e9ac8a669efd51f073991d65c346c5a77c07b658723cbe82"));
const getReferralAnalytics = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("a849a6fcb8d812bdd92e73dc82ec4bed238b238414b5ca259f01616bb381240c"));
const getMediaAnalytics = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("33ec8adbb57c7ebb7090a9284f1b7fc428fc7c681695e142343976ad2db935f0"));
const getAdminAnalytics = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("52a55324d8a6e06dd67ad67256b022a8674c46d777604cbee675d6fb01db9853"));
const CHART_COLORS = ["hsl(271 45% 44%)", "hsl(160 100% 25%)", "hsl(271 45% 60%)", "hsl(160 60% 40%)", "hsl(220 20% 50%)", "hsl(35 90% 50%)"];
function fmtMonth(m) {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1).toLocaleString("en", { month: "short" });
}
function BarPanel({ title, description, data, dataKey, nameKey }) {
  if (!data.length) return null;
  const config = { [dataKey]: { label: title, color: CHART_COLORS[0] } };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPanel, { title, description, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config, className: "h-[260px] w-full aspect-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data, margin: { left: 0, right: 8, top: 8, bottom: 0 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false, strokeDasharray: "3 3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: nameKey, tickLine: false, axisLine: false, tick: { fontSize: 11 } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tickLine: false, axisLine: false, width: 32, tick: { fontSize: 11 } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltip, { content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey, fill: CHART_COLORS[0], radius: [4, 4, 0, 0] })
  ] }) }) });
}
function LinePanel({ title, description, data }) {
  const config = { count: { label: "Count", color: CHART_COLORS[1] } };
  const chartData = data.map((d) => ({ ...d, label: fmtMonth(d.month) }));
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPanel, { title, description, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config, className: "h-[260px] w-full aspect-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: chartData, margin: { left: 0, right: 8, top: 8, bottom: 0 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false, strokeDasharray: "3 3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", tickLine: false, axisLine: false, tick: { fontSize: 11 } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tickLine: false, axisLine: false, width: 32, tick: { fontSize: 11 }, allowDecimals: false }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltip, { content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "count", stroke: CHART_COLORS[1], strokeWidth: 2, dot: { r: 3 } })
  ] }) }) });
}
function MultiBarPanel({ title, description, data }) {
  if (!data.length) return null;
  const config = {
    views: { label: "Views", color: CHART_COLORS[0] },
    saves: { label: "Saves", color: CHART_COLORS[1] },
    inquiries: { label: "Inquiries", color: CHART_COLORS[2] }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPanel, { title, description, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config, className: "h-[280px] w-full aspect-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data, margin: { left: 0, right: 8, top: 8, bottom: 0 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false, strokeDasharray: "3 3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", tickLine: false, axisLine: false, tick: { fontSize: 10 } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tickLine: false, axisLine: false, width: 32, tick: { fontSize: 11 } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltip, { content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "views", fill: CHART_COLORS[0], radius: [2, 2, 0, 0] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "saves", fill: CHART_COLORS[1], radius: [2, 2, 0, 0] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "inquiries", fill: CHART_COLORS[2], radius: [2, 2, 0, 0] })
  ] }) }) });
}
function PiePanel({ title, description, data, nameKey, valueKey }) {
  if (!data.length) return null;
  const config = Object.fromEntries(data.map((d, i) => [String(d[nameKey]), { label: String(d[nameKey]), color: CHART_COLORS[i % CHART_COLORS.length] }]));
  return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPanel, { title, description, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config, className: "h-[260px] w-full aspect-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltip, { content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pie, { data, dataKey: valueKey, nameKey, cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 90, paddingAngle: 2, children: data.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: CHART_COLORS[i % CHART_COLORS.length] }, i)) })
  ] }) }) });
}
function OrganiserAnalyticsPanel() {
  const fetch = useServerFn(getOrganiserAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", "organiser"], queryFn: () => fetch() });
  if (isLoading || !data) return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardLoading, { label: "Loading analytics…" });
  const s = data.summary;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Eye, label: "Total profile views", value: s.totalViews }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Bookmark, label: "Times saved", value: s.totalSaves }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: MessageSquare, label: "Commitment inquiries", value: s.totalInquiries }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ChartColumn, label: "Closed deals", value: s.closedDeals }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ShieldCheck, label: "IGE vetted events", value: s.vettedEvents })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MultiBarPanel, { title: "Event engagement", description: "Views, saves, and inquiries per live listing", data: data.eventEngagement }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LinePanel, { title: "Inquiries over time", description: "Commitment forms received (last 6 months)", data: data.inquiriesOverTime }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BarPanel, { title: "Deal pipeline", description: "Deals by current stage", data: data.dealPipeline, dataKey: "count", nameKey: "status" })
    ] })
  ] });
}
function SponsorAnalyticsPanel() {
  const fetch = useServerFn(getSponsorAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", "sponsor"], queryFn: () => fetch() });
  if (isLoading || !data) return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardLoading, { label: "Loading analytics…" });
  const s = data.summary;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Inbox, label: "Commitments submitted", value: s.commitments }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Bookmark, label: "Events saved", value: s.savedEvents }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: TrendingUp, label: "Sectors explored", value: s.sectorsExplored })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LinePanel, { title: "Commitments over time", data: data.commitmentsOverTime }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LinePanel, { title: "Saves over time", data: data.savesOverTime }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PiePanel, { title: "Interest by sector", data: data.sectorBreakdown, nameKey: "sector", valueKey: "count" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BarPanel, { title: "Budget ceiling by currency", data: data.budgetByCurrency, dataKey: "total", nameKey: "currency" })
    ] })
  ] });
}
function ReferralAnalyticsPanel() {
  const fetch = useServerFn(getReferralAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", "referral"], queryFn: () => fetch() });
  if (isLoading || !data) return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardLoading, { label: "Loading analytics…" });
  const s = data.summary;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Link2, label: "Active links", value: s.links }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: TrendingUp, label: "Total clicks", value: s.clicks }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ChartColumn, label: "Conversions", value: s.conversions }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Wallet, label: "Earned (USD)", value: `$${s.earned.toFixed(0)}` })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BarPanel, { title: "Clicks by referral link", data: data.clicksByLink, dataKey: "clicks", nameKey: "name" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PiePanel, { title: "Commission breakdown (USD)", data: data.commissionBreakdown, nameKey: "label", valueKey: "value" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LinePanel, { title: "Attributed deals over time", data: data.dealsOverTime })
    ] })
  ] });
}
function MediaAnalyticsPanel() {
  const fetch = useServerFn(getMediaAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", "media"], queryFn: () => fetch() });
  if (isLoading || !data) return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardLoading, { label: "Loading analytics…" });
  const s = data.summary;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Newspaper, label: "Coverage requests", value: s.requests }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Bookmark, label: "Saved events", value: s.saved }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ShieldCheck, label: "Approved requests", value: s.approved })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PiePanel, { title: "Requests by status", data: data.requestsByStatus, nameKey: "status", valueKey: "count" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LinePanel, { title: "Requests over time", data: data.requestsOverTime }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BarPanel, { title: "Sector interest", data: data.sectorInterest, dataKey: "count", nameKey: "sector" })
    ] })
  ] });
}
function AdminAnalyticsPanel() {
  const fetch = useServerFn(getAdminAnalytics);
  const { data, isLoading } = useQuery({ queryKey: ["analytics", "admin"], queryFn: () => fetch() });
  if (isLoading || !data) return /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardLoading, { label: "Loading analytics…" });
  const s = data.summary;
  const gmvConfig = { gmv: { label: "GMV (USD)", color: CHART_COLORS[0] } };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ShieldCheck, label: "Total events", value: s.totalEvents }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: TrendingUp, label: "Live listings", value: s.liveEvents }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: DollarSign, label: "Platform GMV", value: `$${s.gmv.toLocaleString()}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Users, label: "Waitlist signups", value: s.waitlist })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPanel, { title: "GMV over time", description: "Closed deal value (USD, last 6 months)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: gmvConfig, className: "h-[260px] w-full aspect-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: data.gmvOverTime.map((d) => ({ ...d, label: fmtMonth(d.month) })), margin: { left: 0, right: 8, top: 8, bottom: 0 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false, strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "label", tickLine: false, axisLine: false, tick: { fontSize: 11 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tickLine: false, axisLine: false, width: 48, tick: { fontSize: 11 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltip, { content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "gmv", stroke: CHART_COLORS[0], strokeWidth: 2, dot: { r: 3 } })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LinePanel, { title: "Waitlist growth", data: data.waitlistOverTime }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BarPanel, { title: "Vetting pipeline", data: data.vettingPipeline, dataKey: "count", nameKey: "status" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BarPanel, { title: "Deal pipeline", data: data.dealPipeline, dataKey: "count", nameKey: "status" })
    ] })
  ] });
}
export {
  AdminAnalyticsPanel as A,
  DashboardEmpty as D,
  MediaAnalyticsPanel as M,
  OrganiserAnalyticsPanel as O,
  ReferralAnalyticsPanel as R,
  SponsorAnalyticsPanel as S,
  VettingTimeline as V,
  DashboardHeader as a,
  DashboardLoading as b,
  DashboardPanel as c,
  DashboardTabs as d,
  StatCard as e,
  fmtDateRange as f
};
