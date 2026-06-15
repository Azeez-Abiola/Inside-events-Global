import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/ige-logo.jpeg";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspaceNav } from "@/lib/workspace-nav";
import { ThemeToggle } from "@/components/theme-toggle";
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

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, signOut } = useAuth();
  const loc = useLocation();
  const nav = getWorkspaceNav(roles);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      setSignOutOpen(false);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 bg-brand-gradient-diag text-white shadow-soft">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt="IGE" className="h-8 w-8 rounded-md object-cover ring-1 ring-white/20" />
            <span className="font-display text-base font-bold hidden sm:inline">IGE</span>
          </Link>

          <nav className="hidden lg:flex items-center justify-center gap-0.5 flex-wrap">
            {nav.map((n) => {
              const active = loc.pathname === n.to || (n.to !== "/dashboard" && loc.pathname.startsWith(n.to + "/")) || (n.to === "/dashboard" && loc.pathname === "/dashboard");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    active ? "bg-white/20 text-white shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <n.icon className="h-3.5 w-3.5 shrink-0" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2 text-sm shrink-0">
            <NotificationsBell />
            <ThemeToggle />
            <span className="hidden text-white/80 md:inline max-w-[140px] truncate text-xs">{user?.email}</span>
            <button
              onClick={() => setSignOutOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
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

        {/* Mobile nav scroll */}
        <nav className="flex lg:hidden gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 scrollbar-none">
          {nav.map((n) => {
            const active = loc.pathname === n.to || (n.to !== "/dashboard" && loc.pathname.startsWith(n.to + "/")) || (n.to === "/dashboard" && loc.pathname === "/dashboard");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  active ? "bg-white/20 text-white" : "text-white/75"
                }`}
              >
                <n.icon className="h-3 w-3" />
                {n.label}
              </Link>
            );
          })}
        </nav>
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
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors"
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
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl">
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
