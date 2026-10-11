import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertCan, can, type WorkspaceRole } from "@/lib/workspace-permissions";
import { NOTIFICATION_CATEGORIES, type NotificationCategory } from "@/lib/notification-prefs";

/**
 * Account Settings: Payment Details (Owner role only) and Notifications
 * (TAB 4 Screen Spec - Account Settings; TAB 18 §18.4). There is no
 * subscription plan while IGE is free to use (TAB 11).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- these tables postdate the generated types.
const sdb = (): any => supabaseAdmin as any;

async function activeWorkspace(
  userId: string,
): Promise<{ workspaceId: string; role: WorkspaceRole }> {
  const { data: profile } = await sdb()
    .from("profiles")
    .select("active_workspace_id")
    .eq("id", userId)
    .maybeSingle();
  let workspaceId: string | null = profile?.active_workspace_id ?? null;
  if (!workspaceId) {
    const { data: healed } = await sdb().rpc("ensure_personal_workspace", { _user_id: userId });
    workspaceId = (healed as string | null) ?? null;
  }
  if (!workspaceId) throw new Error("No workspace found for this account.");
  const { data: member } = await sdb()
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!member) throw new Error("You do not have access to this workspace.");
  return { workspaceId, role: member.role as WorkspaceRole };
}

const TEXT_FIELDS = [
  "billing_contact_name",
  "billing_contact_email",
  "billing_address",
  "tax_id",
  "payout_currency",
  "bank_country",
  "bank_name",
  "account_name",
  "account_number",
  "sort_or_routing_code",
  "swift_bic",
  "iban",
  "processor_account_ref",
  "notes",
] as const;

export type PaymentDetails = Record<(typeof TEXT_FIELDS)[number], string> & {
  pay_method: string;
  payout_method: string;
  updated_at: string | null;
};

export type PaymentHistoryRow = {
  id: string;
  event: string | null;
  side: "organiser" | "sponsor";
  status: string;
  paid_at: string | null;
  currency: string;
  gross: number | null;
  commission: number | null;
  net: number | null;
};

const mask = (v: string) =>
  v.length > 4 ? `${"•".repeat(Math.min(8, v.length - 4))}${v.slice(-4)}` : v;

export const getPaymentDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    if (!can(role, "payments.manage")) return { allowed: false as const, role };
    const { data: row, error } = await sdb()
      .from("workspace_payment_details")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    const ready = !error;
    const details: PaymentDetails = {
      pay_method: row?.pay_method ?? "",
      payout_method: row?.payout_method ?? "",
      updated_at: row?.updated_at ?? null,
      ...(Object.fromEntries(TEXT_FIELDS.map((f) => [f, String(row?.[f] ?? "")])) as Record<
        (typeof TEXT_FIELDS)[number],
        string
      >),
    };
    // Bank numbers are shown masked; the owner re-enters to change them.
    details.account_number = mask(details.account_number);
    details.iban = mask(details.iban);

    const { data: deals } = await sdb()
      .from("deals")
      .select(
        "id, status, paid_at, deal_currency, deal_value_native, abw_commission_native, organiser_payout_native, organiser_id, sponsor_user_id, events(name)",
      )
      .or(`organiser_id.eq.${context.userId},sponsor_user_id.eq.${context.userId}`)
      .in("status", ["payment_received", "deal_closed"])
      .order("paid_at", { ascending: false, nullsFirst: false })
      .limit(50);
    const n = (v: unknown) => (v == null ? null : Number(v));
    const history: PaymentHistoryRow[] = ((deals ?? []) as Record<string, unknown>[]).map((d) => {
      const side = d.organiser_id === context.userId ? "organiser" : "sponsor";
      return {
        id: String(d.id),
        event: (d.events as { name: string } | null)?.name ?? null,
        side,
        status: String(d.status),
        paid_at: (d.paid_at as string | null) ?? null,
        currency: String(d.deal_currency ?? "USD"),
        gross: n(d.deal_value_native),
        // Commission is the organiser's deduction; a sponsor pays the gross.
        commission: side === "organiser" ? n(d.abw_commission_native) : null,
        net: side === "organiser" ? n(d.organiser_payout_native) : null,
      };
    });
    return { allowed: true as const, role, ready, details, history };
  });

const SaveInput = z.object({
  pay_method: z.enum(["", "bank_transfer", "card", "invoice", "other"]),
  payout_method: z.enum(["", "bank_transfer", "paystack", "stripe", "other"]),
  billing_contact_email: z.string().trim().email().max(255).or(z.literal("")),
  ...Object.fromEntries(
    TEXT_FIELDS.filter((f) => f !== "billing_contact_email").map((f) => [
      f,
      z
        .string()
        .trim()
        .max(f === "notes" || f === "billing_address" ? 1000 : 120),
    ]),
  ),
});

export const savePaymentDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, string>) => SaveInput.parse(d) as Record<string, string>)
  .handler(async ({ data, context }) => {
    const { workspaceId, role } = await activeWorkspace(context.userId);
    assertCan(role, "payments.manage", "change payment details");
    const { data: existing } = await sdb()
      .from("workspace_payment_details")
      .select("account_number, iban")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    const row: Record<string, string | null> = {
      workspace_id: workspaceId,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    };
    for (const [k, v] of Object.entries(data)) row[k] = v === "" ? null : v;
    // A masked value coming back means "unchanged".
    for (const f of ["account_number", "iban"] as const) {
      if (data[f]?.includes("•")) row[f] = existing?.[f] ?? null;
    }
    const { error } = await sdb()
      .from("workspace_payment_details")
      .upsert(row, { onConflict: "workspace_id" });
    if (error)
      throw new Error(
        /relation|does not exist/.test(error.message)
          ? "Payment Details isn't switched on yet. Ask IGE to apply the latest update."
          : error.message,
      );
    return { ok: true };
  });

export const DIGEST_OPTIONS = ["daily", "weekly", "off"] as const;

export const getDigestPreference = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await sdb()
      .from("profiles")
      .select("digest_frequency")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      frequency: (error
        ? "daily"
        : (data?.digest_frequency ?? "daily")) as (typeof DIGEST_OPTIONS)[number],
      ready: !error,
    };
  });

export const setDigestPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { frequency: string }) =>
    z.object({ frequency: z.enum(DIGEST_OPTIONS) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await sdb()
      .from("profiles")
      .update({ digest_frequency: data.frequency })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const CATEGORY_IDS = NOTIFICATION_CATEGORIES.map((c) => c.id) as [
  NotificationCategory,
  ...NotificationCategory[],
];

export type NotificationPreference = {
  category: NotificationCategory;
  in_app: boolean;
  email: boolean;
};

export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await sdb()
      .from("notification_preferences")
      .select("category, in_app, email")
      .eq("user_id", context.userId);
    const rows = (data ?? []) as NotificationPreference[];
    // No row means on.
    const prefs: NotificationPreference[] = CATEGORY_IDS.map(
      (category) =>
        rows.find((r) => r.category === category) ?? { category, in_app: true, email: true },
    );
    return { prefs, ready: !error };
  });

export const setNotificationPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: NotificationPreference) =>
    z.object({ category: z.enum(CATEGORY_IDS), in_app: z.boolean(), email: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await sdb()
      .from("notification_preferences")
      .upsert(
        { user_id: context.userId, ...data, updated_at: new Date().toISOString() },
        { onConflict: "user_id,category" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
