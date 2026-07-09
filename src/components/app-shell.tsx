import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Bell, Loader2, Menu, Search, Settings } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/ige-logo.jpeg";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspaceNav } from "@/lib/workspace-nav";
import { greetingName, roleLabel } from "@/lib/dashboard-meta";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function isNavActive(pathname: string, to: string) {
  if (to === "/marketplace") return pathname === "/marketplace" || pathname.startsWith("/marketplace/");
  if (to === "/dashboard") return pathname === "/dashboard";
  return pathname === to || pathname.startsWith(to + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, signOut } = useAuth();
  const loc = useLocation();
  const nav = getWorkspaceNav(roles);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [loc.pathname]);

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      setSignOutOpen(false);
    } finally {
      setSigningOut(false);
    }
  }

  const sidebar = (
    <aside className="flex h-full w-[248px] shrink-0 flex-col bg-card">
      {/* Voom: logo row */}
      <div className="flex h-[72px] items-center gap-3 px-6">
        <img src={logo} alt="IGE" className="h-9 w-9 rounded-xl object-cover" />
        <span className="font-display text-[15px] font-bold text-foreground">Inside Global Events</span>
      </div>

      {/* Voom: flat nav + left accent bar on active item */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map((n) => {
          const active = isNavActive(loc.pathname, n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "relative flex items-center gap-3 rounded-lg py-2.5 pl-5 pr-3 text-[13px] font-medium transition-colors",
                active
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <n.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground")} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      {/* Voom: marketplace CTA card + sign out */}
      <div className="space-y-2 p-4">
        <div className="rounded-2xl bg-brand-soft p-4">
          <p className="text-xs font-semibold text-primary-deep">Join the waitlist</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Be first to know when the IGE marketplace opens.</p>
          <Link
            to="/waitlist"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-brand-gradient py-2 text-xs font-bold text-white"
          >
            Join waitlist
          </Link>
        </div>
        <button
          onClick={() => setSignOutOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );

  const displayName = greetingName(user?.email, user?.user_metadata);
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-dashboard-canvas">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-h-screen">
        <div className="hidden md:block sticky top-0 h-screen border-r border-border/50">{sidebar}</div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Voom: white top bar — centered search, utilities right */}
          <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-border/50 bg-card px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="mx-auto flex w-full max-w-lg flex-1 items-center">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search anything…"
                  className="h-11 w-full rounded-full border border-border/60 bg-muted/40 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:bg-card focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <NotificationsBell />
              <ThemeToggle />
              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted/60 sm:inline-flex"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <div className="ml-1 flex items-center gap-2.5 pl-2">
                <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                  <AvatarFallback className="bg-brand-soft text-xs font-bold text-primary-deep">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 lg:block">
                  <div className="truncate text-sm font-semibold text-foreground">{displayName}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{roleLabel(roles)}</div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will be returned to the login screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={signingOut}>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmSignOut();
              }}
              disabled={signingOut}
            >
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, sign out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
        .select("id, type, title, body, read, created_at, data")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as {
            type?: string;
            title?: string;
            body?: string;
            data?: { thread_id?: string };
          };
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
          qc.invalidateQueries({ queryKey: ["threads"] });
          const desc = n.body?.slice(0, 120);
          if (n.type === "new_message") {
            toast.message(n.title ?? "New message", { description: desc });
          } else {
            toast.info(n.title ?? "Notification", { description: desc });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

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
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted/60"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-bold">Notifications</span>
              {unread > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(items ?? []).length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</div>
              ) : (
                (items ?? []).map((n: any) => {
                  const threadId = n.data?.thread_id as string | undefined;
                  const content = (
                    <>
                      <div className="text-sm font-semibold">{n.title}</div>
                      {n.body && <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>}
                      <div className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                    </>
                  );
                  return (
                    <div key={n.id} className={`border-b border-border px-4 py-3 ${n.read ? "" : "bg-brand-soft/40"}`}>
                      {threadId ? (
                        <Link to="/messages" search={{ thread: threadId }} onClick={() => setOpen(false)} className="block hover:opacity-80">
                          {content}
                        </Link>
                      ) : content}
                    </div>
                  );
                })
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
    submitted: "bg-primary/10 text-primary-deep",
    under_review: "bg-amber-100 text-amber-900",
    revision_requested: "bg-red-100 text-red-900",
    approved: "bg-secondary/15 text-secondary-deep",
    listed: "bg-secondary/15 text-secondary-deep",
    rejected: "bg-red-100 text-red-900",
    closed: "bg-foreground/10 text-foreground",
    archived: "bg-foreground/10 text-foreground",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-muted"}`}>
      {label}
    </span>
  );
}
