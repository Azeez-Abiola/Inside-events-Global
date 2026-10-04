import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Building2, Check, Loader2, Shield, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import {
  getMyWorkspaces,
  getWorkspaceTeam,
  inviteTeamMember,
  removeTeamMember,
  switchWorkspace,
  updateTeamMemberRole,
  upgradeToOrganisation,
} from "@/lib/workspace.functions";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  can,
  type WorkspaceRole,
} from "@/lib/workspace-permissions";

/**
 * Account Settings > Workspace and Team (TAB 4 §4.3).
 *
 * "A single-brand account shows one workspace and an 'Invite a team member'
 *  prompt instead of a switcher" — that prompt is the upgrade trigger, so an
 *  Individual account is never asked to make an organisational decision
 *  before it has a reason to.
 */
export function WorkspaceSettings() {
  const qc = useQueryClient();
  const fetchWorkspaces = useServerFn(getMyWorkspaces);

  const { data, isLoading } = useQuery({
    queryKey: ["my-workspaces"],
    queryFn: () => fetchWorkspaces(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const workspaces = data?.workspaces ?? [];
  const activeId = data?.activeWorkspaceId ?? null;
  const active = workspaces.find((w) => w.id === activeId);
  const myRole = (data?.myRole ?? null) as WorkspaceRole | null;

  if (!active) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        We could not load your workspace. Reload the page, and tell us at hi@insideglobalevents.com
        if it keeps happening.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {workspaces.length > 1 ? (
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeId={activeId}
          onSwitched={() => qc.invalidateQueries()}
        />
      ) : null}

      {active.account_type === "individual" ? (
        <UpgradePrompt
          workspaceId={active.id}
          canUpgrade={can(myRole, "workspace.manage")}
          onUpgraded={() => qc.invalidateQueries({ queryKey: ["my-workspaces"] })}
        />
      ) : (
        <TeamSection workspaceId={active.id} />
      )}
    </div>
  );
}

function WorkspaceSwitcher({
  workspaces,
  activeId,
  onSwitched,
}: {
  workspaces: { id: string; name: string; account_type: string; my_role: WorkspaceRole }[];
  activeId: string | null;
  onSwitched: () => void;
}) {
  const switchTo = useServerFn(switchWorkspace);
  const mutation = useMutation({
    mutationFn: (workspace_id: string) => switchTo({ data: { workspace_id } }),
    onSuccess: () => {
      toast.success("Workspace switched");
      onSwitched();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="border-b border-border/60 bg-muted/20 px-5 py-4">
        <h3 className="flex items-center font-display text-sm font-bold text-foreground">
          Your workspaces
          <InfoTip tip="settings.workspace_switcher" />
        </h3>
        <p className="text-xs text-muted-foreground">
          Everything you create belongs to the workspace you are in at the time.
        </p>
      </header>
      <ul className="divide-y divide-border/60">
        {workspaces.map((w) => {
          const isActive = w.id === activeId;
          return (
            <li key={w.id} className="flex items-center gap-3 px-5 py-3">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{w.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {w.account_type === "organisation" ? "Organisation" : "Individual"} ·{" "}
                  {ROLE_LABELS[w.my_role]}
                </span>
              </span>
              {isActive ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary-deep">
                  <Check className="h-3 w-3" /> Active
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(w.id)}
                >
                  Switch
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function UpgradePrompt({
  workspaceId,
  canUpgrade,
  onUpgraded,
}: {
  workspaceId: string;
  canUpgrade: boolean;
  onUpgraded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const upgrade = useServerFn(upgradeToOrganisation);

  const mutation = useMutation({
    mutationFn: () =>
      upgrade({ data: { workspace_id: workspaceId, organisation_name: name.trim() } }),
    onSuccess: () => {
      toast.success("Upgraded. You can invite your team now.");
      setOpen(false);
      onUpgraded();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h3 className="flex items-center font-display text-sm font-bold text-foreground">
        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
        Invite a team member
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        This is an Individual workspace — just you. Upgrading to an Organisation adds named seats
        with their own permissions, and a shared budget and funding-gap pool everyone can see.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Nothing moves and nothing is re-entered: your events, budgets, deals and trackers stay
        exactly where they are. There is no billing to convert — IGE is free to use until at least
        May 2027.
      </p>

      {!open ? (
        <Button type="button" className="mt-4" disabled={!canUpgrade} onClick={() => setOpen(true)}>
          Upgrade to Organisation
        </Button>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              toast.error("Give the organisation a name.");
              return;
            }
            mutation.mutate();
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Organisation name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="e.g. AlexBoyo World"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Upgrading…" : "Confirm upgrade"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!canUpgrade && (
        <p className="mt-3 text-xs text-muted-foreground">Only the workspace Owner can upgrade.</p>
      )}
    </section>
  );
}

function TeamSection({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const fetchTeam = useServerFn(getWorkspaceTeam);
  const invite = useServerFn(inviteTeamMember);
  const setRole = useServerFn(updateTeamMemberRole);
  const remove = useServerFn(removeTeamMember);

  const [email, setEmail] = useState("");
  const [role, setRoleValue] = useState<"manager" | "editor" | "viewer">("editor");

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-team", workspaceId],
    queryFn: () => fetchTeam({ data: { workspace_id: workspaceId } }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["workspace-team", workspaceId] });

  const inviteMutation = useMutation({
    mutationFn: () => invite({ data: { workspace_id: workspaceId, email: email.trim(), role } }),
    onSuccess: (res) => {
      setEmail("");
      // The seat exists whether or not the email went out; saying "invite
      // sent" when it bounced would leave someone waiting for nothing.
      if (res.emailSent) toast.success("Invite sent.");
      else toast.warning("Seat added, but we could not send the email. Tell them another way.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMutation = useMutation({
    mutationFn: (v: { member_id: string; role: "manager" | "editor" | "viewer" }) =>
      setRole({ data: { workspace_id: workspaceId, member_id: v.member_id, role: v.role } }),
    onSuccess: () => {
      toast.success("Role updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (member_id: string) => remove({ data: { workspace_id: workspaceId, member_id } }),
    onSuccess: () => {
      toast.success("Removed from the team");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const members = data?.members ?? [];
  const myRole = (data?.myRole ?? null) as WorkspaceRole | null;
  const canManage = can(myRole, "team.manage");

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="border-b border-border/60 bg-muted/20 px-5 py-4">
        <h3 className="flex items-center font-display text-sm font-bold text-foreground">
          Team
          <InfoTip tip="settings.team" />
        </h3>
        <p className="text-xs text-muted-foreground">
          Everyone with access to {data?.workspace?.name ?? "this workspace"}. A person must appear
          here before a task can be assigned to them.
        </p>
      </header>

      <ul className="divide-y divide-border/60">
        {members.map((m) => {
          const isOwner = m.role === "owner";
          const pending = m.status === "invited";
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {m.display_name ?? m.email ?? "Invited"}
                  {pending && (
                    <span className="ml-2 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Invite pending
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{m.email}</span>
              </span>

              {isOwner || !canManage ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {m.role === "manager" && <Shield className="h-3 w-3" />}
                  {ROLE_LABELS[m.role]}
                </span>
              ) : (
                <select
                  value={m.role}
                  onChange={(e) =>
                    roleMutation.mutate({
                      member_id: m.id,
                      role: e.target.value as "manager" | "editor" | "viewer",
                    })
                  }
                  aria-label={`Role for ${m.display_name ?? m.email ?? "this member"}`}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              )}

              {canManage && !isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove ${m.display_name ?? m.email} from this workspace?`)) {
                      removeMutation.mutate(m.id);
                    }
                  }}
                  aria-label={`Remove ${m.display_name ?? m.email ?? "this member"}`}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {canManage ? (
        <form
          className="space-y-3 border-t border-border/60 bg-muted/20 px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) {
              toast.error("Enter an email address.");
              return;
            }
            inviteMutation.mutate();
          }}
        >
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[200px] flex-1">
              <span className="mb-1.5 block text-xs font-medium text-foreground">
                Invite by email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-foreground">Seat</span>
              <select
                value={role}
                onChange={(e) => setRoleValue(e.target.value as "manager" | "editor" | "viewer")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={inviteMutation.isPending}>
              <UserPlus className="mr-2 h-4 w-4" />
              {inviteMutation.isPending ? "Sending…" : "Invite"}
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
        </form>
      ) : (
        <p className="border-t border-border/60 bg-muted/20 px-5 py-4 text-xs text-muted-foreground">
          {myRole === "manager"
            ? "Your seat is Manager — read-only oversight. You can see everything the team does, including Team Activity, but cannot change seats."
            : "Only the Owner and Editors can change who is on the team."}
        </p>
      )}
    </section>
  );
}
