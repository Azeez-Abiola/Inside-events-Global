import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldOff, ShieldCheck, UserCog, Clock } from "lucide-react";
import { DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { listPlatformUsers, setUserSuspended, getPlatformUserDetail, setUserApproved } from "@/lib/admin.functions";
import { DashboardPanel, DashboardTable, DashboardTableHead, DashboardTabs } from "@/components/dashboards/dashboard-shell";
import { DashboardDataToolbar } from "@/components/dashboards/dashboard-data-toolbar";
import { StatusPill } from "@/components/dashboards/shared";
import { Button } from "@/components/ui/button";
import { useTableFilters } from "@/hooks/use-table-filters";
import { useAuth } from "@/lib/auth-context";
import { isSuperAdmin } from "@/lib/admin-permissions";
import { datedCsvFilename, downloadCsv } from "@/lib/csv-export";
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

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending approval" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Deactivated" },
] as const;

type StatusFilter = (typeof STATUS_TABS)[number]["id"];

function userStatusLabel(u: PlatformUser) {
  if (u.is_suspended) return "deactivated";
  if (!u.is_active) return "pending";
  return "active";
}

function exportUsersCsv(users: PlatformUser[]) {
  downloadCsv(
    datedCsvFilename("ige-users"),
    ["email", "display_name", "roles", "status", "joined", "last_login"],
    users.map((u) => [
      u.email ?? "",
      u.display_name ?? "",
      u.roles.join("; "),
      userStatusLabel(u),
      u.created_at,
      u.last_login_at ?? "",
    ]),
  );
}

function humanizeKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatProfileValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function UserDetailSheet({
  user,
  onClose,
  canManage,
}: {
  user: PlatformUser | null;
  onClose: () => void;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const fetchDetail = useServerFn(getPlatformUserDetail);
  const approve = useServerFn(setUserApproved);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-detail", user?.id],
    queryFn: () => fetchDetail({ data: { user_id: user!.id } }),
    enabled: !!user?.id,
  });

  const approveMut = useMutation({
    mutationFn: (approved: boolean) => approve({ data: { user_id: user!.id, approved } }),
    onSuccess: (_res, approved) => {
      toast.success(approved ? "User approved" : "User set to pending");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-detail", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleData =
    data?.role === "organiser"
      ? data.organiser
      : data?.role === "sponsor"
        ? data.sponsor
        : data?.role === "referral_partner"
          ? data.referral
          : data?.media;

  return (
    <Sheet open={!!user} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{user?.display_name ?? user?.email ?? "User"}</SheetTitle>
          <SheetDescription>{user?.email}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-8 text-sm text-muted-foreground">Loading profile…</div>
        ) : data ? (
          <div className="mt-6 space-y-6">
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</h4>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Roles</dt><dd className="font-medium">{data.roles.join(", ") || "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Joined</dt><dd>{new Date(data.profile.created_at).toLocaleString()}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Last login</dt><dd>{data.profile.last_login_at ? new Date(data.profile.last_login_at).toLocaleString() : "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Profile complete</dt><dd>{data.profile.profile_complete ?? 0}%</dd></div>
              </dl>
            </section>

            {roleData && (
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role profile</h4>
                <dl className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20">
                  {Object.entries(roleData as Record<string, unknown>)
                    .filter(([k]) => k !== "user_id" && k !== "created_at" && k !== "updated_at")
                    .map(([key, value]) => (
                      <div key={key} className="px-4 py-3">
                        <dt className="text-xs font-medium text-muted-foreground">{humanizeKey(key)}</dt>
                        <dd className="mt-1 text-sm text-foreground">{formatProfileValue(value)}</dd>
                      </div>
                    ))}
                </dl>
              </section>
            )}

            {canManage && user && !user.roles.includes("super_admin") && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {!user.is_active && !user.is_suspended && (
                  <Button disabled={approveMut.isPending} onClick={() => approveMut.mutate(true)}>
                    Approve account
                  </Button>
                )}
                {user.is_active && !user.is_suspended && (
                  <Button variant="outline" disabled={approveMut.isPending} onClick={() => approveMut.mutate(false)}>
                    Set pending approval
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function AdminUsersPanel() {
  const qc = useQueryClient();
  const { roles } = useAuth();
  const canSuspend = isSuperAdmin(roles);
  const canApprove = roles.includes("abw_admin") || roles.includes("super_admin");
  const fetch = useServerFn(listPlatformUsers);
  const suspend = useServerFn(setUserSuspended);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [suspendTarget, setSuspendTarget] = useState<PlatformUser | null>(null);
  const [selected, setSelected] = useState<PlatformUser | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetch(),
  });

  const mut = useMutation({
    mutationFn: (v: { user_id: string; suspended: boolean; reason?: string }) =>
      suspend({ data: v }),
    onSuccess: (_res, vars) => {
      toast.success(vars.suspended ? "Account deactivated" : "Account reactivated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setSuspendTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const users = data?.users ?? [];

  const counts = useMemo(() => ({
    all: users.length,
    pending: users.filter((u) => !u.is_active && !u.is_suspended).length,
    active: users.filter((u) => u.is_active && !u.is_suspended).length,
    suspended: users.filter((u) => u.is_suspended).length,
  }), [users]);

  const filtered = useTableFilters({
    rows: users,
    searchText: search,
    statusFilter,
    search: (u) => [u.email, u.display_name, ...u.roles].filter(Boolean).join(" "),
    matchStatus: (u, filter) => {
      if (filter === "pending") return !u.is_active && !u.is_suspended;
      if (filter === "active") return u.is_active && !u.is_suspended;
      if (filter === "suspended") return u.is_suspended;
      return true;
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total users</div>
          <div className="mt-1 font-display text-2xl font-bold">{users.length}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">Pending approval</div>
          <div className="mt-1 font-display text-2xl font-bold text-amber-900">{counts.pending}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active</div>
          <div className="mt-1 font-display text-2xl font-bold text-emerald-700">{counts.active}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deactivated</div>
          <div className="mt-1 font-display text-2xl font-bold text-destructive">{counts.suspended}</div>
        </div>
      </div>

      <DashboardTabs
        tabs={STATUS_TABS.map((t) => ({ id: t.id, label: t.label, count: counts[t.id] }))}
        active={statusFilter}
        onChange={(id) => setStatusFilter(id as StatusFilter)}
      />

      <DashboardPanel
        title="User management"
        description="Click a row to view signup details. Approve new accounts before they can access the dashboard."
        bodyClassName="p-0"
      >
        <DashboardDataToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search email, name, or role…"
          onExport={() => exportUsersCsv(filtered)}
          exportDisabled={!filtered.length}
          exportCount={filtered.length}
        />
        {isLoading ? (
          <DashboardTableSkeleton rows={8} cols={5} />
        ) : (
          <DashboardTable className="min-w-[800px]">
            <DashboardTableHead>
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                {canSuspend && <th className="px-4 py-3">Action</th>}
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/10"
                  onClick={() => setSelected(u)}
                >
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
                        <ShieldOff className="h-3 w-3" /> Deactivated
                      </span>
                    ) : !u.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <ShieldCheck className="h-3 w-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {canSuspend ? (
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
                        {u.is_suspended ? "Reactivate" : "Deactivate"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={canSuspend ? 5 : 4} className="px-4 py-10 text-center text-muted-foreground">No users match your filters.</td>
                </tr>
              )}
            </tbody>
          </DashboardTable>
        )}
      </DashboardPanel>

      <UserDetailSheet user={selected} onClose={() => setSelected(null)} canManage={canApprove} />

      <Sheet open={!!suspendTarget} onOpenChange={(o) => { if (!o) setSuspendTarget(null); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" /> Deactivate account
            </SheetTitle>
            <SheetDescription>{suspendTarget?.email}</SheetDescription>
          </SheetHeader>
          {suspendTarget && (
            <div className="mt-6 space-y-4">
              <TextArea
                label="Deactivation reason (shown to user)"
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
                    reason: reason.trim() || "Deactivated by IGE admin",
                  })
                }
              >
                Confirm deactivation
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
