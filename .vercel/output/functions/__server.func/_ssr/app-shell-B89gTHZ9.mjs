import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useLocation, L as Link } from "../_libs/tanstack__react-router.mjs";
import { b as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useAuth, k as logo } from "./router-4-w4Upb_.mjs";
import { s as supabase } from "./client-BhermGBt.mjs";
import { h as CalendarRange, L as LayoutDashboard, E as Earth, H as Handshake, a2 as ShieldCheck, D as DollarSign, R as MessageSquare, M as LogOut, B as Bell } from "../_libs/lucide-react.mjs";
function AppShell({ children }) {
  const { user, roles, signOut } = useAuth();
  const loc = useLocation();
  const isAdmin = roles.includes("abw_admin") || roles.includes("super_admin");
  const isOrganiser = roles.includes("organiser");
  const isSponsor = roles.includes("sponsor");
  const isReferral = roles.includes("referral_partner");
  const isMedia = roles.includes("media_partner");
  const nav = [
    {
      to: "/dashboard",
      label: isOrganiser && !isAdmin ? "My events" : "Dashboard",
      icon: isOrganiser && !isAdmin ? CalendarRange : LayoutDashboard,
      show: true
    },
    { to: "/marketplace", label: "Marketplace", icon: Earth, show: isAdmin || isSponsor || isReferral || isMedia },
    { to: "/referrals", label: "Referrals", icon: Handshake, show: isReferral && !isAdmin },
    { to: "/admin/vetting", label: "Vetting", icon: ShieldCheck, show: isAdmin },
    { to: "/admin/revenue", label: "Revenue", icon: DollarSign, show: isAdmin },
    { to: "/messages", label: "Messages", icon: MessageSquare, show: true }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex h-16 max-w-7xl items-center justify-between px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logo, alt: "IGE", className: "h-8 w-8 rounded-md object-cover" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-base font-bold", children: "IGE" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "hidden items-center gap-1 md:flex", children: nav.filter((n) => n.show).map((n) => {
          const active = loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: n.to,
              className: `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-brand-soft text-primary-deep" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(n.icon, { className: "h-3.5 w-3.5" }),
                n.label
              ]
            },
            n.to
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationsBell, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden text-muted-foreground sm:inline", children: user?.email }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: signOut,
            className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-3.5 w-3.5" }),
              " Sign out"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "mx-auto max-w-7xl px-6 py-10", children })
  ] });
}
function NotificationsBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = reactExports.useState(false);
  const { data: items } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("id, type, title, body, read, created_at").order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 3e4
  });
  const unread = (items ?? []).filter((n) => !n.read).length;
  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  }
  if (!user) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => {
          setOpen((o) => !o);
          if (!open && unread) markAllRead();
        },
        className: "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted",
        "aria-label": "Notifications",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
          unread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground", children: unread > 9 ? "9+" : unread })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-40", onClick: () => setOpen(false) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: "Notifications" }),
          unread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: markAllRead, className: "text-xs text-primary hover:underline", children: "Mark all read" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-96 overflow-y-auto", children: (items ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-10 text-center text-sm text-muted-foreground", children: "No notifications yet." }) : (items ?? []).map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `border-b border-border px-4 py-3 ${n.read ? "" : "bg-brand-soft/40"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-foreground", children: n.title }),
          n.body && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs text-muted-foreground", children: n.body }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[10px] text-muted-foreground", children: new Date(n.created_at).toLocaleString() })
        ] }, n.id)) })
      ] })
    ] })
  ] });
}
function StatusBadge({ status }) {
  const map = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-muted text-foreground",
    under_review: "bg-amber-100 text-amber-900",
    revision_requested: "bg-red-100 text-red-900",
    approved: "bg-emerald-100 text-emerald-900",
    listed: "bg-emerald-100 text-emerald-900",
    rejected: "bg-red-100 text-red-900",
    closed: "bg-foreground/10 text-foreground",
    archived: "bg-foreground/10 text-foreground"
  };
  const label = status.replace(/_/g, " ");
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-muted"}`, children: label });
}
export {
  AppShell as A,
  StatusBadge as S
};
