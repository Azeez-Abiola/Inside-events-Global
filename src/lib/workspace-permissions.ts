/**
 * What each workspace seat can do (TAB 4 §4.3).
 *
 * Four roles, and the one that matters most is Manager, new in v6.2:
 * "read-only oversight of everything the team does in the workspace,
 *  including a Team Activity view showing outreach logged, meetings held,
 *  pipeline movement, activations and tasks completed per person per week. A
 *  boss can monitor the team without editing anything."
 *
 * Manager is therefore the only role that can see Team Activity but cannot
 * change a single thing. Treat that asymmetry as deliberate, not an oversight.
 */

export const WORKSPACE_ROLES = ["owner", "manager", "editor", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export type WorkspaceAccountType = "individual" | "organisation";
export type WorkspaceMemberStatus = "invited" | "active" | "removed";

export type WorkspacePermission =
  /** See the workspace and its content at all. */
  | "workspace.view"
  /** Create and edit events, deals, contacts, tasks — the day-to-day work. */
  | "workspace.edit"
  /** Rename the workspace, change its logo, upgrade it to an Organisation. */
  | "workspace.manage"
  /** See the Team section and who holds which seat. */
  | "team.view"
  /** Invite, remove and re-role seats. */
  | "team.manage"
  /** The Team Activity view and the Weekly Team Activity Report. */
  | "team.activity"
  /** Payment method on file and payout account details. */
  | "payments.manage";

const PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  owner: [
    "workspace.view",
    "workspace.edit",
    "workspace.manage",
    "team.view",
    "team.manage",
    "team.activity",
    "payments.manage",
  ],
  // Oversight without edit rights. Sees everything the team does; changes none
  // of it, invites nobody, and never touches payout details.
  manager: ["workspace.view", "team.view", "team.activity"],
  editor: ["workspace.view", "workspace.edit", "team.view", "team.manage"],
  viewer: ["workspace.view"],
};

export function can(
  role: WorkspaceRole | null | undefined,
  permission: WorkspacePermission,
): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Throws with copy fit to show the person who tried. */
export function assertCan(
  role: WorkspaceRole | null | undefined,
  permission: WorkspacePermission,
  what = "do that",
) {
  if (can(role, permission)) return;
  if (role === "manager") {
    throw new Error(
      `Your seat is Manager, which is read-only oversight — you can see everything the team does but cannot ${what}.`,
    );
  }
  throw new Error(`You do not have permission to ${what} in this workspace.`);
}

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Owner",
  manager: "Manager",
  editor: "Editor",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  owner:
    "Full control, including upgrading the workspace, managing seats and holding the payout details. There is always exactly one.",
  manager:
    "Read-only oversight. Sees everything the team does and the weekly Team Activity report, but cannot edit anything or manage seats.",
  editor: "Does the day-to-day work and can invite or remove team members.",
  viewer: "Can see the workspace but cannot change anything.",
};

/** Roles an Owner or Editor may hand out. Owner transfers are their own action. */
export const ASSIGNABLE_ROLES: WorkspaceRole[] = ["manager", "editor", "viewer"];
