import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Search, ShieldOff, ShieldCheck, UserCog } from "lucide-react";
import { listPlatformUsers, setUserSuspended } from "@/lib/admin.functions";
import { DashboardPanel, DashboardTable, DashboardTableHead } from "@/components/dashboards/dashboard-shell";
import { StatusPill } from "@/components/dashboards/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { TextArea } from "@/components/signup/profile-fields";

type PlatformUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  roles: string[];
};

export function AdminUsersPanel() {
  const qc = useQueryClient();
  const fetch = useServerFn(listPlatformUsers);
  const suspend = useServerFn(setUserSuspended);
  const [search, setSearch] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<PlatformUser | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetch(),
  });

  const mut = useMutation({
    mutationFn: (v: { user_id: string; suspended: boolean; reason?: string }) =>
      suspend({ data: v }),
    onSuccess: (_res, vars) => {
      toast.success(vars.suspended ? "User suspended" : "Suspension lifted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setSuspendTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const users = data?.users ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.display_name?.toLowerCase().includes(q) ||
        u.roles.some((r) => r.includes(q)),
    );
  }, [users, search]);

  const suspendedCount = users.filter((u) => u.is_suspended).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total users</div>
          <div className="mt-1 font-display text-2xl font-bold">{users.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suspended</div>
          <div className="mt-1 font-display text-2xl font-bold text-destructive">{suspendedCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active</div>
          <div className="mt-1 font-display text-2xl font-bold text-emerald-700">{users.length - suspendedCount}</div>
        </div>
      </div>

      <DashboardPanel title="User management" description="View accounts, roles, and suspend users who breach platform standards (PRD §5.6 admin)." bodyClassName="p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, name, or role…"
              className="pl-9"
            />
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <DashboardTable className="min-w-[800px]">
            <DashboardTableHead>
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{u.display_name ?? u.email?.split("@")[0] ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <StatusPill key={r} status={r} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {u.is_suspended ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                        <ShieldOff className="h-3 w-3" /> Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <ShieldCheck className="h-3 w-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant={u.is_suspended ? "outline" : "destructive"}
                      disabled={mut.isPending || u.roles.includes("super_admin")}
                      onClick={() => {
                        if (u.is_suspended) {
                          mut.mutate({ user_id: u.id, suspended: false });
                        } else {
                          setSuspendTarget(u);
                          setReason("");
                        }
                      }}
                    >
                      {u.is_suspended ? "Reinstate" : "Suspend"}
                    </Button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No users match your search.</td>
                </tr>
              )}
            </tbody>
          </DashboardTable>
        )}
      </DashboardPanel>

      <Sheet open={!!suspendTarget} onOpenChange={(o) => { if (!o) setSuspendTarget(null); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" /> Suspend user
            </SheetTitle>
            <SheetDescription>{suspendTarget?.email}</SheetDescription>
          </SheetHeader>
          {suspendTarget && (
            <div className="mt-6 space-y-4">
              <TextArea
                label="Suspension reason (shown to user)"
                rows={3}
                value={reason}
                onChange={setReason}
                placeholder="Breach of vetting standards, fraudulent referral activity…"
              />
              <Button
                variant="destructive"
                className="w-full"
                disabled={mut.isPending}
                onClick={() =>
                  mut.mutate({
                    user_id: suspendTarget.id,
                    suspended: true,
                    reason: reason.trim() || "Suspended by IGE admin",
                  })
                }
              >
                Confirm suspension
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
