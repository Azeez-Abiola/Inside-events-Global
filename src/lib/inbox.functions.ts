import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { idb, openInboxThread, slaDueAt } from "@/lib/admin-inbox.server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Message IGE (TAB 4 §4.4.4) and the Admin Inbox (TAB 6 §6.10).
 *
 * The only person-to-person channel on the platform runs between a user and
 * the IGE team. Users never see or message each other (TAB 19 §19.1A), so a
 * user can only ever open, read and reply to their own threads, and every
 * reply they receive comes from "IGE", never from a named individual's inbox.
 */

export const MESSAGE_KINDS = ["message", "request", "question"] as const;
export const INBOX_STATUSES = ["new", "in_progress", "resolved"] as const;

/** Form fields carried on a thread: plain values only, so they serialise. */
export type InboxPayloadValue = string | number | boolean | null | string[];

export interface InboxThread {
  id: string;
  user_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  source: string;
  subject: string;
  status: (typeof INBOX_STATUSES)[number];
  assigned_admin_id: string | null;
  sla_due_at: string | null;
  payload: Record<string, InboxPayloadValue>;
  last_message_at: string;
  unread_for_admin: boolean;
  unread_for_user: boolean;
  created_at: string;
}

export interface InboxMessage {
  id: string;
  thread_id: string;
  from_admin: boolean;
  is_internal_note: boolean;
  body: string;
  created_at: string;
}

// ─── User side: Message IGE ───────────────────────────────────────────────────

export const listMyIgeThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await idb()
      .from("admin_inbox_threads")
      .select("id, source, subject, status, last_message_at, unread_for_user, created_at, payload")
      .eq("user_id", context.userId)
      .order("last_message_at", { ascending: false });
    return { threads: (data ?? []) as InboxThread[] };
  });

export const getMyIgeThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ thread_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: thread } = await idb()
      .from("admin_inbox_threads")
      .select("id, source, subject, status, last_message_at, created_at")
      .eq("id", data.thread_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!thread) throw new Error("Conversation not found.");

    const { data: messages } = await idb()
      .from("admin_inbox_messages")
      .select("id, thread_id, from_admin, body, created_at")
      .eq("thread_id", data.thread_id)
      .eq("is_internal_note", false)
      .order("created_at");

    await idb()
      .from("admin_inbox_threads")
      .update({ unread_for_user: false })
      .eq("id", data.thread_id);

    return { thread: thread as InboxThread, messages: (messages ?? []) as InboxMessage[] };
  });

export const sendToIge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        thread_id: z.string().uuid().optional(),
        kind: z.enum(MESSAGE_KINDS).optional(),
        subject: z.string().trim().min(1).max(200).optional(),
        body: z.string().trim().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    if (!data.thread_id) {
      if (!data.subject) throw new Error("Add a subject so IGE knows what this is about.");
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, display_name")
        .eq("id", userId)
        .maybeSingle();
      const id = await openInboxThread({
        source: data.kind ?? "message",
        subject: data.subject,
        body: data.body,
        userId,
        contactName: profile?.display_name ?? null,
        contactEmail: profile?.email ?? null,
      });
      if (!id) throw new Error("Message IGE is not available yet. Please try again shortly.");
      return { thread_id: id };
    }

    const { data: thread } = await idb()
      .from("admin_inbox_threads")
      .select("id, status, source")
      .eq("id", data.thread_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!thread) throw new Error("Conversation not found.");

    const { error } = await idb()
      .from("admin_inbox_messages")
      .insert({ thread_id: thread.id, sender_id: userId, from_admin: false, body: data.body });
    if (error) throw new Error(error.message);

    const now = new Date();
    await idb()
      .from("admin_inbox_threads")
      .update({
        last_message_at: now.toISOString(),
        unread_for_admin: true,
        // A reply on a resolved thread reopens it rather than going unseen.
        ...(thread.status === "resolved"
          ? { status: "new", resolved_at: null, sla_due_at: slaDueAt(thread.source, now) }
          : {}),
      })
      .eq("id", thread.id);
    return { thread_id: thread.id as string };
  });

/** Badge count for the nav. */
export const getMyIgeUnread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await idb()
      .from("admin_inbox_threads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("unread_for_user", true);
    return { unread: count ?? 0 };
  });

// ─── Admin side: the Inbox ────────────────────────────────────────────────────

export const listInbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        status: z.enum([...INBOX_STATUSES, "open", "all"]).optional(),
        source: z.string().max(40).optional(),
        assigned: z.enum(["me", "unassigned", "any"]).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "contact");
    let q = idb()
      .from("admin_inbox_threads")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(300);
    const status = data.status ?? "open";
    if (status === "open") q = q.neq("status", "resolved");
    else if (status !== "all") q = q.eq("status", status);
    if (data.source) q = q.eq("source", data.source);
    if (data.assigned === "me") q = q.eq("assigned_admin_id", context.userId);
    if (data.assigned === "unassigned") q = q.is("assigned_admin_id", null);
    const { data: rows } = await q;

    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["abw_admin", "super_admin"]);
    const adminIds = [...new Set((admins ?? []).map((a) => a.user_id))];
    const { data: profiles } = adminIds.length
      ? await supabaseAdmin.from("profiles").select("id, display_name, email").in("id", adminIds)
      : { data: [] };

    return {
      threads: (rows ?? []) as InboxThread[],
      admins: (profiles ?? []).map((p) => ({
        id: p.id,
        name: p.display_name ?? p.email ?? "Admin",
      })),
    };
  });

export const getInboxThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ thread_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "contact");
    const [{ data: thread }, { data: messages }] = await Promise.all([
      idb().from("admin_inbox_threads").select("*").eq("id", data.thread_id).maybeSingle(),
      idb()
        .from("admin_inbox_messages")
        .select("*")
        .eq("thread_id", data.thread_id)
        .order("created_at"),
    ]);
    if (!thread) throw new Error("Thread not found.");
    await idb()
      .from("admin_inbox_threads")
      .update({ unread_for_admin: false })
      .eq("id", data.thread_id);

    // Enough account context to answer without tab-switching (TAB 17 §17.1).
    let account: { email: string | null; display_name: string | null; roles: string[] } | null =
      null;
    if (thread.user_id) {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("email, display_name")
          .eq("id", thread.user_id)
          .maybeSingle(),
        supabaseAdmin.from("user_roles").select("role").eq("user_id", thread.user_id),
      ]);
      account = {
        email: profile?.email ?? null,
        display_name: profile?.display_name ?? null,
        roles: (roles ?? []).map((r) => r.role),
      };
    }
    return {
      thread: thread as InboxThread,
      messages: (messages ?? []) as InboxMessage[],
      account,
    };
  });

export const replyToInbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        thread_id: z.string().uuid(),
        body: z.string().trim().min(1).max(8000),
        internal: z.boolean().optional(),
        resolve: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "contact");
    const { data: thread } = await idb()
      .from("admin_inbox_threads")
      .select("*")
      .eq("id", data.thread_id)
      .maybeSingle();
    if (!thread) throw new Error("Thread not found.");

    const { data: msg, error } = await idb()
      .from("admin_inbox_messages")
      .insert({
        thread_id: thread.id,
        sender_id: context.userId,
        from_admin: true,
        is_internal_note: data.internal ?? false,
        body: data.body,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const now = new Date().toISOString();
    await idb()
      .from("admin_inbox_threads")
      .update({
        last_message_at: now,
        unread_for_user: data.internal ? thread.unread_for_user : !!thread.user_id,
        status: data.resolve ? "resolved" : thread.status === "new" ? "in_progress" : thread.status,
        resolved_at: data.resolve ? now : null,
        assigned_admin_id: thread.assigned_admin_id ?? context.userId,
      })
      .eq("id", thread.id);

    // A real reply reaches the person by email too: signed-in users get a link
    // back to Message IGE, visitors get the reply itself.
    if (!data.internal) {
      let email: string | null = thread.contact_email;
      if (thread.user_id) {
        const { data: p } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", thread.user_id)
          .maybeSingle();
        email = p?.email ?? email;
      }
      if (email) {
        await sendTransactionalEmailServer({
          templateName: "new-message",
          recipientEmail: email,
          idempotencyKey: `ige-reply-${msg.id}`,
          templateData: {
            senderName: "Inside Global Events",
            preview: data.body.slice(0, thread.user_id ? 200 : 4000),
            threadUrl: thread.user_id
              ? `${getSiteUrl()}/messages?thread=${thread.id}`
              : `mailto:hi@insideglobalevents.com?subject=${encodeURIComponent(`Re: ${thread.subject}`)}`,
          },
        }).catch(() => {});
      }
    }

    await recordAdminAudit({
      actorId: context.userId,
      action: "inbox_reply",
      summary: `${data.internal ? "Internal note on" : "Replied to"} inbox thread "${thread.subject}"`,
      resourceType: "inbox_thread",
      resourceId: thread.id,
      metadata: { internal: !!data.internal, resolved: !!data.resolve },
    }).catch(() => {});
    return { ok: true as const };
  });

export const updateInboxThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        thread_id: z.string().uuid(),
        status: z.enum(INBOX_STATUSES).optional(),
        assigned_admin_id: z.string().uuid().nullish(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "contact");
    const patch: Record<string, unknown> = {};
    if (data.status) {
      patch.status = data.status;
      patch.resolved_at = data.status === "resolved" ? new Date().toISOString() : null;
    }
    if (data.assigned_admin_id !== undefined) patch.assigned_admin_id = data.assigned_admin_id;
    await idb().from("admin_inbox_threads").update(patch).eq("id", data.thread_id);
    await recordAdminAudit({
      actorId: context.userId,
      action: "inbox_update",
      summary: "Updated an inbox thread's status or assignee",
      resourceType: "inbox_thread",
      resourceId: data.thread_id,
      metadata: patch,
    }).catch(() => {});
    return { ok: true as const };
  });

/**
 * Live Chat hand-off (TAB 17 §17.2): when the assistant can't resolve a
 * question, or the user asks for a person, the transcript opens a Support
 * thread that continues in Message IGE.
 */
export const escalateLiveChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        transcript: z
          .array(z.object({ from: z.enum(["user", "assistant"]), text: z.string().max(2000) }))
          .min(1)
          .max(40),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", context.userId)
      .maybeSingle();
    const firstQuestion = data.transcript.find((m) => m.from === "user")?.text ?? "Live chat";
    const body = data.transcript
      .map((m) => `${m.from === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n\n")
      .slice(0, 4000);
    const id = await openInboxThread({
      source: "live_chat",
      subject: `Live chat: ${firstQuestion}`.slice(0, 150),
      body,
      userId: context.userId,
      contactName: profile?.display_name ?? null,
      contactEmail: profile?.email ?? null,
    });
    if (!id) throw new Error("Support chat is not available yet. Please use Message IGE.");
    return { thread_id: id };
  });
