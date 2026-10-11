import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * The single way anything lands in the Admin Inbox (TAB 6 §6.10).
 *
 * Message IGE, the Email Admin form, IGE Services requests, ABW Consulting
 * leads, co-creation interests, Tribe join requests and password-reset notices
 * all open a thread here, so Admin works one queue instead of six.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   The inbox tables postdate the last `supabase gen types` run. */
export const idb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * SLA by source, from the CX ticket priorities (TAB 17 §17.1): account lockout
 * is P1 (2h), anything blocking a deal P2 (8h), general P3 (24h), feedback P4.
 */
const SLA_HOURS: Record<string, number> = {
  password_reset: 2,
  live_chat: 2,
  complaint: 8,
  co_creation: 8,
  ige_services: 24,
  abw_consulting: 24,
  email_admin: 24,
  message: 24,
  request: 24,
  question: 24,
  admin_access: 24,
  tribe_join: 72,
  system: 72,
};

export function slaDueAt(source: string, from = new Date()): string {
  const hours = SLA_HOURS[source] ?? 24;
  return new Date(from.getTime() + hours * 3_600_000).toISOString();
}

export async function openInboxThread(input: {
  source: string;
  subject: string;
  body: string;
  userId?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  payload?: Record<string, unknown>;
  /** System notices (e.g. a reset email went out) need no reply by default. */
  startResolved?: boolean;
}): Promise<string | null> {
  const now = new Date();
  const { data: thread, error } = await idb()
    .from("admin_inbox_threads")
    .insert({
      user_id: input.userId ?? null,
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail ?? null,
      source: input.source,
      subject: input.subject.slice(0, 300),
      payload: input.payload ?? {},
      status: input.startResolved ? "resolved" : "new",
      resolved_at: input.startResolved ? now.toISOString() : null,
      sla_due_at: input.startResolved ? null : slaDueAt(input.source, now),
      unread_for_admin: !input.startResolved,
      last_message_at: now.toISOString(),
    })
    .select("id")
    .single();
  // The inbox must never break the action that fed it — a password reset
  // still has to go out if this table is missing or unreachable.
  if (error || !thread) return null;

  await idb()
    .from("admin_inbox_messages")
    .insert({
      thread_id: thread.id,
      sender_id: input.userId ?? null,
      from_admin: false,
      body: input.body.slice(0, 8000),
    });
  return thread.id as string;
}
