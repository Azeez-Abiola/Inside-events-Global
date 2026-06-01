import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("messages")
      .select("thread_id, sender_id, recipient_id, body, created_at, read, event_id")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(200);

    const threads = new Map<string, { thread_id: string; other_user_id: string; last: any; unread: number; event_id: string | null }>();
    for (const m of data ?? []) {
      const t = threads.get(m.thread_id);
      const other = m.sender_id === userId ? m.recipient_id : m.sender_id;
      if (!t) {
        threads.set(m.thread_id, {
          thread_id: m.thread_id,
          other_user_id: other,
          last: m,
          unread: !m.read && m.recipient_id === userId ? 1 : 0,
          event_id: m.event_id,
        });
      } else if (!m.read && m.recipient_id === userId) {
        t.unread += 1;
      }
    }
    return { threads: Array.from(threads.values()) };
  });

export const getThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { thread_id: string }) => z.object({ thread_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: msgs } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("thread_id", data.thread_id)
      .order("created_at", { ascending: true });
    // Authorization: caller must be a participant in this thread.
    const messages = msgs ?? [];
    const isParticipant = messages.some(
      (m: any) => m.sender_id === userId || m.recipient_id === userId,
    );
    if (!isParticipant) throw new Error("Forbidden");
    // Mark as read
    await supabase
      .from("messages")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("thread_id", data.thread_id)
      .eq("recipient_id", userId)
      .eq("read", false);
    return { messages };
  });

const SendInput = z.object({
  recipient_id: z.string().uuid(),
  body: z.string().min(1).max(4000),
  event_id: z.string().uuid().optional().nullable(),
  thread_id: z.string().uuid().optional().nullable(),
});
export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SendInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const thread_id = data.thread_id ?? crypto.randomUUID();
    const { error } = await supabase.from("messages").insert({
      thread_id,
      sender_id: userId,
      recipient_id: data.recipient_id,
      event_id: data.event_id ?? null,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("notifications").insert({
      user_id: data.recipient_id,
      type: "new_message",
      title: "New message",
      body: data.body.slice(0, 140),
      data: { thread_id },
    });
    return { ok: true, thread_id };
  });
