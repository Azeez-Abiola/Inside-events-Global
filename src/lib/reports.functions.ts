import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { WorkspaceRole } from "@/lib/workspace-permissions";

/**
 * Reports and downloads (TAB 4 §4.4.3).
 *
 * "The core weekly report answers the question a manager asks: how many
 *  sponsors or clients did you contact, how many meetings were held, what
 *  feedback came back, and what moved in the pipeline."
 *
 * The server returns plain tables; the browser turns the same tables into
 * .xlsx, .csv or a printable PDF, so the three formats can never disagree.
 * More report templates are expected over time (§4.4.3: "build the export
 * framework now and add report templates over time") — add one to REPORTS.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   CRM, activation and payment tables postdate the last `supabase gen types`. */
const rdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const REPORT_TYPES = ["weekly_activity", "pipeline_commission", "event_report"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export type ReportCell = string | number | null;

export interface ReportTable {
  name: string;
  headers: string[];
  rows: ReportCell[][];
}

export interface ReportResult {
  title: string;
  period: string;
  workspaceName: string;
  generatedAt: string;
  /** Headline figures for the on-screen summary and the PDF cover. */
  summary: { label: string; value: string }[];
  tables: ReportTable[];
}

async function activeWorkspace(userId: string) {
  const { data: profile } = await rdb()
    .from("profiles")
    .select("active_workspace_id")
    .eq("id", userId)
    .maybeSingle();
  let workspaceId: string | null = profile?.active_workspace_id ?? null;
  if (!workspaceId) {
    const { data: healed } = await rdb().rpc("ensure_personal_workspace", { _user_id: userId });
    workspaceId = (healed as string | null) ?? null;
  }
  if (!workspaceId) throw new Error("No workspace found for this account.");

  const [{ data: member }, { data: ws }] = await Promise.all([
    rdb()
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    rdb().from("workspaces").select("name").eq("id", workspaceId).maybeSingle(),
  ]);
  if (!member) throw new Error("You do not have access to this workspace.");
  return {
    workspaceId,
    role: member.role as WorkspaceRole,
    workspaceName: (ws?.name as string | undefined) ?? "My workspace",
  };
}

async function workspaceMembers(workspaceId: string) {
  const { data: members } = await rdb()
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("status", "active");
  const ids = ((members ?? []) as { user_id: string | null }[])
    .map((m) => m.user_id)
    .filter((id): id is string => !!id);
  const { data: profiles } = ids.length
    ? await rdb().from("profiles").select("id, display_name, email").in("id", ids)
    : { data: [] };
  const names = new Map<string, string>(
    ((profiles ?? []) as { id: string; display_name: string | null; email: string | null }[]).map(
      (p) => [p.id, p.display_name ?? p.email ?? "Unknown"],
    ),
  );
  return { ids, names };
}

const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");
const cur = (c: string | null | undefined) => (c ? c.split(" ")[0] : "");

function tally<T>(rows: T[], key: (r: T) => string | null | undefined) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

// ─── Weekly Activity Report ───────────────────────────────────────────────────

async function weeklyActivity(workspaceId: string, from: string, to: string) {
  const { ids, names } = await workspaceMembers(workspaceId);
  const toEnd = `${to}T23:59:59.999Z`;

  const [contacts, outreach, meetings, deals, stages, activations, milestones] = await Promise.all([
    rdb()
      .from("crm_contacts")
      .select("id, full_name, created_by, created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", from)
      .lte("created_at", toEnd),
    rdb()
      .from("crm_outreach")
      .select("id, contact_id, channel, occurred_at, outcome, notes, next_follow_up, created_by")
      .eq("workspace_id", workspaceId)
      .gte("occurred_at", from)
      .lte("occurred_at", toEnd)
      .order("occurred_at"),
    rdb()
      .from("crm_meetings")
      .select("id, contact_id, held_at, attendees, decisions, next_steps, notes, created_by")
      .eq("workspace_id", workspaceId)
      .gte("held_at", from)
      .lte("held_at", toEnd)
      .order("held_at"),
    rdb()
      .from("crm_deals")
      .select(
        "id, title, stage_id, value_amount, value_currency, created_at, updated_at, created_by, assignee_id",
      )
      .eq("workspace_id", workspaceId)
      .gte("updated_at", from)
      .lte("updated_at", toEnd),
    rdb().from("crm_pipeline_stages").select("id, name").eq("workspace_id", workspaceId),
    rdb()
      .from("activations")
      .select("id, name, status, owner_id, updated_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "done")
      .gte("updated_at", from)
      .lte("updated_at", toEnd),
    rdb()
      .from("activation_milestones")
      .select("id, title, assignee_id, created_by, completed_at")
      .eq("workspace_id", workspaceId)
      .gte("completed_at", from)
      .lte("completed_at", toEnd),
  ]);

  const contactIds = [
    ...new Set(
      [...(outreach.data ?? []), ...(meetings.data ?? [])]
        .map((r: { contact_id: string | null }) => r.contact_id)
        .filter(Boolean),
    ),
  ];
  const { data: contactNames } = contactIds.length
    ? await rdb().from("crm_contacts").select("id, full_name").in("id", contactIds)
    : { data: [] };
  const contactName = new Map<string, string>(
    ((contactNames ?? []) as { id: string; full_name: string }[]).map((c) => [c.id, c.full_name]),
  );
  const stageName = new Map<string, string>(
    ((stages.data ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name]),
  );
  const who = (id: string | null | undefined) => (id ? (names.get(id) ?? "Former member") : "—");

  const O = (outreach.data ?? []) as Record<string, string | null>[];
  const M = (meetings.data ?? []) as Record<string, string | null>[];
  const D = (deals.data ?? []) as Record<string, string | number | null>[];
  const A = (activations.data ?? []) as Record<string, string | null>[];
  const MS = (milestones.data ?? []) as Record<string, string | null>[];

  const contactsBy = tally(
    (contacts.data ?? []) as { created_by: string | null }[],
    (r) => r.created_by,
  );
  const outreachBy = tally(O, (r) => r.created_by);
  const meetingsBy = tally(M, (r) => r.created_by);
  // "Feedback captured": an outreach with an outcome, or a meeting with decisions or next steps.
  const feedbackBy = tally(
    [
      ...O.filter((r) => r.outcome?.trim()),
      ...M.filter((r) => r.decisions?.trim() || r.next_steps?.trim()),
    ],
    (r) => r.created_by,
  );
  const newDealsBy = tally(
    D.filter((d) => String(d.created_at) >= from),
    (d) => (d.created_by as string | null) ?? null,
  );
  const movedDealsBy = tally(
    D.filter((d) => String(d.created_at) < from),
    (d) => ((d.assignee_id ?? d.created_by) as string | null) ?? null,
  );
  const activationsBy = tally(A, (r) => r.owner_id);
  const milestonesBy = tally(MS, (r) => r.assignee_id ?? r.created_by);

  const people = ids.length ? ids : [];
  const perPerson: ReportCell[][] = people.map((id) => [
    who(id),
    contactsBy.get(id) ?? 0,
    outreachBy.get(id) ?? 0,
    meetingsBy.get(id) ?? 0,
    feedbackBy.get(id) ?? 0,
    newDealsBy.get(id) ?? 0,
    movedDealsBy.get(id) ?? 0,
    activationsBy.get(id) ?? 0,
    milestonesBy.get(id) ?? 0,
  ]);
  const sumCol = (i: number) => perPerson.reduce((n, r) => n + Number(r[i] ?? 0), 0);

  return {
    title: "Weekly Activity Report",
    summary: [
      { label: "Contacts added", value: String(sumCol(1)) },
      { label: "Outreach made", value: String(sumCol(2)) },
      { label: "Meetings held", value: String(sumCol(3)) },
      { label: "Feedback captured", value: String(sumCol(4)) },
      { label: "Deals opened", value: String(sumCol(5)) },
      { label: "Deals moved", value: String(sumCol(6)) },
      { label: "Activations delivered", value: String(sumCol(7)) },
      { label: "Tasks completed", value: String(sumCol(8)) },
    ],
    tables: [
      {
        name: "By person",
        headers: [
          "Person",
          "Contacts added",
          "Outreach made",
          "Meetings held",
          "Feedback captured",
          "Deals opened",
          "Deals moved",
          "Activations delivered",
          "Tasks completed",
        ],
        rows: perPerson,
      },
      {
        name: "Outreach",
        headers: ["Date", "By", "Contact", "Channel", "Outcome / feedback", "Next follow-up"],
        rows: O.map((r) => [
          day(r.occurred_at),
          who(r.created_by),
          (r.contact_id && contactName.get(r.contact_id)) || "—",
          r.channel,
          r.outcome ?? r.notes ?? "",
          day(r.next_follow_up),
        ]),
      },
      {
        name: "Meetings",
        headers: ["Date", "By", "Contact", "Attendees", "Decisions", "Next steps"],
        rows: M.map((r) => [
          day(r.held_at),
          who(r.created_by),
          (r.contact_id && contactName.get(r.contact_id)) || "—",
          r.attendees ?? "",
          r.decisions ?? "",
          r.next_steps ?? "",
        ]),
      },
      {
        name: "Pipeline movement",
        headers: ["Deal", "Stage now", "Value", "Currency", "Opened", "Last moved", "Owner"],
        rows: D.map((d) => [
          d.title as string,
          (d.stage_id && stageName.get(d.stage_id as string)) || "—",
          d.value_amount != null ? Number(d.value_amount) : null,
          cur(d.value_currency as string),
          day(d.created_at as string),
          day(d.updated_at as string),
          who((d.assignee_id ?? d.created_by) as string | null),
        ]),
      },
      {
        name: "Delivered",
        headers: ["Type", "What", "Who", "Completed"],
        rows: [
          ...A.map(
            (a) => ["Activation", a.name, who(a.owner_id), day(a.updated_at)] as ReportCell[],
          ),
          ...MS.map(
            (m) =>
              [
                "Task",
                m.title,
                who(m.assignee_id ?? m.created_by),
                day(m.completed_at),
              ] as ReportCell[],
          ),
        ],
      },
    ],
  };
}

// ─── Pipeline and Commission Report ───────────────────────────────────────────

async function pipelineCommission(workspaceId: string, from: string, to: string) {
  const [deals, stages, commissions] = await Promise.all([
    rdb()
      .from("crm_deals")
      .select(
        "id, title, stage_id, value_amount, value_currency, probability, expected_close, created_at, updated_at",
      )
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false }),
    rdb()
      .from("crm_pipeline_stages")
      .select("id, name, is_won, is_lost")
      .eq("workspace_id", workspaceId),
    rdb()
      .from("crm_commissions")
      .select("deal_id, expected_amount, earned_amount, currency, status, paid_at")
      .eq("workspace_id", workspaceId),
  ]);
  const stageById = new Map<string, { name: string; is_won: boolean; is_lost: boolean }>(
    ((stages.data ?? []) as { id: string; name: string; is_won: boolean; is_lost: boolean }[]).map(
      (s) => [s.id, s],
    ),
  );
  const commByDeal = new Map<string, Record<string, string | number | null>[]>();
  for (const c of (commissions.data ?? []) as Record<string, string | number | null>[]) {
    const id = c.deal_id as string | null;
    if (id) commByDeal.set(id, [...(commByDeal.get(id) ?? []), c]);
  }

  const D = (deals.data ?? []) as Record<string, string | number | null>[];
  const state = (d: Record<string, string | number | null>) => {
    const s = d.stage_id ? stageById.get(d.stage_id as string) : null;
    const comms = commByDeal.get(d.id as string) ?? [];
    if (s?.is_won && comms.length && comms.every((c) => c.status === "paid")) return "Paid";
    if (s?.is_won) return "Won";
    if (s?.is_lost) return "Lost";
    return "Open";
  };

  // Totals per currency — summing naira and dollars into one number would lie.
  const totals = new Map<string, Record<string, number>>();
  for (const d of D) {
    const c = cur(d.value_currency as string) || "—";
    const t = totals.get(c) ?? { Open: 0, Won: 0, Lost: 0, Paid: 0 };
    t[state(d)] += Number(d.value_amount ?? 0);
    totals.set(c, t);
  }
  const commTotals = new Map<string, { expected: number; earned: number; paid: number }>();
  for (const c of (commissions.data ?? []) as Record<string, string | number | null>[]) {
    const k = cur(c.currency as string) || "—";
    const t = commTotals.get(k) ?? { expected: 0, earned: 0, paid: 0 };
    t.expected += Number(c.expected_amount ?? 0);
    t.earned += Number(c.earned_amount ?? 0);
    if (c.status === "paid") t.paid += Number(c.earned_amount ?? c.expected_amount ?? 0);
    commTotals.set(k, t);
  }

  const inPeriod = D.filter((d) => {
    const u = day(d.updated_at as string);
    return u >= from && u <= to;
  }).length;

  return {
    title: "Pipeline and Commission Report",
    summary: [
      { label: "Open deals", value: String(D.filter((d) => state(d) === "Open").length) },
      { label: "Won", value: String(D.filter((d) => state(d) === "Won").length) },
      { label: "Paid", value: String(D.filter((d) => state(d) === "Paid").length) },
      { label: "Lost", value: String(D.filter((d) => state(d) === "Lost").length) },
      { label: "Moved in period", value: String(inPeriod) },
    ],
    tables: [
      {
        name: "Totals by currency",
        headers: [
          "Currency",
          "Open",
          "Won",
          "Paid",
          "Lost",
          "Commission expected",
          "Commission earned",
          "Commission paid",
        ],
        rows: [...new Set([...totals.keys(), ...commTotals.keys()])].map((c) => {
          const t = totals.get(c) ?? { Open: 0, Won: 0, Lost: 0, Paid: 0 };
          const k = commTotals.get(c) ?? { expected: 0, earned: 0, paid: 0 };
          return [c, t.Open, t.Won, t.Paid, t.Lost, k.expected, k.earned, k.paid];
        }),
      },
      {
        name: "Deals",
        headers: [
          "Deal",
          "Status",
          "Stage",
          "Value",
          "Currency",
          "Probability %",
          "Expected close",
          "Commission expected",
          "Commission earned",
          "Commission status",
        ],
        rows: D.map((d) => {
          const comms = commByDeal.get(d.id as string) ?? [];
          return [
            d.title as string,
            state(d),
            (d.stage_id && stageById.get(d.stage_id as string)?.name) || "—",
            d.value_amount != null ? Number(d.value_amount) : null,
            cur(d.value_currency as string),
            d.probability != null ? Number(d.probability) : null,
            day(d.expected_close as string),
            comms.length ? comms.reduce((n, c) => n + Number(c.expected_amount ?? 0), 0) : null,
            comms.length ? comms.reduce((n, c) => n + Number(c.earned_amount ?? 0), 0) : null,
            comms.length ? (comms.every((c) => c.status === "paid") ? "Paid" : "Unpaid") : "—",
          ];
        }),
      },
    ],
  };
}

// ─── Event Report ─────────────────────────────────────────────────────────────

async function eventReport(workspaceId: string, memberIds: string[]) {
  if (!memberIds.length) return { title: "Event Report", summary: [], tables: [] };
  const { data: events } = await rdb()
    .from("events")
    .select("id, name, start_date, city, visibility, status")
    .in("organiser_id", memberIds)
    .order("start_date", { ascending: false, nullsFirst: false });
  const E = (events ?? []) as Record<string, string | null>[];
  const eventIds = E.map((e) => e.id as string);
  if (!eventIds.length) return { title: "Event Report", summary: [], tables: [] };

  // Each source is read tolerantly: a table that has not been migrated yet
  // contributes nothing rather than failing the whole report.
  const [targets, platformDeals, crmDeals, stages, activations, paymentsIn] = await Promise.all([
    rdb()
      .from("event_funding_targets")
      .select("event_id, target_amount, currency")
      .in("event_id", eventIds),
    rdb()
      .from("deals")
      .select("event_id, status, deal_value_native, deal_currency")
      .in("event_id", eventIds),
    rdb()
      .from("crm_deals")
      .select("event_id, stage_id, value_amount, value_currency")
      .eq("workspace_id", workspaceId)
      .in("event_id", eventIds),
    rdb().from("crm_pipeline_stages").select("id, is_won").eq("workspace_id", workspaceId),
    rdb()
      .from("activations")
      .select("event_id, status")
      .eq("workspace_id", workspaceId)
      .in("event_id", eventIds),
    rdb()
      .from("workspace_payments")
      .select("event_id, amount, currency, status, direction")
      .eq("workspace_id", workspaceId)
      .eq("direction", "in")
      .eq("status", "paid")
      .in("event_id", eventIds),
  ]);
  const wonStage = new Set(
    ((stages.data ?? []) as { id: string; is_won: boolean }[])
      .filter((s) => s.is_won)
      .map((s) => s.id),
  );
  const target = new Map<string, { amount: number; currency: string }>(
    ((targets.data ?? []) as { event_id: string; target_amount: number; currency: string }[]).map(
      (t) => [t.event_id, { amount: Number(t.target_amount), currency: cur(t.currency) }],
    ),
  );

  const rows: ReportCell[][] = E.map((e) => {
    const id = e.id as string;
    const t = target.get(id);
    const pd = ((platformDeals.data ?? []) as Record<string, string | number | null>[]).filter(
      (d) => d.event_id === id,
    );
    const committedPlatform = pd.filter((d) =>
      ["verbal_commitment", "contract_sent", "contract_signed", "payment_received"].includes(
        String(d.status),
      ),
    );
    const cd = ((crmDeals.data ?? []) as Record<string, string | number | null>[]).filter(
      (d) => d.event_id === id && d.stage_id && wonStage.has(d.stage_id as string),
    );
    const received = ((paymentsIn.data ?? []) as Record<string, string | number | null>[]).filter(
      (p) => p.event_id === id,
    );
    // "Raised" is counted in the target's currency only; anything else is
    // listed as partners but not added into a mixed-currency sum.
    const c = t?.currency ?? cur((received[0]?.currency as string) ?? "") ?? "";
    const raised =
      received
        .filter((p) => cur(p.currency as string) === c)
        .reduce((n, p) => n + Number(p.amount), 0) +
      pd
        .filter((d) => d.status === "payment_received" && cur(d.deal_currency as string) === c)
        .reduce((n, d) => n + Number(d.deal_value_native ?? 0), 0);
    const acts = ((activations.data ?? []) as { event_id: string; status: string }[]).filter(
      (a) => a.event_id === id,
    );
    return [
      e.name ?? "Untitled",
      day(e.start_date),
      e.visibility === "private" ? "Private" : "Published",
      t ? t.amount : null,
      raised || null,
      c || "—",
      t && t.amount > 0 ? Math.round((raised / t.amount) * 100) : null,
      committedPlatform.length + cd.length,
      acts.filter((a) => a.status === "done").length,
      acts.length,
    ];
  });

  return {
    title: "Event Report",
    summary: [
      { label: "Events", value: String(E.length) },
      { label: "Partners secured", value: String(rows.reduce((n, r) => n + Number(r[7] ?? 0), 0)) },
      {
        label: "Activations delivered",
        value: String(rows.reduce((n, r) => n + Number(r[8] ?? 0), 0)),
      },
    ],
    tables: [
      {
        name: "Events",
        headers: [
          "Event",
          "Date",
          "Visibility",
          "Sponsorship target",
          "Raised",
          "Currency",
          "% of target",
          "Partners secured",
          "Activations delivered",
          "Activations planned",
        ],
        rows,
      },
    ],
  };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export const getReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        type: z.enum(REPORT_TYPES),
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<ReportResult> => {
    if (data.to < data.from) throw new Error("The period ends before it starts.");
    const { workspaceId, workspaceName } = await activeWorkspace(context.userId);

    let body: { title: string; summary: ReportResult["summary"]; tables: ReportTable[] };
    if (data.type === "weekly_activity")
      body = await weeklyActivity(workspaceId, data.from, data.to);
    else if (data.type === "pipeline_commission")
      body = await pipelineCommission(workspaceId, data.from, data.to);
    else body = await eventReport(workspaceId, (await workspaceMembers(workspaceId)).ids);

    return {
      ...body,
      workspaceName,
      period: data.type === "event_report" ? "All events to date" : `${data.from} to ${data.to}`,
      generatedAt: new Date().toISOString(),
    };
  });
