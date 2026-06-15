import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { listThreads, getThread, sendMessage, listMessageContacts } from "@/lib/messaging.functions";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageSquare, Plus, Loader2 } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  thread: z.string().uuid().optional(),
  to: z.string().uuid().optional(),
  event_id: z.string().uuid().optional(),
});

const FORM_INPUT =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Messages - IGE" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const search = useSearch({ from: "/_authenticated/messages" });
  const navigate = useNavigate({ from: "/messages" });
  const fetchThreads = useServerFn(listThreads);
  const fetchThread = useServerFn(getThread);
  const fetchContacts = useServerFn(listMessageContacts);
  const send = useServerFn(sendMessage);
  const qc = useQueryClient();

  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState(search.to ?? "");
  const [composeEventId, setComposeEventId] = useState(search.event_id ?? "");

  const { data: tdata, isLoading: threadsLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: () => fetchThreads(),
  });
  const { data: contactsData } = useQuery({
    queryKey: ["message-contacts"],
    queryFn: () => fetchContacts(),
  });

  const active = search.thread ?? (composing ? null : tdata?.threads[0]?.thread_id ?? null);

  const { data: mdata } = useQuery({
    queryKey: ["thread", active],
    queryFn: () => fetchThread({ data: { thread_id: active! } }),
    enabled: !!active,
    refetchInterval: 15000,
  });

  const [body, setBody] = useState("");
  const activeThread = tdata?.threads.find((t) => t.thread_id === active);
  const composeContact = contactsData?.contacts.find((c) => c.user_id === composeTo);

  useEffect(() => {
    if (search.to) {
      setComposing(true);
      setComposeTo(search.to);
      if (search.event_id) setComposeEventId(search.event_id);
    }
  }, [search.to, search.event_id]);

  useEffect(() => {
    if (!active || !user) return;
    const channel = supabase
      .channel(`thread-${active}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${active}` },
        () => {
          qc.invalidateQueries({ queryKey: ["thread", active] });
          qc.invalidateQueries({ queryKey: ["threads"] });
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [active, user, qc]);

  const sendMut = useMutation({
    mutationFn: (payload: { recipient_id: string; body: string; event_id?: string | null; thread_id?: string | null }) =>
      send({ data: payload }),
    onSuccess: (res) => {
      setBody("");
      setComposing(false);
      qc.invalidateQueries({ queryKey: ["thread", res.thread_id] });
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ search: { thread: res.thread_id } });
    },
  });

  function startCompose(contact?: { user_id: string; event_id?: string }) {
    setComposing(true);
    setComposeTo(contact?.user_id ?? "");
    setComposeEventId(contact?.event_id ?? "");
    navigate({ search: {} });
  }

  const headerName = composing
    ? (composeContact?.name ?? "New message")
    : (activeThread?.other_name ?? "Conversation");

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">Messages</h1>
        <button
          type="button"
          onClick={() => startCompose()}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-soft"
        >
          <Plus className="h-4 w-4" /> New message
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="overflow-hidden rounded-xl border border-border bg-card">
          {threadsLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            (tdata?.threads ?? []).map((t) => (
              <button
                key={t.thread_id}
                type="button"
                onClick={() => { setComposing(false); navigate({ search: { thread: t.thread_id } }); }}
                className={`flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors ${active === t.thread_id && !composing ? "bg-brand-soft" : "hover:bg-muted/50"}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary-deep">
                  {(t.other_name ?? "U").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{t.other_name}</div>
                    {t.unread > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{t.unread}</span>}
                  </div>
                  {t.event_name && <div className="truncate text-[11px] text-primary">{t.event_name}</div>}
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{t.last.body}</div>
                </div>
              </button>
            ))
          )}
          {!threadsLoading && !tdata?.threads.length && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto h-6 w-6 opacity-50" />
              <p className="mt-2">No conversations yet.</p>
              <button type="button" onClick={() => startCompose()} className="mt-3 text-primary font-semibold hover:underline">Start one →</button>
            </div>
          )}
        </aside>

        <section className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
          {composing ? (
            <div className="flex flex-1 flex-col p-6">
              <h2 className="font-display text-lg font-bold">New message</h2>
              <p className="mt-1 text-sm text-muted-foreground">Message someone from your network or the IGE team.</p>
              <div className="mt-6 space-y-4">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">Recipient</span>
                  <select value={composeTo} onChange={(e) => setComposeTo(e.target.value)} className={FORM_INPUT}>
                    <option value="">Select a contact…</option>
                    {(contactsData?.contacts ?? []).map((c) => (
                      <option key={c.user_id} value={c.user_id}>
                        {c.name} — {c.subtitle}
                      </option>
                    ))}
                  </select>
                </label>
                {composeContact?.event_name && (
                  <p className="text-xs text-muted-foreground">Regarding: <span className="font-medium text-foreground">{composeContact.event_name}</span></p>
                )}
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">Message</span>
                  <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} className={FORM_INPUT} placeholder="Write your message…" />
                </label>
              </div>
              <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
                <button type="button" onClick={() => setComposing(false)} className="rounded-md px-4 py-2 text-sm hover:bg-muted">Cancel</button>
                <button
                  type="button"
                  disabled={!composeTo || !body.trim() || sendMut.isPending}
                  onClick={() => sendMut.mutate({
                    recipient_id: composeTo,
                    body: body.trim(),
                    event_id: composeEventId || composeContact?.event_id || null,
                    thread_id: null,
                  })}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send
                </button>
              </div>
            </div>
          ) : active ? (
            <>
              <div className="border-b border-border px-6 py-4">
                <div className="font-semibold">{headerName}</div>
                {activeThread?.other_company && <div className="text-xs text-muted-foreground">{activeThread.other_company}</div>}
                {activeThread?.event_name && (
                  <div className="mt-1 text-xs text-primary">Re: {activeThread.event_name}</div>
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-6">
                {(mdata?.messages ?? []).map((m: any) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!mdata?.messages?.length && <p className="text-center text-sm text-muted-foreground">Start the conversation.</p>}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (body.trim() && activeThread) {
                    sendMut.mutate({
                      recipient_id: activeThread.other_user_id,
                      body: body.trim(),
                      event_id: activeThread.event_id,
                      thread_id: active!,
                    });
                  }
                }}
                className="flex gap-2 border-t border-border p-4"
              >
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type a message…"
                  className={`flex-1 ${FORM_INPUT}`}
                />
                <button
                  type="submit"
                  disabled={!body.trim() || sendMut.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-40" />
              <p>Select a conversation or start a new message.</p>
              {(contactsData?.contacts ?? []).length > 0 && (
                <div className="mt-4 w-full max-w-sm space-y-2 text-left">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick start</div>
                  {contactsData!.contacts.slice(0, 4).map((c) => (
                    <button
                      key={c.user_id}
                      type="button"
                      onClick={() => startCompose(c)}
                      className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground truncate ml-2">{c.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
