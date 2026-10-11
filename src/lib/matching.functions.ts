import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminPermission, requirePlatformAdmin } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";
import { loadWeights, runMatchmaking } from "@/lib/matching/engine.server";
import { whyLine, type Explanation } from "@/lib/matching/scoring";
import { notifyBoth, performMatchApproval } from "@/lib/matching/approve.server";
import { involvesManagedServiceClient, openDualControl } from "@/lib/dual-control.server";

/**
 * Match Approval Queue (TAB 19 §19.3A, TAB 6 §6.8) and the user-facing match
 * notification and facilitated meeting (§19.5, §19.5A).
 *
 * Two views of one record, never conflated (§19.5): Admin sees both full
 * profiles side by side; a user sees a one-line, non-sensitive summary of the
 * counterpart, a Why line and the booking action — no name, no exact figure,
 * no contact detail.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   The matching tables postdate the generated types. */
const mdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface QueueMatch {
  id: string;
  pairing_type: string;
  subject_kind: string;
  subject_id: string;
  subject_user_id: string;
  subject_role: string;
  candidate_user_id: string;
  candidate_role: string;
  composite_score: number;
  base_score: number;
  secondary_score: number;
  queue_status: string;
  computed_at: string;
  why_user_text: string | null;
  user_summary_for_subject: string | null;
  user_summary_for_candidate: string | null;
  created_manually_by: string | null;
  subject_name: string;
  candidate_name: string;
}

async function names(userIds: string[]) {
  const ids = [...new Set(userIds)];
  if (!ids.length) return new Map<string, string>();
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, email")
    .in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p.display_name ?? p.email ?? "Unknown"]));
}

// ─── Admin: the engine and the queue ─────────────────────────────────────────

export const runMatchingNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminPermission(context.userId, "vetting");
    return runMatchmaking();
  });

export const listMatchQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        status: z.enum(["pending", "approved", "rejected", "deferred"]).default("pending"),
        pairing: z.string().max(40).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "vetting");
    let q = mdb()
      .from("match_scores")
      .select("*")
      .eq("queue_status", data.status)
      .order("composite_score", { ascending: false })
      .limit(300);
    if (data.pairing) q = q.eq("pairing_type", data.pairing);
    const { data: rows } = await q;
    const R = (rows ?? []) as Omit<QueueMatch, "subject_name" | "candidate_name">[];
    const n = await names(R.flatMap((r) => [r.subject_user_id, r.candidate_user_id]));

    // Match density per pairing — the basis of the Weak Match Pool Alert (§19.7).
    const { data: counts } = await mdb().from("match_scores").select("pairing_type, queue_status");
    const density: Record<string, Record<string, number>> = {};
    for (const c of (counts ?? []) as { pairing_type: string; queue_status: string }[]) {
      density[c.pairing_type] ??= {};
      density[c.pairing_type][c.queue_status] = (density[c.pairing_type][c.queue_status] ?? 0) + 1;
    }
    return {
      matches: R.map((r) => ({
        ...r,
        subject_name: n.get(r.subject_user_id) ?? "Unknown",
        candidate_name: n.get(r.candidate_user_id) ?? "Unknown",
      })) as QueueMatch[],
      density,
    };
  });

/** Full side-by-side detail — Admin's screen only (§19.3A). */
export const getMatchDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "vetting");
    const { data: m } = await mdb()
      .from("match_scores")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!m) throw new Error("Match not found.");
    const [{ data: expl }, { data: apps }, { data: event }, { data: booking }, n] =
      await Promise.all([
        mdb()
          .from("match_explanations")
          .select("*")
          .eq("match_id", m.id)
          .order("contribution_weight", { ascending: false }),
        mdb()
          .from("onboarding_applications")
          .select("user_id, role, sections, verification_status")
          .in("user_id", [m.subject_user_id, m.candidate_user_id]),
        m.subject_kind === "event"
          ? mdb()
              .from("events")
              .select(
                "id, name, event_type, start_date, city, country, primary_sector, attendance_size, min_sponsorship_spend, currency, looking_to_connect_with, status",
              )
              .eq("id", m.subject_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        mdb().from("meeting_bookings").select("*").eq("match_id", m.id).maybeSingle(),
        names([m.subject_user_id, m.candidate_user_id]),
      ]);
    type App = {
      user_id: string;
      role: string;
      // Onboarding answers are plain values; stringified for serialisation.
      sections: Record<string, Record<string, string | string[] | number | boolean | null>>;
      verification_status: string;
    };
    const appOf = (id: string) => ((apps ?? []) as App[]).find((a) => a.user_id === id) ?? null;
    return {
      match: {
        ...m,
        subject_name: n.get(m.subject_user_id),
        candidate_name: n.get(m.candidate_user_id),
      },
      explanations: (expl ?? []) as {
        id: string;
        field_name: string;
        is_primary: boolean;
        field_value_subject: string | null;
        field_value_candidate: string | null;
        contribution_weight: number;
        internal_display_text: string;
        user_facing_display_text: string | null;
        shown_to_users: boolean;
      }[],
      subjectApplication: appOf(m.subject_user_id),
      candidateApplication: appOf(m.candidate_user_id),
      event,
      booking,
    };
  });

/**
 * Approve and Notify (§19.3A): the only action that ever lets a user learn a
 * match exists. Admin offers meeting times and an IGE-controlled call link so
 * neither side exposes a personal calendar (§19.5A step 3).
 */
export const approveMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        proposed_slots: z.array(z.string().datetime()).min(1).max(6),
        video_call_url: z.string().trim().url().max(500),
        note: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "vetting");
    const { data: m } = await mdb()
      .from("match_scores")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!m) throw new Error("Match not found.");
    if (m.queue_status === "approved") throw new Error("Already approved.");
    // Conflict of interest (TAB 6 §6.9): an admin party to the match cannot release it.
    if (m.subject_user_id === context.userId || m.candidate_user_id === context.userId) {
      throw new Error("You are a party to this match. Another admin must review it.");
    }

    // Dual control (TAB 6 §6.9): a match involving a Managed Service client
    // needs a second Super Admin before it reaches either side.
    if (await involvesManagedServiceClient([m.subject_user_id, m.candidate_user_id])) {
      await openDualControl({
        action: "approve_match",
        targetUserId: m.subject_user_id,
        requestedBy: context.userId,
        reason:
          data.note?.trim() ||
          `Approve ${m.pairing_type.replace(/_/g, " ")} match (score ${m.composite_score})`,
        payload: {
          match_id: m.id,
          proposed_slots: data.proposed_slots,
          video_call_url: data.video_call_url,
          note: data.note ?? null,
        },
      });
      return { ok: true as const, pending: true };
    }
    await performMatchApproval(context.userId, m, data);
    return { ok: true as const, pending: false };
  });

/** Adjust (§19.3A): choose which overlaps appear in the user-facing Why line. */
export const adjustMatchWhy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        shown_explanation_ids: z.array(z.string().uuid()),
        reason: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "vetting");
    const { data: expl } = await mdb()
      .from("match_explanations")
      .select("*")
      .eq("match_id", data.id);
    const E = (expl ?? []) as {
      id: string;
      field_name: string;
      is_primary: boolean;
      contribution_weight: number;
      user_facing_display_text: string | null;
      internal_display_text: string;
    }[];
    for (const e of E) {
      await mdb()
        .from("match_explanations")
        .update({ shown_to_users: data.shown_explanation_ids.includes(e.id) })
        .eq("id", e.id);
    }
    const shown = E.filter((e) => data.shown_explanation_ids.includes(e.id)).map(
      (e) =>
        ({
          field: e.field_name,
          label: e.field_name,
          primary: e.is_primary,
          subjectValue: "",
          candidateValue: "",
          overlap: 1,
          contribution: Number(e.contribution_weight),
          internalText: e.internal_display_text,
          userText: e.user_facing_display_text,
        }) satisfies Explanation,
    );
    await mdb()
      .from("match_scores")
      .update({ why_user_text: whyLine(shown) })
      .eq("id", data.id);
    await recordAdminAudit({
      actorId: context.userId,
      action: "match_adjusted",
      summary: "Adjusted the Why line on a match",
      resourceType: "match",
      resourceId: data.id,
      metadata: { reason: data.reason ?? null, shown: data.shown_explanation_ids.length },
    }).catch(() => {});
    return { ok: true as const };
  });

export const decideMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["rejected", "deferred", "pending"]),
        reason: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "vetting");
    await mdb()
      .from("match_scores")
      .update({
        queue_status: data.decision,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        review_note: data.reason ?? null,
      })
      .eq("id", data.id);
    if (data.decision === "rejected") {
      await recordAdminAudit({
        actorId: context.userId,
        action: "match_rejected",
        summary: `Rejected a match${data.reason ? `: ${data.reason}` : ""}`,
        resourceType: "match",
        resourceId: data.id,
      }).catch(() => {});
    }
    return { ok: true as const };
  });

/** Hand-made introductions still go through Approve and Notify (§19.7). */
export const createManualMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        subject_user_id: z.string().uuid(),
        candidate_user_id: z.string().uuid(),
        event_id: z.string().uuid().optional(),
        why: z.string().trim().min(3).max(300),
        summary_for_subject: z.string().trim().min(3).max(300),
        summary_for_candidate: z.string().trim().min(3).max(300),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "vetting");
    if (data.subject_user_id === data.candidate_user_id)
      throw new Error("Pick two different accounts.");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", [data.subject_user_id, data.candidate_user_id]);
    const roleOf = (id: string) => (roles ?? []).find((r) => r.user_id === id)?.role ?? "unknown";
    const { data: ins, error } = await mdb()
      .from("match_scores")
      .insert({
        pairing_type: "manual",
        subject_kind: data.event_id ? "event" : "account",
        subject_id: data.event_id ?? data.subject_user_id,
        subject_user_id: data.subject_user_id,
        subject_role: roleOf(data.subject_user_id),
        candidate_user_id: data.candidate_user_id,
        candidate_role: roleOf(data.candidate_user_id),
        base_score: 0,
        secondary_score: 0,
        composite_score: 0,
        created_manually_by: context.userId,
        why_user_text: data.why,
        user_summary_for_subject: data.summary_for_subject,
        user_summary_for_candidate: data.summary_for_candidate,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await recordAdminAudit({
      actorId: context.userId,
      action: "match_created",
      summary: "Created a manual match",
      resourceType: "match",
      resourceId: ins.id,
    }).catch(() => {});
    return { id: ins.id as string };
  });

export const getMatchConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePlatformAdmin(context.userId);
    return { weights: await loadWeights() };
  });

export const updateMatchConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        pairing_type: z.string().max(40),
        primary_weight: z.number().int().min(0).max(100),
        threshold: z.number().int().min(0).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "controls");
    const { error } = await mdb()
      .from("match_weight_config")
      .upsert({
        pairing_type: data.pairing_type,
        primary_weight: data.primary_weight,
        secondary_weight: 100 - data.primary_weight,
        threshold: data.threshold,
        last_updated_by_admin_id: context.userId,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ─── Users: notifications and the facilitated meeting ────────────────────────

export interface MyMatch {
  id: string;
  /** The counterpart, summarised — never named (§19.5). */
  counterpart: string;
  why: string;
  approved_at: string | null;
  booking: {
    proposed_slots: string[];
    scheduled_at: string | null;
    status: string;
    /** Only revealed once the meeting is booked. */
    video_call_url: string | null;
  } | null;
}

export const listMyMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const { data: rows } = await mdb()
      .from("match_scores")
      .select(
        "id, subject_user_id, candidate_user_id, user_summary_for_subject, user_summary_for_candidate, why_user_text, reviewed_at",
      )
      .eq("queue_status", "approved")
      .or(`subject_user_id.eq.${uid},candidate_user_id.eq.${uid}`)
      .order("reviewed_at", { ascending: false });
    const R = (rows ?? []) as Record<string, string | null>[];
    const { data: bookings } = R.length
      ? await mdb()
          .from("meeting_bookings")
          .select("*")
          .in(
            "match_id",
            R.map((r) => r.id),
          )
      : { data: [] };
    const bookingOf = (id: string) =>
      ((bookings ?? []) as Record<string, unknown>[]).find((b) => b.match_id === id) ?? null;
    return {
      matches: R.map((r) => {
        const b = bookingOf(r.id as string);
        const forSubject = r.subject_user_id === uid;
        return {
          id: r.id as string,
          counterpart:
            (forSubject ? r.user_summary_for_subject : r.user_summary_for_candidate) ??
            "A matched partner",
          why: r.why_user_text ?? "A strong fit on what you both told IGE",
          approved_at: r.reviewed_at,
          booking: b
            ? {
                proposed_slots: (b.proposed_slots as string[]) ?? [],
                scheduled_at: (b.scheduled_at as string | null) ?? null,
                status: b.status as string,
                video_call_url:
                  b.status === "booked" || b.status === "held"
                    ? ((b.video_call_url as string) ?? null)
                    : null,
              }
            : null,
        } satisfies MyMatch;
      }),
    };
  });

/**
 * Book the introductory meeting. The first side to pick a time books it for
 * both; the other side is told the time and gets the same call link.
 */
export const bookMatchMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ match_id: z.string().uuid(), slot: z.string().datetime() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const uid = context.userId;
    const { data: m } = await mdb()
      .from("match_scores")
      .select("*")
      .eq("id", data.match_id)
      .maybeSingle();
    if (
      !m ||
      m.queue_status !== "approved" ||
      (m.subject_user_id !== uid && m.candidate_user_id !== uid)
    ) {
      throw new Error("Match not found.");
    }
    const { data: b } = await mdb()
      .from("meeting_bookings")
      .select("*")
      .eq("match_id", m.id)
      .maybeSingle();
    if (!b) throw new Error("No meeting times have been offered yet.");
    if (b.status === "booked") throw new Error("This meeting is already booked.");
    const offered = ((b.proposed_slots ?? []) as string[]).map((s) => new Date(s).toISOString());
    if (!offered.includes(new Date(data.slot).toISOString()))
      throw new Error("Pick one of the offered times.");

    const forSubject = m.subject_user_id === uid;
    const now = new Date().toISOString();
    await mdb()
      .from("meeting_bookings")
      .update({
        scheduled_at: data.slot,
        status: "booked",
        [forSubject ? "subject_choice" : "candidate_choice"]: data.slot,
        [forSubject ? "booked_by_subject_at" : "booked_by_candidate_at"]: now,
        updated_at: now,
      })
      .eq("id", b.id);

    // §19.5A step 5: once booked, a Deal Card appears in both pipelines.
    for (const side of [m.subject_user_id, m.candidate_user_id] as string[]) {
      await createDealCard(
        side,
        side === m.subject_user_id ? m.user_summary_for_subject : m.user_summary_for_candidate,
        m.subject_kind === "event" ? m.subject_id : null,
      ).catch(() => {});
    }

    const when = new Date(data.slot).toLocaleString("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "UTC",
    });
    await notifyBoth(
      m,
      "Your introductory meeting is confirmed",
      () =>
        `Your introductory meeting is confirmed for ${when} (UTC).\nJoin using the call link on your Matches page at that time.`,
      { label: "Add To My Calendar", path: "/dashboard/matches" },
    );
    return { ok: true as const };
  });

/** A Deal Card in the user's own CRM pipeline, at its first stage. */
async function createDealCard(userId: string, title: string | null, eventId: string | null) {
  const { data: profile } = await mdb()
    .from("profiles")
    .select("active_workspace_id")
    .eq("id", userId)
    .maybeSingle();
  let ws: string | null = profile?.active_workspace_id ?? null;
  if (!ws) {
    const { data } = await mdb().rpc("ensure_personal_workspace", { _user_id: userId });
    ws = (data as string | null) ?? null;
  }
  if (!ws) return;
  await mdb().rpc("ensure_default_pipeline_stages", { _workspace_id: ws });
  const { data: stage } = await mdb()
    .from("crm_pipeline_stages")
    .select("id")
    .eq("workspace_id", ws)
    .order("position")
    .limit(1)
    .maybeSingle();
  await mdb()
    .from("crm_deals")
    .insert({
      workspace_id: ws,
      stage_id: stage?.id ?? null,
      title: `IGE match: ${(title ?? "matched partner").slice(0, 150)}`,
      event_id: eventId,
      notes: "Created when the IGE-arranged introductory meeting was booked.",
      created_by: userId,
    });
}
