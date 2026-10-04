/**
 * The workspace layer (TAB 4 §4.3).
 *
 * Every account has exactly one workspace to begin with, created by a trigger
 * on sign-up. Upgrading to an Organisation changes that workspace's
 * account_type rather than creating a second one, which is what makes the
 * spec's promise hold: "All existing data migrates into the new organisation
 * workspace automatically; nothing is lost or re-entered." There is nothing to
 * migrate, because it is the same row.
 *
 * Seat changes run through the service role so one handler can both write the
 * row and send the invite email, and so the "there is always exactly one
 * owner" rule is enforced in one place rather than by four RLS policies.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { flushEmailQueueInDev } from "@/lib/email/flush-queue-dev";
import { getSiteUrl } from "@/lib/site-url";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  assertCan,
  type WorkspaceAccountType,
  type WorkspaceRole,
} from "@/lib/workspace-permissions";

/* eslint-disable @typescript-eslint/no-explicit-any --
   `workspaces`, `workspace_members` and `profiles.active_workspace_id`
   postdate the last `supabase gen types` run. Same cast convention as odb()
   and adb() elsewhere; drop once the types are regenerated. */
const wdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface WorkspaceRow {
  id: string;
  name: string;
  account_type: WorkspaceAccountType;
  owner_user_id: string;
  logo_url: string | null;
  billing_tier: string;
  upgraded_from_individual_at: string | null;
  created_at: string;
}

export interface WorkspaceMemberRow {
  id: string;
  workspace_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: WorkspaceRole;
  status: "invited" | "active" | "removed";
  invited_at: string;
  accepted_at: string | null;
  /** Joined from profiles — absent for an invite nobody has claimed yet. */
  display_name?: string | null;
  email?: string | null;
}

const RoleSchema = z.enum(["owner", "manager", "editor", "viewer"]);
const AssignableRoleSchema = z.enum(["manager", "editor", "viewer"]);

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Resolves the caller's seat. Every mutating handler starts here, so a
 * removed member or a non-member is rejected in one place.
 */
async function requireSeat(
  userId: string,
  workspaceId: string,
): Promise<{ role: WorkspaceRole; workspace: WorkspaceRow }> {
  const { data: workspace } = await wdb()
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!workspace) throw new Error("Workspace not found");

  const { data: member } = await wdb()
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!member) throw new Error("You do not have access to this workspace.");

  return { role: member.role as WorkspaceRole, workspace: workspace as WorkspaceRow };
}

/**
 * Everything the account menu needs: which workspaces the person can reach,
 * which one is active, and what they can do in it.
 *
 * Self-healing: an account that predates the workspace layer, or whose
 * active workspace was deleted, gets one here rather than seeing an empty
 * switcher it cannot escape.
 */
export const getMyWorkspaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const { data: seats } = await wdb()
      .from("workspace_members")
      .select("workspace_id, role, workspaces(*)")
      .eq("user_id", userId)
      .eq("status", "active");

    let rows = (seats ?? []) as {
      workspace_id: string;
      role: WorkspaceRole;
      workspaces: WorkspaceRow;
    }[];

    if (!rows.length) {
      await wdb().rpc("ensure_personal_workspace", { _user_id: userId });
      const { data: retry } = await wdb()
        .from("workspace_members")
        .select("workspace_id, role, workspaces(*)")
        .eq("user_id", userId)
        .eq("status", "active");
      rows = (retry ?? []) as typeof rows;
    }

    const { data: profile } = await wdb()
      .from("profiles")
      .select("active_workspace_id")
      .eq("id", userId)
      .maybeSingle();

    const ids = rows.map((r) => r.workspace_id);
    let activeId: string | null = profile?.active_workspace_id ?? null;
    // A stale pointer (seat removed, workspace deleted) falls back to the
    // first workspace they can actually reach.
    if (!activeId || !ids.includes(activeId)) {
      activeId = ids[0] ?? null;
      if (activeId) {
        await wdb().from("profiles").update({ active_workspace_id: activeId }).eq("id", userId);
      }
    }

    return {
      workspaces: rows.map((r) => ({ ...r.workspaces, my_role: r.role })),
      activeWorkspaceId: activeId,
      myRole: (rows.find((r) => r.workspace_id === activeId)?.role ?? null) as WorkspaceRole | null,
    };
  });

/** The Team section: who holds which seat, plus outstanding invites. */
export const getWorkspaceTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ workspace_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { role, workspace } = await requireSeat(context.userId, data.workspace_id);
    assertCan(role, "team.view", "see the team");

    const { data: members } = await wdb()
      .from("workspace_members")
      .select("id, workspace_id, user_id, invited_email, role, status, invited_at, accepted_at")
      .eq("workspace_id", data.workspace_id)
      .neq("status", "removed")
      .order("invited_at", { ascending: true });

    const rows = (members ?? []) as WorkspaceMemberRow[];
    const userIds = rows.map((m) => m.user_id).filter((id): id is string => !!id);

    const { data: profiles } = userIds.length
      ? await wdb().from("profiles").select("id, display_name, email").in("id", userIds)
      : { data: [] };

    const byId = new Map(
      ((profiles ?? []) as { id: string; display_name: string | null; email: string | null }[]).map(
        (p) => [p.id, p],
      ),
    );

    return {
      workspace: workspace as WorkspaceRow,
      myRole: role,
      members: rows.map((m) => ({
        ...m,
        display_name: m.user_id ? (byId.get(m.user_id)?.display_name ?? null) : null,
        email: m.user_id ? (byId.get(m.user_id)?.email ?? null) : m.invited_email,
      })),
    };
  });

// ─── Switching ────────────────────────────────────────────────────────────────

export const switchWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ workspace_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // requireSeat is the authorisation check: you cannot switch into a
    // workspace you have no active seat in.
    await requireSeat(context.userId, data.workspace_id);
    await wdb()
      .from("profiles")
      .update({ active_workspace_id: data.workspace_id })
      .eq("id", context.userId);
    return { ok: true as const, workspace_id: data.workspace_id };
  });

// ─── Workspace settings ───────────────────────────────────────────────────────

export const updateWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        workspace_id: z.string().uuid(),
        name: z.string().trim().min(1).max(120).optional(),
        logo_url: z.string().trim().url().max(500).nullish(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { role } = await requireSeat(context.userId, data.workspace_id);
    assertCan(role, "workspace.manage", "change workspace settings");

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) patch.name = data.name;
    if (data.logo_url !== undefined) patch.logo_url = data.logo_url;

    const { error } = await wdb().from("workspaces").update(patch).eq("id", data.workspace_id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/**
 * "Upgrade to Organisation" (TAB 4 §4.3).
 *
 * Deliberately not a sign-up flow and deliberately not a new row: the same
 * workspace changes account_type, so Market Budgets, Deal Cards, Fundraising
 * Trackers and Deliverable Matrices stay exactly where they are. The only
 * thing that changes is that the account now supports multiple named seats.
 * There is no billing to convert — IGE is free until at least May 2027.
 */
export const upgradeToOrganisation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        workspace_id: z.string().uuid(),
        organisation_name: z.string().trim().min(1).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { role, workspace } = await requireSeat(context.userId, data.workspace_id);
    assertCan(role, "workspace.manage", "upgrade this workspace");

    if (workspace.account_type === "organisation") {
      return { ok: true as const, alreadyOrganisation: true };
    }

    const { error } = await wdb()
      .from("workspaces")
      .update({
        account_type: "organisation",
        name: data.organisation_name,
        upgraded_from_individual_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.workspace_id);
    if (error) throw new Error(error.message);

    return { ok: true as const, alreadyOrganisation: false };
  });

// ─── Seats ────────────────────────────────────────────────────────────────────

export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        workspace_id: z.string().uuid(),
        email: z.string().trim().email().max(255),
        role: AssignableRoleSchema,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { role, workspace } = await requireSeat(context.userId, data.workspace_id);
    assertCan(role, "team.manage", "invite people");

    const email = data.email.toLowerCase();

    // Inviting into an Individual workspace is the upgrade trigger the spec
    // describes, but it should be an explicit choice rather than a silent
    // side effect of typing an email address.
    if (workspace.account_type !== "organisation") {
      throw new Error(
        "Upgrade this workspace to an Organisation first — named seats are what the upgrade adds.",
      );
    }

    const { data: existingProfile } = await wdb()
      .from("profiles")
      .select("id, display_name")
      .ilike("email", email)
      .maybeSingle();

    if (existingProfile?.id) {
      const { data: seat } = await wdb()
        .from("workspace_members")
        .select("id, status")
        .eq("workspace_id", data.workspace_id)
        .eq("user_id", existingProfile.id)
        .maybeSingle();

      if (seat && seat.status === "active") {
        throw new Error("That person is already on this team.");
      }

      // Someone previously removed is re-seated rather than duplicated —
      // the unique index would reject a second row anyway.
      if (seat) {
        await wdb()
          .from("workspace_members")
          .update({
            role: data.role,
            status: "active",
            accepted_at: new Date().toISOString(),
            removed_at: null,
            invited_by: context.userId,
          })
          .eq("id", seat.id);
      } else {
        // They already have an IGE account, so there is nothing to accept:
        // the seat is live and the email is a notification, not a gate.
        await wdb().from("workspace_members").insert({
          workspace_id: data.workspace_id,
          user_id: existingProfile.id,
          invited_email: email,
          role: data.role,
          status: "active",
          invited_by: context.userId,
          accepted_at: new Date().toISOString(),
        });
      }
    } else {
      await wdb().from("workspace_members").insert({
        workspace_id: data.workspace_id,
        invited_email: email,
        role: data.role,
        status: "invited",
        invited_by: context.userId,
      });
    }

    const { data: inviter } = await wdb()
      .from("profiles")
      .select("display_name, email")
      .eq("id", context.userId)
      .maybeSingle();

    const siteUrl = getSiteUrl();
    const sendResult = await sendTransactionalEmailServer({
      templateName: "workspace-invite",
      recipientEmail: email,
      idempotencyKey: `workspace-invite-${data.workspace_id}-${email}-${Date.now()}`,
      templateData: {
        workspaceName: workspace.name,
        inviterName: inviter?.display_name ?? inviter?.email ?? null,
        roleLabel: ROLE_LABELS[data.role],
        // Spell out what the seat allows: Manager in particular is read-only,
        // and someone arriving expecting edit rights would be confused.
        roleDescription: ROLE_DESCRIPTIONS[data.role],
        hasAccount: !!existingProfile?.id,
        // An existing account signs in; a new one signs up and the seat is
        // claimed on their first load (see claimPendingInvites).
        actionUrl: existingProfile?.id ? `${siteUrl}/login` : `${siteUrl}/signup`,
        siteUrl,
      },
    });
    await flushEmailQueueInDev();

    return {
      ok: true as const,
      emailSent: sendResult.success,
      // The seat exists either way; say so plainly rather than implying the
      // invite failed outright.
      emailProblem: sendResult.success ? null : (sendResult.reason ?? "unknown"),
    };
  });

export const updateTeamMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        workspace_id: z.string().uuid(),
        member_id: z.string().uuid(),
        role: AssignableRoleSchema,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { role } = await requireSeat(context.userId, data.workspace_id);
    assertCan(role, "team.manage", "change someone's role");

    const { data: member } = await wdb()
      .from("workspace_members")
      .select("id, role, user_id")
      .eq("id", data.member_id)
      .eq("workspace_id", data.workspace_id)
      .maybeSingle();
    if (!member) throw new Error("That team member is not in this workspace.");

    // The owner seat moves only through transferWorkspaceOwnership, so a
    // workspace can never be left without one.
    if (member.role === "owner") {
      throw new Error("Transfer ownership to change the Owner's role.");
    }

    const { error } = await wdb()
      .from("workspace_members")
      .update({ role: data.role })
      .eq("id", data.member_id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ workspace_id: z.string().uuid(), member_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { role } = await requireSeat(context.userId, data.workspace_id);
    assertCan(role, "team.manage", "remove people");

    const { data: member } = await wdb()
      .from("workspace_members")
      .select("id, role, user_id, status")
      .eq("id", data.member_id)
      .eq("workspace_id", data.workspace_id)
      .maybeSingle();
    if (!member) throw new Error("That team member is not in this workspace.");
    if (member.role === "owner") {
      throw new Error("The Owner cannot be removed. Transfer ownership first.");
    }

    // Soft-removed, not deleted: tasks and outreach already assigned to this
    // person still need a name to render against.
    const { error } = await wdb()
      .from("workspace_members")
      .update({ status: "removed", removed_at: new Date().toISOString() })
      .eq("id", data.member_id);
    if (error) throw new Error(error.message);

    // Anyone sitting in a workspace they just lost access to is moved out of
    // it on their next load by getMyWorkspaces' stale-pointer fallback.
    if (member.user_id) {
      await wdb()
        .from("profiles")
        .update({ active_workspace_id: null })
        .eq("id", member.user_id)
        .eq("active_workspace_id", data.workspace_id);
    }

    return { ok: true as const };
  });

export const transferWorkspaceOwnership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        workspace_id: z.string().uuid(),
        to_user_id: z.string().uuid(),
        /** The role the outgoing owner keeps. */
        my_new_role: AssignableRoleSchema.default("editor"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspace } = await requireSeat(context.userId, data.workspace_id);
    if (workspace.owner_user_id !== context.userId) {
      throw new Error("Only the current Owner can transfer ownership.");
    }
    if (data.to_user_id === context.userId) {
      throw new Error("You already own this workspace.");
    }

    const { data: target } = await wdb()
      .from("workspace_members")
      .select("id, status")
      .eq("workspace_id", data.workspace_id)
      .eq("user_id", data.to_user_id)
      .eq("status", "active")
      .maybeSingle();
    if (!target) throw new Error("That person is not an active member of this workspace.");

    // Demote first: the unique index allows several owners, so promoting
    // first would briefly leave two and a crash between the two writes would
    // leave it that way.
    await wdb()
      .from("workspace_members")
      .update({ role: data.my_new_role })
      .eq("workspace_id", data.workspace_id)
      .eq("user_id", context.userId);
    await wdb().from("workspace_members").update({ role: "owner" }).eq("id", target.id);
    await wdb()
      .from("workspaces")
      .update({ owner_user_id: data.to_user_id, updated_at: new Date().toISOString() })
      .eq("id", data.workspace_id);

    return { ok: true as const };
  });

/**
 * Turns invites addressed to this person's email into live seats.
 *
 * An invite sent before someone had an account has no user_id to point at, so
 * it waits on the email address. Called once after sign-in rather than at
 * invite time, because that is the first moment the account exists.
 */
export const claimPendingInvites = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await wdb()
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();
    const email = (profile?.email as string | undefined)?.toLowerCase();
    if (!email) return { claimed: 0 };

    const { data: pending } = await wdb()
      .from("workspace_members")
      .select("id, workspace_id")
      .is("user_id", null)
      .eq("status", "invited")
      .ilike("invited_email", email);

    const rows = (pending ?? []) as { id: string; workspace_id: string }[];
    if (!rows.length) return { claimed: 0 };

    let claimed = 0;
    for (const row of rows) {
      // Someone can be invited to a workspace they already belong to; the
      // unique index rejects the second seat, so skip rather than fail the
      // whole claim and strand the other invites.
      const { error } = await wdb()
        .from("workspace_members")
        .update({
          user_id: context.userId,
          status: "active",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (!error) claimed += 1;
    }

    return { claimed };
  });

export { ASSIGNABLE_ROLES, RoleSchema };

// ─── Team Activity (the Manager role's reason to exist) ───────────────────────

/**
 * "A Team Activity view showing outreach logged, meetings held, pipeline
 *  movement, activations and tasks completed per person per week"
 * (TAB 4 §4.3, Manager role).
 *
 * Three of those five do not exist yet: outreach, meetings, activations and
 * tasks all arrive with the shared daily tools in Version 1.1 Section B. This
 * returns what the platform can honestly measure today — listings created and
 * pipeline movement — and reports the rest as untracked rather than as zero.
 * A manager reading "0 meetings held" would conclude their team did nothing,
 * which is a worse answer than "not tracked yet".
 */
export const getTeamActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        workspace_id: z.string().uuid(),
        /** Days back from now. One week by default, per the spec's cadence. */
        days: z.number().int().min(1).max(365).default(7),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { role } = await requireSeat(context.userId, data.workspace_id);
    assertCan(role, "team.activity", "see Team Activity");

    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    const { data: members } = await wdb()
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", data.workspace_id)
      .eq("status", "active");

    const seats = ((members ?? []) as { user_id: string | null; role: WorkspaceRole }[]).filter(
      (m): m is { user_id: string; role: WorkspaceRole } => !!m.user_id,
    );
    const userIds = seats.map((m) => m.user_id);
    if (!userIds.length) {
      return { since, rows: [], untracked: UNTRACKED_ACTIVITY };
    }

    const [profilesRes, eventsRes, dealsRes, movesRes] = await Promise.all([
      wdb().from("profiles").select("id, display_name, email, last_login_at").in("id", userIds),
      wdb()
        .from("events")
        .select("organiser_id")
        .in("organiser_id", userIds)
        .gte("created_at", since),
      wdb()
        .from("deals")
        .select("organiser_id")
        .in("organiser_id", userIds)
        .gte("created_at", since),
      wdb()
        .from("deal_status_history")
        .select("changed_by")
        .in("changed_by", userIds)
        .gte("changed_at", since),
    ]);

    const count = (rows: unknown[] | null, key: string) => {
      const tally = new Map<string, number>();
      for (const row of (rows ?? []) as Record<string, string | null>[]) {
        const id = row[key];
        if (id) tally.set(id, (tally.get(id) ?? 0) + 1);
      }
      return tally;
    };

    const eventsBy = count(eventsRes.data, "organiser_id");
    const dealsBy = count(dealsRes.data, "organiser_id");
    const movesBy = count(movesRes.data, "changed_by");
    const profileById = new Map(
      (
        (profilesRes.data ?? []) as {
          id: string;
          display_name: string | null;
          email: string | null;
          last_login_at: string | null;
        }[]
      ).map((p) => [p.id, p]),
    );

    return {
      since,
      rows: seats.map((seat) => {
        const profile = profileById.get(seat.user_id);
        return {
          user_id: seat.user_id,
          role: seat.role,
          name: profile?.display_name ?? profile?.email ?? "Unknown",
          last_active_at: profile?.last_login_at ?? null,
          listings_created: eventsBy.get(seat.user_id) ?? 0,
          deals_opened: dealsBy.get(seat.user_id) ?? 0,
          pipeline_moves: movesBy.get(seat.user_id) ?? 0,
        };
      }),
      untracked: UNTRACKED_ACTIVITY,
    };
  });

/** Named so the UI states what is missing instead of rendering a silent zero. */
const UNTRACKED_ACTIVITY = [
  "Outreach logged",
  "Meetings held",
  "Activations delivered",
  "Tasks completed",
] as const;
