import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCan, type WorkspaceRole } from "@/lib/workspace-permissions";

/**
 * Contacts and CRM (TAB 4 §4.4.2).
 *
 * Everything belongs to a workspace, not a person, so an Organisation team
 * shares one pipeline and a Manager can see all of it without being able to
 * change any of it. Every handler resolves the caller's seat first — RLS
 * enforces the same rule at the database, but doing it here means a refusal
 * arrives as a sentence rather than an empty result set.
 *
 * These are the user's own external contacts. Nothing here lets one IGE user
 * reach another, so the no-user-to-user rule (TAB 19 §19.1A) still holds.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   The crm_* tables postdate the last `supabase gen types` run; same cast
   convention as odb()/adb() elsewhere. */
const cdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CrmCompany {
  id: string;
  name: string;
  is_client: boolean;
  client_type: string | null;
  sector: string | null;
  country: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
}

export interface CrmContact {
  id: string;
  company_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  contact_type: string | null;
  sector: string | null;
  country: string | null;
  tags: string[];
  notes: string | null;
  source: string | null;
  created_at: string;
}

export interface CrmStage {
  id: string;
  name: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface CrmOutreach {
  id: string;
  contact_id: string | null;
  deal_id: string | null;
  channel: string;
  occurred_at: string;
  outcome: string | null;
  notes: string | null;
  next_follow_up: string | null;
  created_at: string;
}

export interface CrmMeeting {
  id: string;
  contact_id: string | null;
  deal_id: string | null;
  held_at: string;
  attendees: string | null;
  notes: string | null;
  decisions: string | null;
  next_steps: string | null;
  created_at: string;
}

export interface CrmDeal {
  id: string;
  stage_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  event_id: string | null;
  title: string;
  value_amount: number | null;
  value_currency: string;
  probability: number | null;
  expected_close: string | null;
  assignee_id: string | null;
  notes: string | null;
  updated_at: string;
}

// ─── Seat resolution ──────────────────────────────────────────────────────────

/**
 * The caller's seat in their active workspace. Every handler starts here, so
 * "which workspace?" is never a client-supplied value — passing a workspace id
 * from the browser would let anyone read any workspace by guessing one.
 */
async function activeWorkspace(
  userId: string,
): Promise<{ workspaceId: string; role: WorkspaceRole }> {
  const { data: profile } = await cdb()
    .from("profiles")
    .select("active_workspace_id")
    .eq("id", userId)
    .maybeSingle();

  let workspaceId: string | null = profile?.active_workspace_id ?? null;

  if (!workspaceId) {
    // Self-heal rather than fail: an account that predates the workspace
    // layer should not hit a dead end in the CRM.
    const { data: healed } = await cdb().rpc("ensure_personal_workspace", {
      _user_id: userId,
    });
    workspaceId = (healed as string | null) ?? null;
  }
  if (!workspaceId) throw new Error("No workspace found for this account.");

  const { data: member } = await cdb()
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!member) throw new Error("You do not have access to this workspace.");

  return { workspaceId, role: member.role as WorkspaceRole };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Everything the CRM screen needs, in one round trip. */
export const getCrmWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);

    // A workspace that has never opened the CRM has no stages, and an empty
    // board is indistinguishable from a broken one.
    await cdb().rpc("ensure_default_pipeline_stages", { _workspace_id: workspaceId });

    const [companies, contacts, stages, deals] = await Promise.all([
      cdb().from("crm_companies").select("*").eq("workspace_id", workspaceId).order("name"),
      cdb().from("crm_contacts").select("*").eq("workspace_id", workspaceId).order("full_name"),
      cdb()
        .from("crm_pipeline_stages")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("position"),
      cdb()
        .from("crm_deals")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false }),
    ]);

    return {
      myRole: role,
      companies: (companies.data ?? []) as CrmCompany[],
      contacts: (contacts.data ?? []) as CrmContact[],
      stages: (stages.data ?? []) as CrmStage[],
      deals: (deals.data ?? []) as CrmDeal[],
    };
  });

/** Everything logged against one contact, newest first. */
export const getContactTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ contact_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId } = await activeWorkspace(context.userId);
    const [outreach, meetings] = await Promise.all([
      cdb()
        .from("crm_outreach")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("contact_id", data.contact_id)
        .order("occurred_at", { ascending: false }),
      cdb()
        .from("crm_meetings")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("contact_id", data.contact_id)
        .order("held_at", { ascending: false }),
    ]);
    return {
      outreach: (outreach.data ?? []) as CrmOutreach[],
      meetings: (meetings.data ?? []) as CrmMeeting[],
    };
  });

// ─── Write ────────────────────────────────────────────────────────────────────

const ContactInput = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(255).or(z.literal("")).optional(),
  phone: z.string().trim().max(40).optional(),
  job_title: z.string().trim().max(160).optional(),
  company_id: z.string().uuid().nullish(),
  contact_type: z.string().trim().max(60).optional(),
  sector: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  notes: z.string().trim().max(4000).optional(),
  source: z.string().trim().max(120).optional(),
});

export const upsertContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ContactInput.parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "add or edit contacts");

    const row = {
      workspace_id: workspaceId,
      full_name: data.full_name,
      // Empty strings would defeat the partial unique indexes, which only
      // apply where the column is non-null and non-empty.
      email: data.email?.toLowerCase() || null,
      phone: data.phone || null,
      job_title: data.job_title || null,
      company_id: data.company_id ?? null,
      contact_type: data.contact_type || null,
      sector: data.sector || null,
      country: data.country || null,
      tags: data.tags ?? [],
      notes: data.notes || null,
      source: data.source || null,
      updated_at: new Date().toISOString(),
    };

    const q = data.id
      ? cdb().from("crm_contacts").update(row).eq("id", data.id).eq("workspace_id", workspaceId)
      : cdb()
          .from("crm_contacts")
          .insert({ ...row, created_by: context.userId });

    const { error } = await q;
    if (error) {
      if (/uq_crm_contacts_email/.test(error.message)) {
        throw new Error("Someone in this workspace already has that email address.");
      }
      if (/uq_crm_contacts_phone/.test(error.message)) {
        throw new Error("Someone in this workspace already has that phone number.");
      }
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const deleteContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "delete contacts");
    await cdb().from("crm_contacts").delete().eq("id", data.id).eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

export const upsertCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(160),
        is_client: z.boolean().optional(),
        client_type: z.enum(["brand", "organiser", "agency", "institution", "creator"]).nullish(),
        sector: z.string().trim().max(80).optional(),
        country: z.string().trim().max(80).optional(),
        website: z.string().trim().max(300).optional(),
        notes: z.string().trim().max(4000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "add or edit companies");

    const row = {
      workspace_id: workspaceId,
      name: data.name,
      is_client: data.is_client ?? false,
      client_type: data.client_type ?? null,
      sector: data.sector || null,
      country: data.country || null,
      website: data.website || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = data.id
      ? await cdb()
          .from("crm_companies")
          .update(row)
          .eq("id", data.id)
          .eq("workspace_id", workspaceId)
      : await cdb()
          .from("crm_companies")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const DealInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  stage_id: z.string().uuid().nullish(),
  contact_id: z.string().uuid().nullish(),
  company_id: z.string().uuid().nullish(),
  event_id: z.string().uuid().nullish(),
  value_amount: z.number().nonnegative().nullish(),
  value_currency: z.string().trim().max(10).optional(),
  probability: z.number().int().min(0).max(100).nullish(),
  expected_close: z.string().trim().max(20).nullish(),
  assignee_id: z.string().uuid().nullish(),
  notes: z.string().trim().max(4000).optional(),
});

export const upsertDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => DealInput.parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "add or edit deals");

    const row = {
      workspace_id: workspaceId,
      title: data.title,
      stage_id: data.stage_id ?? null,
      contact_id: data.contact_id ?? null,
      company_id: data.company_id ?? null,
      event_id: data.event_id ?? null,
      value_amount: data.value_amount ?? null,
      value_currency: data.value_currency || "NGN",
      probability: data.probability ?? null,
      expected_close: data.expected_close || null,
      assignee_id: data.assignee_id ?? null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = data.id
      ? await cdb().from("crm_deals").update(row).eq("id", data.id).eq("workspace_id", workspaceId)
      : await cdb()
          .from("crm_deals")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Dragging a card between columns. Kept separate so it stays a one-field write. */
export const moveDealToStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ deal_id: z.string().uuid(), stage_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "move deals");
    const { error } = await cdb()
      .from("crm_deals")
      .update({ stage_id: data.stage_id, updated_at: new Date().toISOString() })
      .eq("id", data.deal_id)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const logOutreach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        contact_id: z.string().uuid(),
        deal_id: z.string().uuid().nullish(),
        channel: z.enum(["email", "call", "whatsapp", "meeting", "event", "other"]),
        outcome: z.string().trim().max(400).optional(),
        notes: z.string().trim().max(4000).optional(),
        next_follow_up: z.string().trim().max(20).nullish(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "log outreach");
    const { error } = await cdb()
      .from("crm_outreach")
      .insert({
        workspace_id: workspaceId,
        contact_id: data.contact_id,
        deal_id: data.deal_id ?? null,
        channel: data.channel,
        outcome: data.outcome || null,
        notes: data.notes || null,
        next_follow_up: data.next_follow_up || null,
        created_by: context.userId,
      });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const logMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        contact_id: z.string().uuid(),
        deal_id: z.string().uuid().nullish(),
        held_at: z.string().trim().max(40).optional(),
        attendees: z.string().trim().max(500).optional(),
        notes: z.string().trim().max(4000).optional(),
        decisions: z.string().trim().max(4000).optional(),
        next_steps: z.string().trim().max(4000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "log meetings");
    const { error } = await cdb()
      .from("crm_meetings")
      .insert({
        workspace_id: workspaceId,
        contact_id: data.contact_id,
        deal_id: data.deal_id ?? null,
        held_at: data.held_at || new Date().toISOString(),
        attendees: data.attendees || null,
        notes: data.notes || null,
        decisions: data.decisions || null,
        next_steps: data.next_steps || null,
        created_by: context.userId,
      });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/**
 * CSV import with duplicate detection by email and phone (§4.4.2).
 *
 * Rows are inserted one at a time rather than in a batch: a batch fails whole
 * on the first duplicate, which on a 300-row import means importing nothing
 * because one contact was already on file. Per-row means the duplicates are
 * reported and everything else lands.
 */
export const importContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        rows: z
          .array(ContactInput.omit({ id: true }))
          .min(1)
          .max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "import contacts");

    let imported = 0;
    const duplicates: string[] = [];
    const failed: string[] = [];

    for (const r of data.rows) {
      const { error } = await cdb()
        .from("crm_contacts")
        .insert({
          workspace_id: workspaceId,
          full_name: r.full_name,
          email: r.email?.toLowerCase() || null,
          phone: r.phone || null,
          job_title: r.job_title || null,
          company_id: r.company_id ?? null,
          contact_type: r.contact_type || null,
          sector: r.sector || null,
          country: r.country || null,
          tags: r.tags ?? [],
          notes: r.notes || null,
          source: r.source || "CSV import",
          created_by: context.userId,
        });
      if (!error) imported += 1;
      else if (/uq_crm_contacts_(email|phone)/.test(error.message)) duplicates.push(r.full_name);
      else failed.push(r.full_name);
    }

    return { imported, duplicates, failed };
  });
