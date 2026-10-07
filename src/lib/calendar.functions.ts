import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notifyAdmins } from "@/lib/admin-notify";
import { assertCan, type WorkspaceRole } from "@/lib/workspace-permissions";

/**
 * Event Calendar and early co-creation (TAB 4 §4.4.1).
 *
 * The calendar is a union rather than a table: a user's own events, the
 * entries they add by hand, their CRM follow-ups and their logged meetings all
 * surface on one surface. Follow-ups are read from the CRM rather than copied
 * into a calendar row, so a date changed in one place cannot disagree with the
 * other.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   calendar_entries, budget_windows and cocreation_interests postdate the last
   `supabase gen types` run; same cast convention as odb()/cdb() elsewhere. */
const kdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type CalendarSource = "event" | "entry" | "follow_up" | "meeting";

export interface CalendarItem {
  id: string;
  source: CalendarSource;
  title: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  /** entry_type for entries, planning_status for events. */
  kind: string | null;
  event_id: string | null;
  contact_id: string | null;
  notes: string | null;
  /** Private events are the owner's own business and marked as such. */
  is_private: boolean;
}

export interface BudgetWindow {
  id: string;
  label: string;
  starts_on: string;
  ends_on: string;
  notes: string | null;
}

export interface ForwardEvent {
  id: string;
  slug: string | null;
  name: string;
  event_type: string | null;
  city: string | null;
  country: string | null;
  start_date: string | null;
  primary_sector: string | null;
  attendance_size: number | null;
  planning_status: string;
  banner_image_url: string | null;
  looking_to_connect_with: string[] | null;
  /** True when the date falls inside one of the viewer's budget windows. */
  in_budget_window: boolean;
}

async function activeWorkspace(
  userId: string,
): Promise<{ workspaceId: string; role: WorkspaceRole }> {
  const { data: profile } = await kdb()
    .from("profiles")
    .select("active_workspace_id")
    .eq("id", userId)
    .maybeSingle();

  let workspaceId: string | null = profile?.active_workspace_id ?? null;
  if (!workspaceId) {
    const { data: healed } = await kdb().rpc("ensure_personal_workspace", { _user_id: userId });
    workspaceId = (healed as string | null) ?? null;
  }
  if (!workspaceId) throw new Error("No workspace found for this account.");

  const { data: member } = await kdb()
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!member) throw new Error("You do not have access to this workspace.");

  return { workspaceId, role: member.role as WorkspaceRole };
}

// ─── The calendar ─────────────────────────────────────────────────────────────

export const getCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ from: z.string().max(40), to: z.string().max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);

    // Workspace members whose events belong on this calendar. Events are still
    // owned by a person (organiser_id), so a team calendar is the union of its
    // members' events.
    const { data: members } = await kdb()
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .eq("status", "active");
    const memberIds = ((members ?? []) as { user_id: string | null }[])
      .map((m) => m.user_id)
      .filter((id): id is string => !!id);

    const [events, entries, followUps, meetings, windows] = await Promise.all([
      memberIds.length
        ? kdb()
            .from("events")
            .select("id, name, start_date, end_date, planning_status, visibility, status")
            .in("organiser_id", memberIds)
            .not("start_date", "is", null)
            .gte("start_date", data.from)
            .lte("start_date", data.to)
        : Promise.resolve({ data: [] }),
      kdb()
        .from("calendar_entries")
        .select("*")
        .eq("workspace_id", workspaceId)
        .gte("starts_at", data.from)
        .lte("starts_at", data.to),
      kdb()
        .from("crm_outreach")
        .select("id, contact_id, next_follow_up, outcome, channel")
        .eq("workspace_id", workspaceId)
        .not("next_follow_up", "is", null)
        .gte("next_follow_up", data.from)
        .lte("next_follow_up", data.to),
      kdb()
        .from("crm_meetings")
        .select("id, contact_id, held_at, attendees, notes")
        .eq("workspace_id", workspaceId)
        .gte("held_at", data.from)
        .lte("held_at", data.to),
      kdb().from("budget_windows").select("*").eq("workspace_id", workspaceId).order("starts_on"),
    ]);

    const items: CalendarItem[] = [];

    for (const e of (events.data ?? []) as Record<string, string | null>[]) {
      items.push({
        id: `event:${e.id}`,
        source: "event",
        title: e.name ?? "Untitled event",
        starts_at: e.start_date!,
        ends_at: e.end_date ?? null,
        all_day: true,
        kind: e.planning_status ?? null,
        event_id: e.id ?? null,
        contact_id: null,
        notes: null,
        is_private: e.visibility === "private",
      });
    }

    for (const c of (entries.data ?? []) as Record<string, string | boolean | null>[]) {
      items.push({
        id: `entry:${c.id}`,
        source: "entry",
        title: (c.title as string) ?? "Untitled",
        starts_at: c.starts_at as string,
        ends_at: (c.ends_at as string) ?? null,
        all_day: (c.all_day as boolean) ?? true,
        kind: (c.entry_type as string) ?? null,
        event_id: (c.event_id as string) ?? null,
        contact_id: (c.contact_id as string) ?? null,
        notes: (c.notes as string) ?? null,
        is_private: false,
      });
    }

    for (const f of (followUps.data ?? []) as Record<string, string | null>[]) {
      items.push({
        id: `follow_up:${f.id}`,
        source: "follow_up",
        title: `Follow up${f.outcome ? `: ${f.outcome}` : ""}`,
        starts_at: f.next_follow_up!,
        ends_at: null,
        all_day: true,
        kind: f.channel ?? null,
        event_id: null,
        contact_id: f.contact_id ?? null,
        notes: null,
        is_private: false,
      });
    }

    for (const m of (meetings.data ?? []) as Record<string, string | null>[]) {
      items.push({
        id: `meeting:${m.id}`,
        source: "meeting",
        title: m.attendees ? `Meeting — ${m.attendees}` : "Meeting",
        starts_at: m.held_at!,
        ends_at: null,
        all_day: false,
        kind: "meeting",
        event_id: null,
        contact_id: m.contact_id ?? null,
        notes: m.notes ?? null,
        is_private: false,
      });
    }

    items.sort((a, b) => a.starts_at.localeCompare(b.starts_at));

    return {
      myRole: role,
      items,
      budgetWindows: (windows.data ?? []) as BudgetWindow[],
    };
  });

// ─── Hand-added entries ───────────────────────────────────────────────────────

export const upsertCalendarEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(1).max(200),
        entry_type: z.enum(["milestone", "activation", "task", "meeting", "reminder", "other"]),
        starts_at: z.string().min(4).max(40),
        ends_at: z.string().max(40).nullish(),
        all_day: z.boolean().optional(),
        event_id: z.string().uuid().nullish(),
        contact_id: z.string().uuid().nullish(),
        assignee_id: z.string().uuid().nullish(),
        notes: z.string().trim().max(4000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "add calendar entries");

    const row = {
      workspace_id: workspaceId,
      title: data.title,
      entry_type: data.entry_type,
      starts_at: data.starts_at,
      ends_at: data.ends_at || null,
      all_day: data.all_day ?? true,
      event_id: data.event_id ?? null,
      contact_id: data.contact_id ?? null,
      assignee_id: data.assignee_id ?? null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = data.id
      ? await kdb()
          .from("calendar_entries")
          .update(row)
          .eq("id", data.id)
          .eq("workspace_id", workspaceId)
      : await kdb()
          .from("calendar_entries")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteCalendarEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "delete calendar entries");
    await kdb().from("calendar_entries").delete().eq("id", data.id).eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

export const setEventPlanningStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        event_id: z.string().uuid(),
        planning_status: z.enum(["idea", "planning", "confirmed", "live"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "change an event's planning status");

    // Ownership, not just workspace membership: an event belongs to a person.
    const { data: ev } = await kdb()
      .from("events")
      .select("organiser_id")
      .eq("id", data.event_id)
      .maybeSingle();
    if (!ev || ev.organiser_id !== context.userId) {
      throw new Error("You can only change the planning status of your own events.");
    }

    await kdb()
      .from("events")
      .update({ planning_status: data.planning_status })
      .eq("id", data.event_id);
    return { ok: true as const };
  });

// ─── Budget windows ───────────────────────────────────────────────────────────

export const upsertBudgetWindow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        label: z.string().trim().min(1).max(120),
        starts_on: z.string().min(4).max(20),
        ends_on: z.string().min(4).max(20),
        notes: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "set budget windows");
    if (data.ends_on < data.starts_on) throw new Error("The window ends before it starts.");

    const row = {
      workspace_id: workspaceId,
      label: data.label,
      starts_on: data.starts_on,
      ends_on: data.ends_on,
      notes: data.notes || null,
    };
    const { error } = data.id
      ? await kdb()
          .from("budget_windows")
          .update(row)
          .eq("id", data.id)
          .eq("workspace_id", workspaceId)
      : await kdb()
          .from("budget_windows")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteBudgetWindow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "remove budget windows");
    await kdb().from("budget_windows").delete().eq("id", data.id).eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

// ─── Forward Events Calendar ──────────────────────────────────────────────────

/**
 * What brands see: published events, plus planned events whose owner flagged
 * them Open to early co-creation.
 *
 * "It shows the event summary only, never the owner's contact details" — so
 * the select below is the whole contract. Adding organiser_id or any contact
 * column here would hand one user another user's details, which TAB 19 §19.1A
 * forbids outright.
 */
export const getForwardEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        sector: z.string().max(80).optional(),
        country: z.string().max(80).optional(),
        in_budget_window_only: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId } = await activeWorkspace(context.userId);

    let q = kdb()
      .from("events")
      .select(
        "id, slug, name, event_type, city, country, start_date, primary_sector, attendance_size, planning_status, banner_image_url, looking_to_connect_with, visibility, open_to_cocreation, status",
      )
      .gte("start_date", new Date().toISOString().slice(0, 10))
      .order("start_date");

    if (data.sector) q = q.eq("primary_sector", data.sector);
    if (data.country) q = q.eq("country", data.country);

    const { data: rows } = await q;

    const { data: windows } = await kdb()
      .from("budget_windows")
      .select("starts_on, ends_on")
      .eq("workspace_id", workspaceId);
    const ranges = (windows ?? []) as { starts_on: string; ends_on: string }[];

    const visible = ((rows ?? []) as Record<string, string | string[] | number | boolean | null>[])
      .filter((e) => {
        // A private event appears only if its owner opened it to co-creation.
        // §4.4.1: "Private events never appear on the Forward Events Calendar
        // unless the owner publishes them or flags them for co-creation."
        if (e.visibility === "private") return e.open_to_cocreation === true;
        return e.status === "approved" || e.status === "listed" || e.open_to_cocreation === true;
      })
      .map((e) => {
        const date = e.start_date as string | null;
        return {
          id: e.id as string,
          slug: (e.slug as string) ?? null,
          name: (e.name as string) ?? "Untitled event",
          event_type: (e.event_type as string) ?? null,
          city: (e.city as string) ?? null,
          country: (e.country as string) ?? null,
          start_date: date,
          primary_sector: (e.primary_sector as string) ?? null,
          attendance_size: (e.attendance_size as number) ?? null,
          planning_status: (e.planning_status as string) ?? "planning",
          banner_image_url: (e.banner_image_url as string) ?? null,
          looking_to_connect_with: (e.looking_to_connect_with as string[]) ?? null,
          in_budget_window: !!date && ranges.some((r) => date >= r.starts_on && date <= r.ends_on),
        } satisfies ForwardEvent;
      });

    return {
      events: data.in_budget_window_only ? visible.filter((e) => e.in_budget_window) : visible,
      hasBudgetWindows: ranges.length > 0,
    };
  });

/**
 * "Co-create this event" (§4.4.1).
 *
 * Routes to Admin exactly as a sponsorship interest does. The owner is not
 * told and gets no queue of interested brands — Admin reviews, and only if
 * approved does anyone hear about anyone.
 */
export const expressCoCreationInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        event_id: z.string().uuid(),
        message: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId } = await activeWorkspace(context.userId);

    const { data: ev } = await kdb()
      .from("events")
      .select("id, name, organiser_id")
      .eq("id", data.event_id)
      .maybeSingle();
    if (!ev) throw new Error("That event no longer exists.");
    if (ev.organiser_id === context.userId) {
      throw new Error("That is your own event.");
    }

    const { error } = await kdb()
      .from("cocreation_interests")
      .insert({
        event_id: data.event_id,
        workspace_id: workspaceId,
        user_id: context.userId,
        message: data.message || null,
      });
    if (error) {
      if (/uq_cocreation_pending/.test(error.message)) {
        return { ok: true as const, alreadyRaised: true };
      }
      throw new Error(error.message);
    }

    const { data: who } = await kdb()
      .from("profiles")
      .select("display_name, email")
      .eq("id", context.userId)
      .maybeSingle();

    await notifyAdmins({
      type: "cocreation_interest",
      title: "Co-creation interest",
      body: `${who?.display_name ?? who?.email ?? "A user"} wants to co-create "${ev.name}". Review it and, if approved, set up the meeting.`,
      data: { event_id: data.event_id, user_id: context.userId },
    }).catch(() => {});

    return { ok: true as const, alreadyRaised: false };
  });
