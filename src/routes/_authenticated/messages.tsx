import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, Plus, Send, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { InfoTip } from "@/components/info-tip";
import { MESSAGE_KINDS, getMyIgeThread, listMyIgeThreads, sendToIge } from "@/lib/inbox.functions";

/**
 * Message IGE (TAB 4 §4.4.4).
 *
 * Users send IGE a message, a request or a question; only the IGE team sees
 * it. There is no way to reach another user from here — or from anywhere on
 * the platform (TAB 19 §19.1A). Wanting to talk to an organiser or a sponsor
 * is itself a request IGE handles, and that is what the prefilled subject is
 * for when a page links here.
 */

const searchSchema = z.object({
  thread: z.string().uuid().optional(),
  subject: z.string().max(200).optional(),
  kind: z.enum(MESSAGE_KINDS).optional(),
});

const FORM_INPUT =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring";

const KIND_LABEL: Record<(typeof MESSAGE_KINDS)[number], string> = {
  message: "A message",
  request: "A request (a type of sponsor, a media partner, execution support…)",
  question: "A question",
};

const STATUS_LABEL: Record<string, string> = {
  new: "Sent",
  in_progress: "IGE is on it",
  resolved: "Resolved",
};

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Message IGE - IGE" }] }),
  component: MessageIgePage,
});

function MessageIgePage() {
  const search = useSearch({ from: "/_authenticated/messages" });
  const navigate = useNavigate({ from: "/messages" });
  const qc = useQueryClient();
  const fetchThreads = useServerFn(listMyIgeThreads);
  const fetchThread = useServerFn(getMyIgeThread);
  const send = useServerFn(sendToIge);

  const [composing, setComposing] = useState(!!search.subject);
  const [kind, setKind] = useState<(typeof MESSAGE_KINDS)[number]>(search.kind ?? "message");
  const [subject, setSubject] = useState(search.subject ?? "");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (search.subject) {
      setComposing(true);
      setSubject(search.subject);
      if (search.kind) setKind(search.kind);
    }
  }, [search.subject, search.kind]);

  const { data: tdata, isLoading } = useQuery({
    queryKey: ["ige-threads"],
    queryFn: () => fetchThreads(),
  });
  const threads = tdata?.threads ?? [];
  const active = search.thread ?? (composing ? null : (threads[0]?.id ?? null));

  const { data: mdata } = useQuery({
    queryKey: ["ige-thread", active],
    queryFn: () => fetchThread({ data: { thread_id: active! } }),
    enabled: !!active,
    refetchInterval: 20000,
  });

  const sendMut = useMutation({
    mutationFn: (payload: {
      thread_id?: string;
      kind?: typeof kind;
      subject?: string;
      body: string;
    }) => send({ data: payload }),
    onSuccess: (res) => {
      setBody("");
      setComposing(false);
      qc.invalidateQueries({ queryKey: ["ige-threads"] });
      qc.invalidateQueries({ queryKey: ["ige-thread", res.thread_id] });
      navigate({ search: { thread: res.thread_id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center font-display text-3xl font-bold tracking-tight">
            Message IGE
            <InfoTip tip="messages.ige" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your direct line to the IGE team. Only IGE sees what you send here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setComposing(true);
            setSubject("");
            navigate({ search: {} });
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-soft"
        >
          <Plus className="h-4 w-4" /> New message
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="overflow-hidden rounded-xl border border-border bg-card">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setComposing(false);
                  navigate({ search: { thread: t.id } });
                }}
                className={`flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors ${active === t.id && !composing ? "bg-brand-soft" : "hover:bg-muted/50"}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{t.subject}</div>
                    {t.unread_for_user && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-primary"
                        aria-label="New reply"
                      />
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="capitalize">{t.source.replace(/_/g, " ")}</span>
                    <span>·</span>
                    <span>{STATUS_LABEL[t.status] ?? t.status}</span>
                  </div>
                </div>
              </button>
            ))
          )}
          {!isLoading && !threads.length && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto h-6 w-6 opacity-50" />
              <p className="mt-2">Nothing sent yet.</p>
            </div>
          )}
        </aside>

        <section className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
          {composing ? (
            <form
              className="flex flex-1 flex-col p-6"
              onSubmit={(e) => {
                e.preventDefault();
                sendMut.mutate({ kind, subject: subject.trim(), body: body.trim() });
              }}
            >
              <h2 className="font-display text-lg font-bold">New message to IGE</h2>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                IGE does not pass your message to other users. If you want to meet a sponsor,
                organiser or partner, say so here and the team will arrange it.
              </p>
              <div className="mt-6 space-y-4">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">What is it?</span>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as typeof kind)}
                    className={FORM_INPUT}
                  >
                    {MESSAGE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">Subject</span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                    className={FORM_INPUT}
                    placeholder="e.g. Looking for a media partner for our March summit"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">Message</span>
                  <textarea
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={4000}
                    className={FORM_INPUT}
                  />
                </label>
              </div>
              <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setComposing(false)}
                  className="rounded-md px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!subject.trim() || !body.trim() || sendMut.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {sendMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send to IGE
                </button>
              </div>
            </form>
          ) : active && mdata ? (
            <>
              <div className="border-b border-border px-6 py-4">
                <div className="font-semibold">{mdata.thread.subject}</div>
                <div className="text-xs text-muted-foreground">
                  {STATUS_LABEL[mdata.thread.status] ?? mdata.thread.status}
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-6">
                {mdata.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.from_admin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.from_admin ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}
                    >
                      {m.from_admin && (
                        <div className="mb-0.5 text-[11px] font-semibold text-primary-deep">
                          IGE team
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <div
                        className={`mt-1 text-[10px] ${m.from_admin ? "text-muted-foreground" : "text-primary-foreground/70"}`}
                      >
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (body.trim()) sendMut.mutate({ thread_id: active, body: body.trim() });
                }}
                className="flex gap-2 border-t border-border p-4"
              >
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Reply to IGE…"
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
              <p>
                Ask IGE anything — a type of sponsor you want, a media partner, help delivering an
                activation.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
