import { ReactNode, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, LayoutDashboard, CalendarRange, ShieldCheck, Handshake, Globe2, MessageSquare, DollarSign, Briefcase, Inbox, Bell } from "lucide-react";
import logo from "@/assets/ige-logo.jpeg";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, signOut } = useAuth();
  const loc = useLocation();
  const isAdmin = roles.includes("abw_admin") || roles.includes("super_admin");
  const isOrganiser = roles.includes("organiser");
  const isSponsor = roles.includes("sponsor");
  const isReferral = roles.includes("referral_partner");

  const nav: { to: string; label: string; icon: any; show: boolean }[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/marketplace", label: "Marketplace", icon: Globe2, show: !isAdmin },
    { to: "/messages", label: "Messages", icon: MessageSquare, show: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="IGE" className="h-8 w-8 rounded-md object-cover" />
              <span className="font-display text-base font-bold">IGE</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.filter((n) => n.show).map((n) => {
                const active = loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      active ? "bg-brand-soft text-primary-deep" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <n.icon className="h-3.5 w-3.5" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <NotificationsBell />
            <span className="hidden text-muted-foreground sm:inline">{user?.email}</span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}

function NotificationsBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, read, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unread = (items ?? []).filter((n: any) => !n.read).length;

  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications").update({ read: true } as never).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open && unread) markAllRead(); }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-bold">Notifications</span>
              {unread > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(items ?? []).length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</div>
              ) : (
                (items ?? []).map((n: any) => (
                  <div key={n.id} className={`border-b border-border px-4 py-3 ${n.read ? "" : "bg-brand-soft/40"}`}>
                    <div className="text-sm font-semibold text-foreground">{n.title}</div>
                    {n.body && <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>}
                    <div className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-muted text-foreground",
    under_review: "bg-amber-100 text-amber-900",
    revision_requested: "bg-red-100 text-red-900",
    approved: "bg-emerald-100 text-emerald-900",
    listed: "bg-emerald-100 text-emerald-900",
    rejected: "bg-red-100 text-red-900",
    closed: "bg-foreground/10 text-foreground",
    archived: "bg-foreground/10 text-foreground",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-muted"}`}>
      {label}
    </span>
  );
}
