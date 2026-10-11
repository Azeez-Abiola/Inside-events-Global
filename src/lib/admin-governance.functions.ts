import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getActorProfile, requireAdminPermission, requireSuperAdmin } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { notifyAdmins } from "@/lib/admin-notify";
import { assertAdminMfa } from "@/lib/admin-mfa.server";
import { DUAL_ACTION_LABEL, openDualControl, type DualAction } from "@/lib/dual-control.server";
import { performSuspension } from "@/lib/suspension.server";
import { performMatchApproval } from "@/lib/matching/approve.server";
import { performErasure } from "@/lib/account-lifecycle.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Admin governance over user records (TAB 6 §6.2.2, §6.2.4, §6.9).
 *
 * Admin may edit any onboarding field on a user's behalf, but every edit is
 * audited with before/after values, always tells the user exactly what
 * changed and why, and flags already-approved events for re-vetting when the
 * change touches vetting-relevant data. "View as User" is read-only; "Act as
 * User" needs a second Super Admin's sign-off before it can be used.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gdb = () => supabaseAdmin as any;

type Row = Record<string, unknown>;
export type FieldKind = "text" | "number" | "bool" | "list" | "json";
export type EditField = {
  name: string;
  kind: FieldKind;
  value: string;
  vetting: boolean;
  file: boolean;
};
export type EditSection = { key: string; label: string; fields: EditField[] };

const ROLE_TABLES = [
  ["organiser_profiles", "Organiser profile"],
  ["sponsor_profiles", "Sponsor profile"],
  ["referral_partner_profiles", "Referral partner profile"],
  ["media_partner_profiles", "Media partner profile"],
] as const;

/**
 * Identity, system and workflow columns Admin never edits here. The email is
 * the person's own verified sign-in identity (TAB 2); status and vetting
 * columns move through their own audited workflows.
 */
const LOCKED = new Set([
  "id",
  "user_id",
  "email",
  "email_domain",
  "google_id",
  "linkedin_id",
  "created_at",
  "updated_at",
  "is_active",
  "is_suspended",
  "suspension_reason",
  "last_login_at",
  "profile_complete",
  "organiser_id",
  "status",
  "slug",
  "vetted_at",
  "vetted_by",
  "ige_vetted",
  "vetting_notes",
  "rejection_reason",
  "view_count",
  "save_count",
  "inquiry_count",
  "form_data_draft",
  "form_step_completed",
  "consent_given",
  "consent_given_at",
  "total_earned_usd",
  "deals_closed",
  "matching_paused",
  "is_featured",
  "featured_at",
  "featured_by_admin_id",
  "feature_expires_at",
  "moved_to_past_at",
  "next_edition_event_id",
  "revetting_flagged_at",
  "revetting_reason",
  "readiness_dormancy_flagged_at",
]);

/** Data that changes what a sponsor was already told about a listed event. */
const VETTING_RELEVANT =
  /attend|audience|decision|sponsor|tier|budget|sector|categor|geograph|seniority|edition|years_running|exposure|media_partners|min_sponsorship/i;

function kindOf(v: unknown): FieldKind {
  if (typeof v === "number") return "number";
  if (typeof v === "boolean") return "bool";
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return "list";
  if (v !== null && typeof v === "object") return "json";
  return "text";
}

function serialise(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v.join("\n");
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

function parseAs(kind: FieldKind, raw: string): unknown {
  const s = raw.trim();
  if (kind === "number") {
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) throw new Error(`"${raw}" is not a number`);
    return n;
  }
  if (kind === "bool") return s === "true";
  if (kind === "list")
    return s
      ? s
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean)
      : [];
  if (kind === "json") {
    if (!s) return null;
    try {
      return JSON.parse(s);
    } catch {
      throw new Error("That value must be valid JSON");
    }
  }
  return s === "" ? null : raw;
}

const human = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const short = (v: unknown) => {
  const s = serialise(v).replace(/\s+/g, " ").trim();
  return s ? (s.length > 120 ? `${s.slice(0, 117)}…` : s) : "(empty)";
};

function toFields(row: Row, filter?: (k: string) => boolean): EditField[] {
  return Object.entries(row)
    .filter(([k]) => !LOCKED.has(k) && (!filter || filter(k)))
    .map(([name, v]) => ({
      name,
      kind: kindOf(v),
      value: serialise(v),
      vetting: VETTING_RELEVANT.test(name),
      file: /_url$|_urls$|logo|photo|deck|document|showreel|portfolio/i.test(name),
    }));
}

/** Everything about one user that Admin can edit, grouped as on their wizard. */
async function loadSections(userId: string): Promise<{
  sections: EditSection[];
  rows: Map<string, { table: string; id: string; row: Row; sectionKey?: string }>;
}> {
  const rows = new Map<string, { table: string; id: string; row: Row; sectionKey?: string }>();
  const sections: EditSection[] = [];

  const { data: profile } = await gdb().from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!profile) throw new Error("User not found");
  rows.set("profiles", { table: "profiles", id: userId, row: profile });
  sections.push({ key: "profiles", label: "Account", fields: toFields(profile) });

  for (const [table, label] of ROLE_TABLES) {
    const { data } = await gdb().from(table).select("*").eq("user_id", userId).maybeSingle();
    if (!data) continue;
    rows.set(table, { table, id: data.id, row: data });
    sections.push({ key: table, label, fields: toFields(data) });
  }

  const { data: app } = await gdb()
    .from("onboarding_applications")
    .select("id, role, sections")
    .eq("user_id", userId)
    .maybeSingle();
  if (app?.sections && typeof app.sections === "object") {
    for (const [letter, body] of Object.entries(app.sections as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    )) {
      if (!body || typeof body !== "object" || Array.isArray(body)) continue;
      const key = `onboarding:${letter}`;
      rows.set(key, {
        table: "onboarding_applications",
        id: app.id,
        row: body as Row,
        sectionKey: letter,
      });
      sections.push({
        key,
        label: `Onboarding section ${letter.toUpperCase()}`,
        fields: toFields(body as Row),
      });
    }
  }

  const { data: events } = await gdb()
    .from("events")
    .select("*")
    .eq("organiser_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  for (const ev of (events ?? []) as Row[]) {
    const key = `event:${ev.id}`;
    rows.set(key, { table: "events", id: String(ev.id), row: ev });
    sections.push({
      key,
      label: `Event: ${String(ev.name ?? "Untitled")} (${String(ev.status)})`,
      fields: toFields(ev),
    });
  }
  return { sections, rows };
}

/** In-app notification plus email, so the user is never unaware (§6.2.2). */
async function tellUser(
  userId: string,
  input: { title: string; lines: string[]; ctaPath: string; key: string },
) {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: "admin_change",
    title: input.title,
    body: input.lines.join("\n"),
    data: { link: input.ctaPath },
  });
  const { data: p } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (!p?.email) return;
  const first = (p.display_name ?? "").split(" ")[0] || "there";
  await sendTransactionalEmailServer({
    templateName: "ige-notice",
    recipientEmail: p.email,
    idempotencyKey: input.key,
    templateData: {
      subject: input.title,
      heading: input.title,
      lines: [`Hi ${first},`, ...input.lines],
      ctaLabel: "Open IGE",
      ctaUrl: `${getSiteUrl()}${input.ctaPath}`,
    },
  }).catch(() => {});
}

export const getEditableUserRecord = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "users_edit");
    const { sections } = await loadSections(data.user_id);
    return { sections };
  });

const EditInput = z.object({
  user_id: z.string().uuid(),
  reason: z.string().trim().min(5, "Say why — the user is told").max(1000),
  changes: z
    .array(
      z.object({
        section: z.string().max(80),
        field: z.string().max(80),
        value: z.string().max(20000),
      }),
    )
    .min(1)
    .max(100),
});

export const adminEditUserRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof EditInput>) => EditInput.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "users_edit");
    assertAdminMfa(context.claims);
    const { data: targetRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id);
    if (targetRoles?.some((r) => r.role === "super_admin") && data.user_id !== context.userId) {
      throw new Error("A super admin's record can only be edited by that super admin");
    }

    const { rows } = await loadSections(data.user_id);
    type Change = {
      section: string;
      field: string;
      before: unknown;
      after: unknown;
      vetting: boolean;
    };
    const applied: Change[] = [];
    const patches = new Map<string, Row>();

    for (const c of data.changes) {
      const target = rows.get(c.section);
      if (!target) throw new Error(`Unknown section ${c.section}`);
      if (LOCKED.has(c.field)) throw new Error(`${human(c.field)} can't be edited here`);
      if (!(c.field in target.row))
        throw new Error(`${human(c.field)} is not a field on this record`);
      const before = target.row[c.field];
      const after = parseAs(before == null ? "text" : kindOf(before), c.value);
      if (JSON.stringify(before ?? null) === JSON.stringify(after ?? null)) continue;
      patches.set(c.section, { ...(patches.get(c.section) ?? {}), [c.field]: after });
      applied.push({
        section: c.section,
        field: c.field,
        before,
        after,
        vetting: VETTING_RELEVANT.test(c.field),
      });
    }
    if (!applied.length) return { changed: 0, revetting: 0 };

    for (const [section, patch] of patches) {
      const t = rows.get(section)!;
      if (t.table === "onboarding_applications") {
        // Re-read and merge so a concurrent wizard save isn't overwritten.
        const { data: app } = await gdb()
          .from("onboarding_applications")
          .select("sections")
          .eq("id", t.id)
          .single();
        const all = { ...(app?.sections ?? {}) } as Record<string, Row>;
        all[t.sectionKey!] = { ...(all[t.sectionKey!] ?? {}), ...patch };
        const { error } = await gdb()
          .from("onboarding_applications")
          .update({ sections: all })
          .eq("id", t.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await gdb().from(t.table).update(patch).eq("id", t.id);
        if (error) throw new Error(error.message);
      }
    }

    // Re-vetting: an approved or listed event whose vetting data moved.
    let revetting = 0;
    if (applied.some((c) => c.vetting)) {
      const eventSections = new Set(
        applied
          .filter((c) => c.vetting && c.section.startsWith("event:"))
          .map((c) => c.section.slice(6)),
      );
      const profileLevel = applied.some((c) => c.vetting && !c.section.startsWith("event:"));
      const { data: live } = await gdb()
        .from("events")
        .select("id, name, status")
        .eq("organiser_id", data.user_id)
        .in("status", ["approved", "listed"]);
      const flagged = ((live ?? []) as { id: string; name: string }[]).filter(
        (e) => profileLevel || eventSections.has(e.id),
      );
      const why = `Admin edited ${applied
        .filter((c) => c.vetting)
        .map((c) => human(c.field))
        .join(", ")}: ${data.reason}`;
      for (const e of flagged) {
        const { error } = await gdb()
          .from("events")
          .update({
            revetting_flagged_at: new Date().toISOString(),
            revetting_reason: why.slice(0, 1000),
          })
          .eq("id", e.id);
        if (error && !/revetting/.test(error.message)) throw new Error(error.message);
        revetting++;
        await notifyAdmins({
          type: "revetting_flagged",
          title: `Re-vet "${e.name}"`,
          body: why,
          data: { event_id: e.id, user_id: data.user_id, link: "/dashboard/vetting" },
        }).catch(() => {});
      }
    }

    const actor = await getActorProfile(context.userId);
    await recordAdminAudit({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "user_profile_edited",
      summary: `Edited ${applied.length} field${applied.length === 1 ? "" : "s"} on a user record: ${data.reason}`,
      resourceType: "user",
      resourceId: data.user_id,
      metadata: {
        reason: data.reason,
        changes: applied.map(({ section, field, before, after }) => ({
          section,
          field,
          before,
          after,
        })),
        revetting,
      },
    });

    await tellUser(data.user_id, {
      title: "IGE updated your profile",
      lines: [
        `Our team changed ${applied.length === 1 ? "one detail" : `${applied.length} details`} on your IGE record.`,
        `Why: ${data.reason}`,
        ...applied
          .slice(0, 15)
          .map((c) => `• ${human(c.field)}: ${short(c.before)} → ${short(c.after)}`),
        ...(applied.length > 15 ? [`…and ${applied.length - 15} more.`] : []),
        ...(revetting
          ? [
              "Because this touches vetting data, IGE will re-check your listed event. It stays listed meanwhile.",
            ]
          : []),
        "If anything looks wrong, reply through Message IGE.",
      ],
      ctaPath: "/messages",
      key: `admin-edit-${data.user_id}-${Date.now()}`,
    });
    return { changed: applied.length, revetting };
  });

const UploadInput = z.object({
  user_id: z.string().uuid(),
  filename: z.string().trim().min(1).max(200),
  content_type: z.string().max(120),
  base64: z.string().max(14_000_000, "Files must be 10 MB or smaller"),
});

/**
 * Upload a file into a user's document slot when they can't do it
 * themselves (§6.2.2). Returns the URL; the admin then saves it into the
 * field through adminEditUserRecord, which audits and notifies as usual.
 */
export const adminUploadForUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof UploadInput>) => UploadInput.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "users_edit");
    assertAdminMfa(context.claims);
    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("Files must be 10 MB or smaller");
    const safe = data.filename.replace(/[^\w.-]+/g, "_").slice(-100);
    const path = `admin-uploads/${data.user_id}/${Date.now()}-${safe}`;
    const { error } = await supabaseAdmin.storage.from("event-assets").upload(path, bytes, {
      contentType: data.content_type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from("event-assets").getPublicUrl(path);
    const actor = await getActorProfile(context.userId);
    await recordAdminAudit({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "user_file_uploaded",
      summary: `Uploaded ${safe} on a user's behalf`,
      resourceType: "user",
      resourceId: data.user_id,
      metadata: { path },
    });
    return { url: pub.publicUrl };
  });

// ── View as User (read-only) ─────────────────────────────────────────

export type UserSnapshot = {
  name: string;
  email: string | null;
  roles: string[];
  joined: string;
  lastLogin: string | null;
  active: boolean;
  suspended: boolean;
  workspaces: { name: string; role: string }[];
  events: {
    id: string;
    name: string;
    status: string;
    start_date: string | null;
    attendance_size: number | null;
  }[];
  deals: {
    id: string;
    status: string;
    value: number | null;
    currency: string | null;
    event: string | null;
    side: string;
  }[];
  budgets: { market: string; total: number; currency: string }[];
  readiness: number | null;
  matches: { status: string; pairing_type: string; total: number }[];
  payments: { direction: string; status: string; amount: number; currency: string }[];
  notifications: { title: string; created_at: string }[];
  inboxThreads: number;
};

const num = (v: unknown) => (v == null ? null : Number(v));

export const getUserSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<UserSnapshot> => {
    await requireAdminPermission(context.userId, "users_view");
    const uid = data.user_id;
    const safe = async <T>(q: PromiseLike<{ data: T | null }>): Promise<T | null> => {
      try {
        return (await q).data;
      } catch {
        return null;
      }
    };
    const [
      profileRow,
      roles,
      members,
      events,
      deals,
      budgets,
      readiness,
      matches,
      payments,
      notes,
      threads,
    ] = await Promise.all([
      safe(
        gdb()
          .from("profiles")
          .select("display_name, email, created_at, last_login_at, is_active, is_suspended")
          .eq("id", uid)
          .maybeSingle(),
      ),
      safe(gdb().from("user_roles").select("role").eq("user_id", uid)),
      safe(gdb().from("workspace_members").select("role, workspaces(name)").eq("user_id", uid)),
      safe(
        gdb()
          .from("events")
          .select("id, name, status, start_date, attendance_size")
          .eq("organiser_id", uid)
          .order("start_date", { ascending: false })
          .limit(20),
      ),
      safe(
        gdb()
          .from("deals")
          .select(
            "id, status, deal_value_native, deal_currency, organiser_id, sponsor_user_id, events(name)",
          )
          .or(`organiser_id.eq.${uid},sponsor_user_id.eq.${uid}`)
          .order("updated_at", { ascending: false })
          .limit(20),
      ),
      safe(
        gdb()
          .from("market_budgets")
          .select("market_name, total_annual, currency")
          .eq("sponsor_user_id", uid),
      ),
      safe(
        gdb()
          .from("readiness_scores")
          .select("composite_score, events!inner(organiser_id)")
          .eq("events.organiser_id", uid)
          .order("computed_at", { ascending: false })
          .limit(1),
      ),
      safe(
        gdb()
          .from("match_scores")
          .select("queue_status, pairing_type")
          .or(`subject_user_id.eq.${uid},candidate_user_id.eq.${uid}`),
      ),
      safe(
        gdb()
          .from("workspace_payments")
          .select("direction, status, amount, currency")
          .eq("created_by", uid)
          .limit(200),
      ),
      safe(
        gdb()
          .from("notifications")
          .select("title, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(10),
      ),
      safe(gdb().from("admin_inbox_threads").select("id").eq("user_id", uid).limit(500)),
    ]);
    if (!profileRow) throw new Error("User not found");
    const profile = profileRow as {
      display_name: string | null;
      email: string | null;
      created_at: string;
      last_login_at: string | null;
      is_active: boolean;
      is_suspended: boolean;
    };

    const matchMap = new Map<string, { status: string; pairing_type: string; total: number }>();
    for (const m of (matches ?? []) as { queue_status: string; pairing_type: string }[]) {
      const k = `${m.pairing_type}|${m.queue_status}`;
      matchMap.set(k, {
        status: m.queue_status,
        pairing_type: m.pairing_type,
        total: (matchMap.get(k)?.total ?? 0) + 1,
      });
    }
    const payMap = new Map<
      string,
      { direction: string; status: string; amount: number; currency: string }
    >();
    for (const p of (payments ?? []) as {
      direction: string;
      status: string;
      amount: number;
      currency: string;
    }[]) {
      const k = `${p.direction}|${p.status}|${p.currency}`;
      payMap.set(k, {
        direction: p.direction,
        status: p.status,
        currency: p.currency,
        amount: (payMap.get(k)?.amount ?? 0) + Number(p.amount),
      });
    }

    await recordAdminAudit({
      actorId: context.userId,
      action: "user_viewed_as",
      summary: `Opened View as User for ${profile.display_name ?? profile.email ?? uid}`,
      resourceType: "user",
      resourceId: uid,
    }).catch(() => {});

    return {
      name: profile.display_name ?? profile.email ?? "User",
      email: profile.email ?? null,
      roles: ((roles ?? []) as { role: string }[]).map((r) => r.role),
      joined: profile.created_at,
      lastLogin: profile.last_login_at ?? null,
      active: !!profile.is_active,
      suspended: !!profile.is_suspended,
      workspaces: ((members ?? []) as { role: string; workspaces: { name: string } | null }[]).map(
        (m) => ({ name: m.workspaces?.name ?? "Workspace", role: m.role }),
      ),
      events: ((events ?? []) as UserSnapshot["events"]).map((e) => ({
        ...e,
        attendance_size: num(e.attendance_size),
      })),
      deals: ((deals ?? []) as (Row & { events: { name: string } | null })[]).map((d) => ({
        id: String(d.id),
        status: String(d.status),
        value: num(d.deal_value_native),
        currency: (d.deal_currency as string | null) ?? null,
        event: d.events?.name ?? null,
        side: d.organiser_id === uid ? "organiser" : "sponsor",
      })),
      budgets: ((budgets ?? []) as Row[]).map((b) => ({
        market: String(b.market_name),
        total: Number(b.total_annual ?? 0),
        currency: String(b.currency ?? "USD"),
      })),
      readiness: num(((readiness ?? []) as { composite_score: number }[])[0]?.composite_score),
      matches: [...matchMap.values()],
      payments: [...payMap.values()],
      notifications: (notes ?? []) as UserSnapshot["notifications"],
      inboxThreads: ((threads ?? []) as unknown[]).length,
    };
  });

// ── Dual control: Act as User, suspension, Managed Service matches, erasure ──────────────────────────────────────

export type DualControlRequest = {
  id: string;
  action: string;
  action_label: string;
  status: string;
  reason: string;
  target_user_id: string;
  target_name: string;
  requested_by: string;
  requester_name: string;
  decided_by_name: string | null;
  decision_note: string | null;
  expires_at: string | null;
  created_at: string;
  mine: boolean;
};

const APPROVAL_MINUTES = 30;

export const requestActAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; reason: string }) =>
    z
      .object({
        user_id: z.string().uuid(),
        reason: z.string().trim().min(10, "Give a specific reason").max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "users_edit");
    assertAdminMfa(context.claims);
    if (data.user_id === context.userId) throw new Error("You can't act as yourself");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id);
    if (roles?.some((r) => r.role === "super_admin" || r.role === "abw_admin"))
      throw new Error("Act as User is not available for admin accounts");
    const id = await openDualControl({
      action: "act_as_user",
      targetUserId: data.user_id,
      requestedBy: context.userId,
      reason: data.reason,
    });
    return { id };
  });

export const listDualControlRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DualControlRequest[]> => {
    await requireAdminPermission(context.userId, "users_view");
    // Lapse unused approvals first so the list is honest.
    await gdb()
      .from("dual_control_requests")
      .update({ status: "expired" })
      .eq("status", "approved")
      .lt("expires_at", new Date().toISOString());
    const { data } = await gdb()
      .from("dual_control_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = (data ?? []) as Row[];
    const ids = [
      ...new Set(
        rows.flatMap((r) => [r.target_user_id, r.requested_by, r.decided_by]).filter(Boolean),
      ),
    ] as string[];
    const { data: people } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, display_name, email").in("id", ids)
      : { data: [] };
    const name = (id: unknown) => {
      const p = (people ?? []).find((x) => x.id === id);
      return p?.display_name ?? p?.email ?? "Unknown";
    };
    return rows.map((r) => ({
      id: String(r.id),
      action: String(r.action),
      action_label: DUAL_ACTION_LABEL[r.action as DualAction] ?? String(r.action),
      status: String(r.status),
      reason: String(r.reason),
      target_user_id: String(r.target_user_id),
      target_name: name(r.target_user_id),
      requested_by: String(r.requested_by),
      requester_name: name(r.requested_by),
      decided_by_name: r.decided_by ? name(r.decided_by) : null,
      decision_note: (r.decision_note as string | null) ?? null,
      expires_at: (r.expires_at as string | null) ?? null,
      created_at: String(r.created_at),
      mine: r.requested_by === context.userId,
    }));
  });

export const decideDualControl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; approve: boolean; note?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        approve: z.boolean(),
        note: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.userId);
    assertAdminMfa(context.claims);
    const { data: req } = await gdb()
      .from("dual_control_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("This request has already been decided");
    if (req.requested_by === context.userId)
      throw new Error("A second Super Admin must sign off — not the person who asked");
    const action = req.action as DualAction;
    const label = DUAL_ACTION_LABEL[action] ?? action;
    const now = new Date();
    // Claim the request first so two approvers can't both carry it out.
    const { data: claimed, error } = await gdb()
      .from("dual_control_requests")
      .update({
        status: data.approve ? "approved" : "denied",
        decided_by: context.userId,
        decided_at: now.toISOString(),
        decision_note: data.note ?? null,
        expires_at:
          data.approve && action === "act_as_user"
            ? new Date(now.getTime() + APPROVAL_MINUTES * 60_000).toISOString()
            : null,
      })
      .eq("id", data.id)
      .eq("status", "pending")
      .select("id");
    if (error) throw new Error(error.message);
    if (!claimed?.length) throw new Error("This request has already been decided");

    // Everything except Act as User takes effect on approval.
    if (data.approve && action !== "act_as_user") {
      try {
        await carryOut(action, req, context.userId);
        await gdb()
          .from("dual_control_requests")
          .update({ status: "used", used_at: new Date().toISOString() })
          .eq("id", data.id);
      } catch (e) {
        await gdb()
          .from("dual_control_requests")
          .update({ status: "pending", decided_by: null, decided_at: null })
          .eq("id", data.id);
        throw e;
      }
    }

    const actor = await getActorProfile(context.userId);
    await recordAdminAudit({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "dual_control_decided",
      summary: `${data.approve ? "Approved" : "Denied"} ${label} (dual control)${data.note ? `: ${data.note}` : ""}`,
      resourceType: "user",
      resourceId: req.target_user_id,
      metadata: { request_id: data.id, requested_by: req.requested_by, action, dual_control: true },
    });
    return { ok: true };
  });

async function carryOut(action: DualAction, req: Row, approverId: string) {
  const requester = String(req.requested_by);
  const target = String(req.target_user_id);
  const payload = (req.payload ?? {}) as Record<string, unknown>;
  if (action === "suspend_user") {
    await performSuspension(requester, {
      user_id: target,
      suspended: true,
      reason: String(req.reason),
    });
    return;
  }
  if (action === "approve_match") {
    const { data: m } = await gdb()
      .from("match_scores")
      .select("*")
      .eq("id", payload.match_id)
      .maybeSingle();
    if (!m) throw new Error("That match no longer exists.");
    if (m.queue_status === "approved") throw new Error("That match is already approved.");
    if (m.subject_user_id === approverId || m.candidate_user_id === approverId) {
      throw new Error("You are a party to this match. Another Super Admin must sign off.");
    }
    await performMatchApproval(requester, m, {
      proposed_slots: (payload.proposed_slots as string[]) ?? [],
      video_call_url: String(payload.video_call_url ?? ""),
      note: (payload.note as string | null) ?? null,
    });
    return;
  }
  if (action === "erase_user") {
    await performErasure(target, {
      requestedBy: requester,
      approvedBy: approverId,
      reason: String(req.reason),
    });
  }
}

/**
 * Use an approved Act as User request: issues a single-use sign-in link for
 * the user, to be opened in a private window. The user is told it happened.
 */
export const enterActAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "users_edit");
    assertAdminMfa(context.claims);
    const { data: req } = await gdb()
      .from("dual_control_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!req || req.requested_by !== context.userId) throw new Error("Request not found");
    if (req.status !== "approved") throw new Error("This request is not approved");
    if (!req.expires_at || new Date(req.expires_at) < new Date()) {
      await gdb().from("dual_control_requests").update({ status: "expired" }).eq("id", data.id);
      throw new Error("The approval window has passed. Ask again.");
    }
    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", req.target_user_id)
      .maybeSingle();
    if (!target?.email) throw new Error("That user has no email to sign in with");
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: target.email,
      options: { redirectTo: `${getSiteUrl()}/dashboard` },
    });
    if (error || !link?.properties?.action_link)
      throw new Error(error?.message ?? "Could not create the sign-in link");
    const { error: useErr } = await gdb()
      .from("dual_control_requests")
      .update({ status: "used", used_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("status", "approved");
    if (useErr) throw new Error(useErr.message);
    const actor = await getActorProfile(context.userId);
    await recordAdminAudit({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "act_as_used",
      summary: `Entered Act as User for ${target.display_name ?? target.email}: ${req.reason}`,
      resourceType: "user",
      resourceId: req.target_user_id,
      metadata: { request_id: data.id, approved_by: req.decided_by, dual_control: true },
    });
    await tellUser(req.target_user_id, {
      title: "IGE support accessed your account",
      lines: [
        "A member of the IGE team signed in to your account to help, with a second senior admin's approval.",
        `Why: ${req.reason}`,
        "Every action taken is logged. If you didn't expect this, reply through Message IGE.",
      ],
      ctaPath: "/messages",
      key: `act-as-${data.id}`,
    });
    return { url: link.properties.action_link };
  });
