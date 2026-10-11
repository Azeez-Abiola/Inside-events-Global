import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlarmClock, Inbox, Loader2, Lock, Send } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { InfoTip } from "@/components/info-tip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  getInboxThread,
  listInbox,
  replyToInbox,
  updateInboxThread,
  type InboxThread,
} from "@/lib/inbox.functions";

const SOURCES = [
  "live_chat",
  "message",
  "request",
  "question",
  "email_admin",
  "co_creation",
  "ige_services",
  "abw_consulting",
  "tribe_join",
  "password_reset",
  "complaint",
  "admin_access",
  "system",
];

const STATUS_STYLE: Record<string, string> = {
  new: "bg-primary/15 text-primary-deep",
  in_progress: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  resolved: "bg-secondary/15 text-secondary-deep",
};

const pretty = (s: string) => s.replace(/_/g, " ");

function slaLabel(t: InboxThread): { text: string; breached: boolean } | null {
  if (t.status === "resolved" || !t.sla_due_at) return null;
  const ms = new Date(t.sla_due_at).getTime() - Date.now();
  const hours = Math.round(Math.abs(ms) / 3_600_000);
  if (ms < 0) return { text: `SLA breached ${hours}h ago`, breached: true };
  return { text: hours < 1 ? "Due within the hour" : `${hours}h left`, breached: false };
}

/**
 * The Admin Inbox (TAB 6 §6.10): one threaded queue for Message IGE, the
 * Email Admin form, IGE Services and ABW Consulting requests, co-creation
 * interests, Tribe joins and password-reset notices — assignable, with a
 * status and an SLA timer.
 */
export function AdminInboxPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchInbox = useServerFn(listInbox);
  const fetchThread = useServerFn(getInboxThread);
  const reply = useServerFn(replyToInbox);
  const update = useServerFn(updateInboxThread);

  const [status, setStatus] = useState<"open" | "new" | "in_progress" | "resolved" | "all">("open");
  const [source, setSource] = useState("");
  const [assigned, setAssigned] = useState<"any" | "me" | "unassigned">("any");
  const [active, setActive] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inbox", status, source, assigned],
    queryFn: () => fetchInbox({ data: { status, source: source || undefined, assigned } }),
    refetchInterval: 30000,
  });
  const { data: thread } = useQuery({
    queryKey: ["admin-inbox-thread", active],
    queryFn: () => fetchThread({ data: { thread_id: active! } }),
    enabled: !!active,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-inbox"] });
    qc.invalidateQueries({ queryKey: ["admin-inbox-thread", active] });
  };

  const replyMut = useMutation({
    mutationFn: (resolve: boolean) =>
      reply({ data: { thread_id: active!, body: body.trim(), internal, resolve } }),
    onSuccess: () => {
      setBody("");
      toast.success(internal ? "Note added" : "Reply sent");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (patch: {
      status?: "new" | "in_progress" | "resolved";
      assigned_admin_id?: string | null;
    }) => update({ data: { thread_id: active!, ...patch } }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const threads = data?.threads ?? [];
  const admins = data?.admins ?? [];
  const t = thread?.thread;
  const payload = t?.payload ?? {};
  const payloadEntries = Object.entries(payload).filter(
    ([k, v]) => v != null && v !== "" && k !== "notification_type",
  );

  return (
    <WorkspacePage
      title="Admin Inbox"
      subtitle="Message IGE, Email Admin, service and consulting requests, co-creation interest, Tribe joins and password resets — one queue."
    >
      <div className="flex flex-wrap items-center gap-2">
        {(["open", "new", "in_progress", "resolved", "all"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${status === s ? "bg-brand-soft text-primary-deep" : "text-muted-foreground hover:bg-muted"}`}
          >
            {pretty(s)}
          </button>
        ))}
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          aria-label="Source"
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="">Every source</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {pretty(s)}
            </option>
          ))}
        </select>
        <select
          value={assigned}
          onChange={(e) => setAssigned(e.target.value as typeof assigned)}
          aria-label="Assignee"
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="any">Anyone</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <InfoTip tip="admin.inbox" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="max-h-[75vh] overflow-y-auto rounded-xl border border-border bg-card">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Inbox className="mx-auto h-6 w-6 opacity-50" />
              <p className="mt-2">Nothing here.</p>
            </div>
          ) : (
            threads.map((th) => {
              const sla = slaLabel(th);
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setActive(th.id)}
                  className={`block w-full border-b border-border p-4 text-left transition-colors ${active === th.id ? "bg-brand-soft" : "hover:bg-muted/50"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`truncate text-sm ${th.unread_for_admin ? "font-bold" : "font-medium"}`}
                    >
                      {th.subject}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLE[th.status]}`}
                    >
                      {pretty(th.status)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="capitalize">{pretty(th.source)}</span>
                    <span>·</span>
                    <span className="truncate">
                      {th.contact_name ?? th.contact_email ?? "Platform"}
                    </span>
                  </div>
                  {sla && (
                    <div
                      className={`mt-1 flex items-center gap-1 text-[11px] ${sla.breached ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      <AlarmClock className="h-3 w-3" />
                      {sla.text}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </aside>

        <section className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
          {!active || !t ? (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
              Pick a thread.
            </div>
          ) : (
            <>
              <div className="space-y-3 border-b border-border px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{t.subject}</div>
                    <div className="text-xs text-muted-foreground">
                      {pretty(t.source)} · {t.contact_name ?? "—"}
                      {t.contact_email && ` · ${t.contact_email}`}
                      {thread?.account?.roles.length
                        ? ` · ${thread.account.roles.map(pretty).join(", ")}`
                        : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={t.assigned_admin_id ?? ""}
                      onChange={(e) =>
                        updateMut.mutate({ assigned_admin_id: e.target.value || null })
                      }
                      aria-label="Assign to"
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      <option value="">Unassigned</option>
                      {admins.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.id === user?.id ? `${a.name} (me)` : a.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={t.status}
                      onChange={(e) =>
                        updateMut.mutate({
                          status: e.target.value as "new" | "in_progress" | "resolved",
                        })
                      }
                      aria-label="Status"
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
                {payloadEntries.length > 0 && (
                  <dl className="grid gap-x-4 gap-y-1 rounded-lg bg-muted/30 p-3 text-xs sm:grid-cols-2">
                    {payloadEntries.map(([k, v]) => (
                      <div key={k} className="min-w-0">
                        <dt className="capitalize text-muted-foreground">{pretty(k)}</dt>
                        <dd className="truncate text-foreground">
                          {Array.isArray(v) ? v.map(String).join(", ") : String(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-6">
                {thread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.from_admin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        m.is_internal_note
                          ? "border border-dashed border-amber-500/50 bg-amber-500/10 text-foreground"
                          : m.from_admin
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                      }`}
                    >
                      {m.is_internal_note && (
                        <div className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                          <Lock className="h-3 w-3" /> Internal note
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <div className="mt-1 text-[10px] opacity-70">
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <form
                className="space-y-2 border-t border-border p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (body.trim()) replyMut.mutate(false);
                }}
              >
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  placeholder={
                    internal
                      ? "Note for the admin team — the user never sees this"
                      : t.user_id
                        ? "Reply — they see it in Message IGE and by email"
                        : "Reply — sent to them by email"
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                    />
                    Internal note
                  </label>
                  <div className="flex gap-2">
                    {!internal && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!body.trim() || replyMut.isPending}
                        onClick={() => replyMut.mutate(true)}
                      >
                        Send and resolve
                      </Button>
                    )}
                    <Button type="submit" size="sm" disabled={!body.trim() || replyMut.isPending}>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      {internal ? "Add note" : "Send"}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </WorkspacePage>
  );
}
