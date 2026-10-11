import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCan, type WorkspaceRole } from "@/lib/workspace-permissions";

/**
 * Vendors and Payments (TAB 4 §4.4.6).
 *
 * IGE records and tracks these payments; it does not move money for them. The
 * only money IGE moves is a sponsorship processed through the platform (TAB 11),
 * which lives on deals, not here.
 *
 * Media Partner and Referral Partner accounts get Payments only — no vendor
 * directory, quotes or assignments (v6.4).
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   The vendor and payment tables postdate the last `supabase gen types` run;
   same cast convention as adb()/kdb() elsewhere. */
const vdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const VENDOR_CATEGORIES = [
  "venue",
  "decor",
  "sound",
  "lighting",
  "catering",
  "printing",
  "logistics",
  "security",
  "media",
  "talent",
  "other",
] as const;
export const PAYMENT_STATUSES = ["scheduled", "due", "paid", "overdue"] as const;
export const VENDOR_DOC_KINDS = ["quote", "invoice", "contract"] as const;

/** A payment within this many days of its due date reads as Due. */
export const DUE_SOON_DAYS = 7;

/** Roles the spec gives Payments without the vendor tools. */
const PAYMENTS_ONLY_ROLES = ["media_partner", "referral_partner"];

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  payment_reference: string | null;
  rating: number | null;
  notes: string | null;
  updated_at: string;
}

export interface VendorDocument {
  id: string;
  vendor_id: string;
  event_id: string | null;
  kind: string;
  title: string;
  file_url: string | null;
  amount: number | null;
  currency: string;
  is_chosen: boolean;
  created_at: string;
}

export interface VendorAssignment {
  id: string;
  vendor_id: string;
  event_id: string | null;
  activation_id: string | null;
  deliverable: string;
  delivery_on: string | null;
}

export interface Payment {
  id: string;
  direction: "in" | "out";
  event_id: string | null;
  vendor_id: string | null;
  counterparty: string | null;
  description: string | null;
  amount: number;
  currency: string;
  is_partial: boolean;
  due_on: string | null;
  paid_on: string | null;
  /** What is stored. */
  status: string;
  /** What to show: Due and Overdue follow the calendar, not the last edit. */
  effective_status: (typeof PAYMENT_STATUSES)[number];
  method: string | null;
  receipt_url: string | null;
  notes: string | null;
}

export interface EventBudget {
  event_id: string;
  planned_amount: number;
  currency: string;
}

export interface WorkspaceEventOption {
  id: string;
  name: string;
  start_date: string | null;
}

/**
 * A payment nobody has touched still has to turn Overdue on the right day, so
 * the shown status is worked out from the due date unless it has been paid.
 */
export function effectiveStatus(
  status: string,
  dueOn: string | null,
  today = new Date().toISOString().slice(0, 10),
): Payment["effective_status"] {
  if (status === "paid") return "paid";
  if (!dueOn) return status === "overdue" || status === "due" ? status : "scheduled";
  if (dueOn < today) return "overdue";
  const soon = new Date(today);
  soon.setDate(soon.getDate() + DUE_SOON_DAYS);
  if (dueOn <= soon.toISOString().slice(0, 10)) return "due";
  return "scheduled";
}

async function activeWorkspace(
  userId: string,
): Promise<{ workspaceId: string; role: WorkspaceRole }> {
  const { data: profile } = await vdb()
    .from("profiles")
    .select("active_workspace_id")
    .eq("id", userId)
    .maybeSingle();

  let workspaceId: string | null = profile?.active_workspace_id ?? null;
  if (!workspaceId) {
    const { data: healed } = await vdb().rpc("ensure_personal_workspace", { _user_id: userId });
    workspaceId = (healed as string | null) ?? null;
  }
  if (!workspaceId) throw new Error("No workspace found for this account.");

  const { data: member } = await vdb()
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!member) throw new Error("You do not have access to this workspace.");

  return { workspaceId, role: member.role as WorkspaceRole };
}

async function isPaymentsOnly(userId: string): Promise<boolean> {
  const { data } = await vdb().from("user_roles").select("role").eq("user_id", userId);
  const roles = ((data ?? []) as { role: string }[]).map((r) => r.role);
  return roles.length > 0 && roles.every((r) => PAYMENTS_ONLY_ROLES.includes(r));
}

async function assertVendorTools(userId: string) {
  if (await isPaymentsOnly(userId)) {
    throw new Error("Vendor tools are not part of this account type. Payments are.");
  }
}

/** Events owned by anyone with a seat in the workspace — the same union the calendar uses. */
async function workspaceEvents(workspaceId: string): Promise<WorkspaceEventOption[]> {
  const { data: members } = await vdb()
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("status", "active");
  const ids = ((members ?? []) as { user_id: string | null }[])
    .map((m) => m.user_id)
    .filter((id): id is string => !!id);
  if (!ids.length) return [];
  const { data } = await vdb()
    .from("events")
    .select("id, name, start_date")
    .in("organiser_id", ids)
    .order("start_date", { ascending: false, nullsFirst: false });
  return (data ?? []) as WorkspaceEventOption[];
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getVendorsAndPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    const paymentsOnly = await isPaymentsOnly(context.userId);

    const [payments, budgets, events, vendors, docs, assignments] = await Promise.all([
      vdb()
        .from("workspace_payments")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("due_on", { ascending: true, nullsFirst: false }),
      vdb().from("event_budgets").select("*").eq("workspace_id", workspaceId),
      workspaceEvents(workspaceId),
      paymentsOnly
        ? Promise.resolve({ data: [] })
        : vdb().from("vendors").select("*").eq("workspace_id", workspaceId).order("name"),
      paymentsOnly
        ? Promise.resolve({ data: [] })
        : vdb()
            .from("vendor_documents")
            .select("*")
            .eq("workspace_id", workspaceId)
            .order("created_at", { ascending: false }),
      paymentsOnly
        ? Promise.resolve({ data: [] })
        : vdb()
            .from("vendor_assignments")
            .select("*")
            .eq("workspace_id", workspaceId)
            .order("delivery_on", { nullsFirst: false }),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    return {
      myRole: role,
      paymentsOnly,
      events,
      payments: ((payments.data ?? []) as Omit<Payment, "effective_status">[]).map((p) => ({
        ...p,
        amount: Number(p.amount),
        effective_status: effectiveStatus(p.status, p.due_on, today),
      })) as Payment[],
      budgets: ((budgets.data ?? []) as EventBudget[]).map((b) => ({
        ...b,
        planned_amount: Number(b.planned_amount),
      })),
      vendors: (vendors.data ?? []) as Vendor[],
      documents: ((docs.data ?? []) as VendorDocument[]).map((d) => ({
        ...d,
        amount: d.amount != null ? Number(d.amount) : null,
      })),
      assignments: (assignments.data ?? []) as VendorAssignment[],
    };
  });

// ─── Vendors ──────────────────────────────────────────────────────────────────

const VendorInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  category: z.enum(VENDOR_CATEGORIES),
  contact_person: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  payment_reference: z.string().trim().max(300).optional(),
  rating: z.number().int().min(1).max(5).nullish(),
  notes: z.string().trim().max(4000).optional(),
});

export const upsertVendor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => VendorInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertVendorTools(context.userId);
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "add or edit vendors");

    const row = {
      workspace_id: workspaceId,
      name: data.name,
      category: data.category,
      contact_person: data.contact_person || null,
      phone: data.phone || null,
      email: data.email || null,
      payment_reference: data.payment_reference || null,
      rating: data.rating ?? null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await vdb().from("vendors").update(row).eq("id", data.id).eq("workspace_id", workspaceId)
      : await vdb()
          .from("vendors")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteVendor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertVendorTools(context.userId);
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "delete vendors");
    // Payments to a deleted vendor stay on the books (vendor_id is SET NULL),
    // because the money still moved.
    await vdb().from("vendors").delete().eq("id", data.id).eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

// ─── Quotes, invoices and contracts ───────────────────────────────────────────

export const addVendorDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        vendor_id: z.string().uuid(),
        event_id: z.string().uuid().nullish(),
        kind: z.enum(VENDOR_DOC_KINDS),
        title: z.string().trim().min(1).max(200),
        file_url: z.string().trim().url().max(500).optional().or(z.literal("")),
        amount: z.number().nonnegative().nullish(),
        currency: z.string().trim().max(20).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertVendorTools(context.userId);
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "add vendor documents");
    const { error } = await vdb()
      .from("vendor_documents")
      .insert({
        workspace_id: workspaceId,
        vendor_id: data.vendor_id,
        event_id: data.event_id ?? null,
        kind: data.kind,
        title: data.title,
        file_url: data.file_url || null,
        amount: data.amount ?? null,
        currency: data.currency || "NGN (₦)",
        created_by: context.userId,
      });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/**
 * "Compare quotes; mark the chosen vendor." Choosing one quote for an event
 * un-chooses the others for that event, so a comparison has one winner.
 */
export const chooseQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), chosen: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertVendorTools(context.userId);
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "choose a quote");

    const { data: doc } = await vdb()
      .from("vendor_documents")
      .select("id, event_id, kind")
      .eq("id", data.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (!doc) throw new Error("Quote not found.");
    if (doc.kind !== "quote") throw new Error("Only quotes can be chosen.");

    if (data.chosen && doc.event_id) {
      await vdb()
        .from("vendor_documents")
        .update({ is_chosen: false })
        .eq("workspace_id", workspaceId)
        .eq("event_id", doc.event_id)
        .eq("kind", "quote");
    }
    await vdb()
      .from("vendor_documents")
      .update({ is_chosen: data.chosen })
      .eq("id", data.id)
      .eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

export const deleteVendorDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertVendorTools(context.userId);
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "delete vendor documents");
    await vdb().from("vendor_documents").delete().eq("id", data.id).eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

// ─── Assignments ──────────────────────────────────────────────────────────────

export const addVendorAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        vendor_id: z.string().uuid(),
        event_id: z.string().uuid().nullish(),
        activation_id: z.string().uuid().nullish(),
        deliverable: z.string().trim().min(1).max(300),
        delivery_on: z.string().max(20).nullish(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertVendorTools(context.userId);
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "assign vendors");
    const { error } = await vdb()
      .from("vendor_assignments")
      .insert({
        workspace_id: workspaceId,
        vendor_id: data.vendor_id,
        event_id: data.event_id ?? null,
        activation_id: data.activation_id ?? null,
        deliverable: data.deliverable,
        delivery_on: data.delivery_on || null,
        created_by: context.userId,
      });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteVendorAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertVendorTools(context.userId);
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "remove vendor assignments");
    await vdb()
      .from("vendor_assignments")
      .delete()
      .eq("id", data.id)
      .eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

// ─── Payments ─────────────────────────────────────────────────────────────────

const PaymentInput = z.object({
  id: z.string().uuid().optional(),
  direction: z.enum(["in", "out"]),
  event_id: z.string().uuid().nullish(),
  vendor_id: z.string().uuid().nullish(),
  counterparty: z.string().trim().max(200).optional(),
  description: z.string().trim().max(300).optional(),
  amount: z.number().nonnegative(),
  currency: z.string().trim().max(20).optional(),
  is_partial: z.boolean().optional(),
  due_on: z.string().max(20).nullish(),
  paid_on: z.string().max(20).nullish(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  method: z.string().trim().max(100).optional(),
  receipt_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional(),
});

export const upsertPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PaymentInput.parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "record payments");
    if (data.vendor_id && (await isPaymentsOnly(context.userId))) {
      throw new Error("Vendor tools are not part of this account type.");
    }

    // Marking it paid without a date means it was paid today.
    const status = data.status ?? "scheduled";
    const paidOn = status === "paid" ? data.paid_on || new Date().toISOString().slice(0, 10) : null;

    const row = {
      workspace_id: workspaceId,
      direction: data.direction,
      event_id: data.event_id ?? null,
      vendor_id: data.vendor_id ?? null,
      counterparty: data.counterparty || null,
      description: data.description || null,
      amount: data.amount,
      currency: data.currency || "NGN (₦)",
      is_partial: data.is_partial ?? false,
      due_on: data.due_on || null,
      paid_on: paidOn,
      status,
      method: data.method || null,
      receipt_url: data.receipt_url || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await vdb()
          .from("workspace_payments")
          .update(row)
          .eq("id", data.id)
          .eq("workspace_id", workspaceId)
      : await vdb()
          .from("workspace_payments")
          .insert({ ...row, created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const markPaymentPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "mark payments paid");
    const now = new Date().toISOString();
    await vdb()
      .from("workspace_payments")
      .update({ status: "paid", paid_on: now.slice(0, 10), updated_at: now })
      .eq("id", data.id)
      .eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

export const deletePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "delete payments");
    await vdb()
      .from("workspace_payments")
      .delete()
      .eq("id", data.id)
      .eq("workspace_id", workspaceId);
    return { ok: true as const };
  });

// ─── Planned budget ───────────────────────────────────────────────────────────

export const setEventBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        event_id: z.string().uuid(),
        planned_amount: z.number().nonnegative(),
        currency: z.string().trim().max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "workspace.edit", "set event budgets");
    const events = await workspaceEvents(workspaceId);
    if (!events.some((e) => e.id === data.event_id)) {
      throw new Error("That event is not in this workspace.");
    }
    const { error } = await vdb().from("event_budgets").upsert(
      {
        workspace_id: workspaceId,
        event_id: data.event_id,
        planned_amount: data.planned_amount,
        currency: data.currency,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,event_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
