import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";

async function enrichProfiles(userIds: string[]) {
  if (!userIds.length) return {} as Record<string, { email: string; name: string; company?: string }>;
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, linkedin_employer")
    .in("id", userIds);
  const map: Record<string, { email: string; name: string; company?: string }> = {};
  for (const p of profiles ?? []) {
    map[p.id] = {
      email: p.email ?? "",
      name: p.email?.split("@")[0] ?? "User",
      company: p.linkedin_employer ?? undefined,
    };
  }
  return map;
}

async function senderDisplayName(senderId: string): Promise<string> {
  const [{ data: org }, { data: sp }, { data: ref }, { data: profile }] = await Promise.all([
    supabaseAdmin.from("organiser_profiles").select("org_name").eq("user_id", senderId).maybeSingle(),
    supabaseAdmin.from("sponsor_profiles").select("brand_name").eq("user_id", senderId).maybeSingle(),
    supabaseAdmin.from("referral_partner_profiles").select("full_name").eq("user_id", senderId).maybeSingle(),
    supabaseAdmin.from("profiles").select("email").eq("id", senderId).maybeSingle(),
  ]);
  return (
    org?.org_name ??
    sp?.brand_name ??
    ref?.full_name ??
    profile?.email?.split("@")[0] ??
    "Someone"
  );
}

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

    const threadList = Array.from(threads.values());
    const otherIds = threadList.map((t) => t.other_user_id);
    const eventIds = threadList.map((t) => t.event_id).filter(Boolean) as string[];
    const [profileMap, eventMap] = await Promise.all([
      enrichProfiles(otherIds),
      eventIds.length
        ? supabaseAdmin.from("events").select("id, name").in("id", eventIds).then(({ data: evs }) => {
            const m: Record<string, string> = {};
            for (const e of evs ?? []) m[e.id] = e.name ?? "Event";
            return m;
          })
        : Promise.resolve({} as Record<string, string>),
    ]);

    return {
      threads: threadList.map((t) => ({
        ...t,
        other_name: profileMap[t.other_user_id]?.name ?? "User",
        other_email: profileMap[t.other_user_id]?.email,
        other_company: profileMap[t.other_user_id]?.company,
        event_name: t.event_id ? eventMap[t.event_id] : null,
      })),
    };
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
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        thread_id,
        sender_id: userId,
        recipient_id: data.recipient_id,
        event_id: data.event_id ?? null,
        body: data.body,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("notifications").insert({
      user_id: data.recipient_id,
      type: "new_message",
      title: "New message",
      body: data.body.slice(0, 140),
      data: { thread_id },
    });

    const [{ data: recipient }, senderName] = await Promise.all([
      supabaseAdmin.from("profiles").select("email").eq("id", data.recipient_id).maybeSingle(),
      senderDisplayName(userId),
    ]);
    if (recipient?.email) {
      const siteUrl = getSiteUrl();
      await sendTransactionalEmailServer({
        templateName: "new-message",
        recipientEmail: recipient.email,
        idempotencyKey: `new-message-${inserted.id}`,
        templateData: {
          senderName,
          preview: data.body.slice(0, 200),
          threadUrl: `${siteUrl}/messages?thread=${thread_id}`,
        },
      }).catch(() => {});
    }

    return { ok: true, thread_id };
  });

export const listMessageContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
    const roleSet = new Set((roles ?? []).map((r) => r.role));

    const contacts = new Map<string, { user_id: string; name: string; subtitle: string; event_id?: string; event_name?: string }>();

    function add(id: string, name: string, subtitle: string, event_id?: string, event_name?: string) {
      if (!id || id === userId) return;
      const existing = contacts.get(id);
      if (!existing) contacts.set(id, { user_id: id, name, subtitle, event_id, event_name });
    }

    if (roleSet.has("organiser")) {
      const { data: events } = await supabaseAdmin.from("events").select("id, name").eq("organiser_id", userId);
      const eventIds = (events ?? []).map((e) => e.id);
      const eventNames = Object.fromEntries((events ?? []).map((e) => [e.id, e.name]));
      if (eventIds.length) {
        const { data: forms } = await supabaseAdmin
          .from("commitment_forms")
          .select("sponsor_user_id, company_name, contact_name, event_id")
          .in("event_id", eventIds)
          .not("sponsor_user_id", "is", null);
        for (const f of forms ?? []) {
          add(f.sponsor_user_id!, f.contact_name ?? f.company_name ?? "Sponsor", f.company_name ?? "Sponsor", f.event_id, eventNames[f.event_id]);
        }
      }
    }

    if (roleSet.has("sponsor")) {
      const { data: forms } = await supabaseAdmin
        .from("commitment_forms")
        .select("event_id, company_name")
        .eq("sponsor_user_id", userId);
      const eventIds = Array.from(new Set((forms ?? []).map((f) => f.event_id)));
      if (eventIds.length) {
        const { data: evs } = await supabaseAdmin.from("events").select("id, name, organiser_id").in("id", eventIds);
        const { data: orgProfiles } = await supabaseAdmin
          .from("organiser_profiles")
          .select("user_id, org_name")
          .in("user_id", (evs ?? []).map((e) => e.organiser_id).filter(Boolean));
        const orgNames = Object.fromEntries((orgProfiles ?? []).map((o) => [o.user_id, o.org_name]));
        for (const e of evs ?? []) {
          add(e.organiser_id, orgNames[e.organiser_id] ?? "Event organiser", e.name ?? "Event", e.id, e.name ?? undefined);
        }
      }
    }

    if (roleSet.has("referral_partner")) {
      const { data: deals } = await supabaseAdmin
        .from("deals")
        .select("event_id, organiser_id, sponsor_user_id")
        .eq("referral_partner_id", userId);
      const eventIds = Array.from(new Set((deals ?? []).map((d) => d.event_id)));
      if (eventIds.length) {
        const { data: evs } = await supabaseAdmin.from("events").select("id, name, organiser_id").in("id", eventIds);
        const evMap = Object.fromEntries((evs ?? []).map((e) => [e.id, e]));
        for (const d of deals ?? []) {
          const ev = evMap[d.event_id];
          if (d.organiser_id) add(d.organiser_id, "Event organiser", ev?.name ?? "Event", d.event_id, ev?.name);
          if (d.sponsor_user_id) add(d.sponsor_user_id, "Sponsor", ev?.name ?? "Event", d.event_id, ev?.name);
        }
      }
    }

    // IGE admins available to all authenticated users
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["abw_admin", "super_admin"]);
    const adminIds = (admins ?? []).map((a) => a.user_id).filter((id) => id !== userId);
    if (adminIds.length) {
      const adminProfiles = await enrichProfiles(adminIds.slice(0, 3));
      for (const id of adminIds.slice(0, 3)) {
        add(id, adminProfiles[id]?.name ?? "IGE Team", "Platform support");
      }
    }

    return { contacts: Array.from(contacts.values()) };
  });
