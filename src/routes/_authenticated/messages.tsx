import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { listThreads, getThread, sendMessage } from "@/lib/messaging.functions";
import { useAuth } from "@/lib/auth-context";
import { Send, MessageSquare } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ thread: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Messages — IGE" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const search = useSearch({ from: "/_authenticated/messages" });
  const navigate = useNavigate({ from: "/messages" });
  const fetchThreads = useServerFn(listThreads);
  const fetchThread = useServerFn(getThread);
  const send = useServerFn(sendMessage);
  const qc = useQueryClient();

  const { data: tdata } = useQuery({ queryKey: ["threads"], queryFn: () => fetchThreads() });
  const active = search.thread ?? tdata?.threads[0]?.thread_id ?? null;

  const { data: mdata } = useQuery({
    queryKey: ["thread", active],
    queryFn: () => fetchThread({ data: { thread_id: active! } }),
    enabled: !!active,
  });

  const [body, setBody] = useState("");
  const activeThread = tdata?.threads.find((t) => t.thread_id === active);

  const sendMut = useMutation({
    mutationFn: () => send({
      data: {
        recipient_id: activeThread!.other_user_id,
        body,
        event_id: activeThread!.event_id,
        thread_id: active!,
      },
    }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["thread", active] });
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold tracking-tight">Messages</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="overflow-hidden rounded-xl border border-border bg-card">
          {(tdata?.threads ?? []).map((t) => (
            <button
              key={t.thread_id}
              onClick={() => navigate({ search: { thread: t.thread_id } })}
              className={`flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors ${active === t.thread_id ? "bg-brand-soft" : "hover:bg-muted/50"}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
                {t.other_user_id.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium">{t.other_user_id.slice(0, 8)}…</div>
                  {t.unread > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{t.unread}</span>}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{t.last.body}</div>
              </div>
            </button>
          ))}
          {!tdata?.threads.length && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto h-6 w-6 opacity-50" />
              <p className="mt-2">No conversations yet.</p>
            </div>
          )}
        </aside>

        <section className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
          {active ? (
            <>
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
                onSubmit={(e) => { e.preventDefault(); if (body.trim()) sendMut.mutate(); }}
                className="flex gap-2 border-t border-border p-4"
              >
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
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
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Select a conversation</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
