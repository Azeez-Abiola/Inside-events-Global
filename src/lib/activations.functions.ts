import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCan, type WorkspaceRole } from "@/lib/workspace-permissions";

/**
 * Activation Task Tracker (TAB 4, Module 4A).
 *
 * A project-management board for activations rather than a per-deal checklist.
 * An activation can hang off an event, off a CRM deal, or stand alone, so both
 * links are optional everywhere.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   The activation tables postdate the last `supabase gen types` run; same cast
   convention as cdb()/kdb() elsewhere. */
const adb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const ACTIVATION_STATUSES = ["not_started", "in_progress", "blocked", "done"] as const;
export const ACTIVATION_TYPES = [
  "sampling",
  "booth",
  "stage_moment",
  "hosted_session",
  "content_shoot",
  "pop_up",
  "community_outreach",
  "other",
] as const;

export interface Activation {
  id: string;
  name: string;
  activation_type: string;
  status: string;
  event_id: string | null;
  deal_id: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  starts_on: string | null;
  ends_on: string | null;
  event_date: string | null;
  owner_id: string | null;
  team_note: string | null;
  vendor_name: string | null;
  vendor_contact_id: string | null;
  budget_amount: number | null;
  budget_currency: string;
  notes: string | null;
  updated_at: string;
}

export interface ActivationMilestone {
  id: string;
  activation_id: string;
  title: string;
  due_on: string | null;
  assignee_id: string | null;
  completed_at: string | null;
  position: number;
}

export interface ActivationEvidence {
  id: string;
  activation_id: string;
  kind: string;
  file_url: string | null;
  attendance_count: number | null;
  caption: string | null;
  captured_at: string;
}

export interface ActivationTeamMember {
  user_id: string;
  name: string;
}

async function activeWorkspace(
  userId: string,
): Promise<{ workspaceId: string; role: WorkspaceRole }> {
  const { data: profile } = await adb()
    .from("profiles")
    .select("active_workspace_id")
    .eq("id", userId)
    .maybeSingle();

  let workspaceId: string | null = profile?.active_workspace_id ?? null;
  if (!workspaceId) {
    const { data: healed } = await adb().rpc("ensure_personal_workspace", { _user_id: userId });
    workspaceId = (healed as string | null) ?? null;
  }
  if (!workspaceId) throw new Error("No workspace found for this account.");

  const { data: member } = await adb()
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!member) throw new Error("You do not have access to this workspace.");

  return { workspaceId, role: member.role as WorkspaceRole };
}

export const getActivations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);

    const [acts, miles, team] = await Promise.all([
      adb()
        .from("activations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("starts_on", { nullsFirst: false }),
      adb()
        .from("activation_milestones")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("position"),
      adb()
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspaceId)
        .eq("status", "active"),
    ]);

    // "Named owner from the workspace Team" — the picker can only offer people
    // who actually hold a seat.
    const ids = ((team.data ?? []) as { user_id: string | null }[])
      .map((m) => m.user_id)
      .filter((id): id is string => !!id);
    const { data: profiles } = ids.length
      ? await adb().from("profiles").select("id, display_name, email").in("id", ids)
      : { data: [] };

    return {
      myRole: role,
      activations: (acts.data ?? []) as Activation[],
      milestones: (miles.data ?? []) as ActivationMilestone[],
      team: (
        (profiles ?? []) as { id: string; display_name: string | null; email: string | null }[]
      )
        .map((p) => ({ user_id: p.id, name: p.display_name ?? p.email ?? "Unknown" }))
        .sort((a, b) => a.name.localeCompare(b.name)) as ActivationTeamMember[],
    };
  });

const ActivationInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  activation_type: z.enum(ACTIVATION_TYPES),
  status: z.enum(ACTIVATION_STATUSES).optional(),
  event_id: z.string().uuid().nullish(),
  deal_id: z.string().uuid().nullish(),
  venue: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  starts_on: z.string().max(20).nullish(),
  ends_on: z.string().max(20).nullish(),
  event_date: z.string().max(20).nullish(),
  owner_id: z.string().uuid().nullish(),
  team_note: z.string().trim().max(500).optional(),
  vendor_name: z.string().trim().max(200).optional(),
  vendor_contact_id: z.string().uuid().nullish(),
  budget_amount: z.number().nonnegative().nullish(),
  budget_currency: z.string().trim().max(10).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const upsertActivation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ActivationInput.parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "add or edit activations");

    if (data.starts_on && data.ends_on && data.ends_on < data.starts_on) {
      throw new Error("The activation ends before it starts.");
    }

    const row = {
      workspace_id: workspaceId,
      name: data.name,
      activation_type: data.activation_type,
      status: data.status ?? "not_started",
      event_id: data.event_id ?? null,
      deal_id: data.deal_id ?? null,
      venue: data.venue || null,
      city: data.city || null,
      country: data.country || null,
      starts_on: data.starts_on || null,
      ends_on: data.ends_on || null,
      event_date: data.event_date || null,
      owner_id: data.owner_id ?? null,
      team_note: data.team_note || null,
      vendor_name: data.vendor_name || null,
      vendor_contact_id: data.vendor_contact_id ?? null,
      budget_amount: data.budget_amount ?? null,
      budget_currency: data.budget_currency || "NGN",
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = data.id
      ? await adb()
          .from("activations")
          .update(row)
          .eq("id", data.id)
          .eq("workspace_id", workspaceId)
      : await adb()
          .from("activations")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Dragging a card between columns. One field, kept separate. */
export const setActivationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(ACTIVATION_STATUSES) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "move activations");
    const { error } = await adb()
      .from("activations")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteActivation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "delete activations");
    await adb().from("activations").delete().eq("id", data.id).eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

export const upsertMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        activation_id: z.string().uuid(),
        title: z.string().trim().min(1).max(200),
        due_on: z.string().max(20).nullish(),
        assignee_id: z.string().uuid().nullish(),
        position: z.number().int().min(0).max(999).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "add milestones");

    const row = {
      workspace_id: workspaceId,
      activation_id: data.activation_id,
      title: data.title,
      due_on: data.due_on || null,
      assignee_id: data.assignee_id ?? null,
      position: data.position ?? 0,
    };
    const { error } = data.id
      ? await adb()
          .from("activation_milestones")
          .update(row)
          .eq("id", data.id)
          .eq("workspace_id", workspaceId)
      : await adb()
          .from("activation_milestones")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const toggleMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), done: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "complete milestones");
    await adb()
      .from("activation_milestones")
      .update({ completed_at: data.done ? new Date().toISOString() : null })
      .eq("id", data.id)
      .eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

export const deleteMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "delete milestones");
    await adb()
      .from("activation_milestones")
      .delete()
      .eq("id", data.id)
      .eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

/**
 * Evidence capture (§Module 4A).
 *
 * "Photos, videos, attendance counts and notes, feeding the Investment
 *  Report." TAB 8 does not exist yet; capturing the evidence now means there
 *  is a record to read when it does, rather than a backfill nobody can do.
 */
export const addEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        activation_id: z.string().uuid(),
        kind: z.enum(["photo", "video", "attendance", "note", "document"]),
        file_url: z.string().trim().url().max(500).optional(),
        attendance_count: z.number().int().min(0).max(10_000_000).nullish(),
        caption: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "add evidence");
    const { error } = await adb()
      .from("activation_evidence")
      .insert({
        workspace_id: workspaceId,
        activation_id: data.activation_id,
        kind: data.kind,
        file_url: data.file_url || null,
        attendance_count: data.attendance_count ?? null,
        caption: data.caption || null,
        created_by: context.userId,
      });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getActivationEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ activation_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId } = await activeWorkspace(context.userId);
    const { data: rows } = await adb()
      .from("activation_evidence")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("activation_id", data.activation_id)
      .order("captured_at", { ascending: false });
    return { evidence: (rows ?? []) as ActivationEvidence[] };
  });
