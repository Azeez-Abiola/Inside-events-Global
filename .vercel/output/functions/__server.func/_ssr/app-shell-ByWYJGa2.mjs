import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useLocation, L as Link } from "../_libs/tanstack__react-router.mjs";
import { b as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useAuth, m as logo } from "./router-BT27-cf7.mjs";
import { s as supabase } from "./client-gmdRS3ZG.mjs";
import { A as AlertDialog, c as AlertDialogContent, f as AlertDialogHeader, g as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, b as AlertDialogCancel, a as AlertDialogAction } from "./alert-dialog-BrzSSKxW.mjs";
import { N as LogOut, M as LoaderCircle, B as Bell, a5 as Sun, T as Moon, L as LayoutDashboard, a2 as ShieldCheck, ad as Users, D as DollarSign, a3 as SlidersHorizontal, h as ChartColumn, g as CalendarRange, a8 as TrendingUp, I as Inbox, c as Bookmark, o as Compass, H as Handshake, a0 as Send, S as MessageSquare } from "../_libs/lucide-react.mjs";
function getWorkspaceNav(roles) {
  const r = new Set(roles);
  const isAdmin = r.has("abw_admin") || r.has("super_admin");
  const items = [];
  if (isAdmin) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/vetting", label: "Event queue", icon: ShieldCheck },
      { to: "/dashboard/submissions", label: "Submissions", icon: Users },
      { to: "/dashboard/revenue", label: "Revenue & deals", icon: DollarSign },
      { to: "/dashboard/controls", label: "Fraud & rates", icon: SlidersHorizontal },
      { to: "/dashboard/analytics", label: "Analytics", icon: ChartColumn }
    );
  } else if (r.has("organiser")) {
    items.push(
      { to: "/dashboard", label: "My events", icon: CalendarRange },
      { to: "/dashboard/pipeline", label: "Pipeline", icon: TrendingUp },
      { to: "/dashboard/analytics", label: "Analytics", icon: ChartColumn }
    );
  } else if (r.has("sponsor")) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/commitments", label: "My commitments", icon: Inbox },
      { to: "/dashboard/saved", label: "Saved events", icon: Bookmark },
      { to: "/dashboard/discover", label: "Discover", icon: Compass },
      { to: "/dashboard/analytics", label: "Analytics", icon: ChartColumn }
    );
  } else if (r.has("referral_partner")) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/referrals", label: "My referrals", icon: Handshake },
      { to: "/dashboard/deals", label: "Commission pipeline", icon: TrendingUp },
      { to: "/dashboard/analytics", label: "Analytics", icon: ChartColumn }
    );
  } else if (r.has("media_partner")) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/explore", label: "Explore", icon: Compass },
      { to: "/dashboard/saved", label: "Saved", icon: Bookmark },
      { to: "/dashboard/requests", label: "My requests", icon: Send },
      { to: "/dashboard/analytics", label: "Analytics", icon: ChartColumn }
    );
  } else {
    items.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
  }
  items.push({ to: "/messages", label: "Messages", icon: MessageSquare });
  return items;
}
const STORAGE_KEY = "ige-theme";
function ThemeToggle() {
  const [dark, setDark] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || !stored && prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick: toggle,
      className: "inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20",
      "aria-label": dark ? "Switch to light mode" : "Switch to dark mode",
      children: dark ? /* @__PURE__ */ jsxRuntimeExports.jsx(Sun, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { className: "h-4 w-4" })
    }
  );
}
function AppShell({ children }) {
  const { user, roles, signOut } = useAuth();
  const loc = useLocation();
  const nav = getWorkspaceNav(roles);
  const [signOutOpen, setSignOutOpen] = reactExports.useState(false);
  const [signingOut, setSigningOut] = reactExports.useState(false);
  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      setSignOutOpen(false);
    } finally {
      setSigningOut(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "border-b border-white/10 bg-brand-gradient-diag text-white shadow-soft", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard", className: "flex items-center gap-2.5 shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logo, alt: "IGE", className: "h-8 w-8 rounded-md object-cover ring-1 ring-white/20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-base font-bold hidden sm:inline", children: "IGE" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "hidden lg:flex items-center justify-center gap-0.5 flex-wrap", children: nav.map((n) => {
          const active = loc.pathname === n.to || n.to !== "/dashboard" && loc.pathname.startsWith(n.to + "/") || n.to === "/dashboard" && loc.pathname === "/dashboard";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: n.to,
              className: `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${active ? "bg-white/20 text-white shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(n.icon, { className: "h-3.5 w-3.5 shrink-0" }),
                n.label
              ]
            },
            n.to
          );
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2 text-sm shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationsBell, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ThemeToggle, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden text-white/80 md:inline max-w-[140px] truncate text-xs", children: user?.email }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setSignOutOpen(true),
              className: "inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-3.5 w-3.5" }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Sign out" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: signOutOpen, onOpenChange: setSignOutOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Sign out?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "Are you sure you want to sign out? You will be returned to the IGE homepage." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { disabled: signingOut, children: "No" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            AlertDialogAction,
            {
              onClick: (e) => {
                e.preventDefault();
                void confirmSignOut();
              },
              disabled: signingOut,
              children: signingOut ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Yes, sign out"
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex lg:hidden gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 scrollbar-none", children: nav.map((n) => {
        const active = loc.pathname === n.to || n.to !== "/dashboard" && loc.pathname.startsWith(n.to + "/") || n.to === "/dashboard" && loc.pathname === "/dashboard";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: n.to,
            className: `inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${active ? "bg-white/20 text-white" : "text-white/75"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(n.icon, { className: "h-3 w-3" }),
              n.label
            ]
          },
          n.to
        );
      }) })
    ] }),
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
      const { data } = await supabase.from("notifications").select("id, type, title, body, read, created_at, data").order("created_at", { ascending: false }).limit(20);
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
        className: "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors",
        "aria-label": "Notifications",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
          unread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground", children: unread > 9 ? "9+" : unread })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-40", onClick: () => setOpen(false) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: "Notifications" }),
          unread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: markAllRead, className: "text-xs text-primary hover:underline", children: "Mark all read" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-96 overflow-y-auto", children: (items ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-10 text-center text-sm text-muted-foreground", children: "No notifications yet." }) : (items ?? []).map((n) => {
          const threadId = n.data?.thread_id;
          const content = /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: n.title }),
            n.body && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs text-muted-foreground", children: n.body }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[10px] text-muted-foreground", children: new Date(n.created_at).toLocaleString() })
          ] });
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `border-b border-border px-4 py-3 ${n.read ? "" : "bg-brand-soft/40"}`, children: threadId ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/messages", search: { thread: threadId }, onClick: () => setOpen(false), className: "block hover:opacity-80", children: content }) : content }, n.id);
        }) })
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
