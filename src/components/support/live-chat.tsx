import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { escalateLiveChat, sendToIge } from "@/lib/inbox.functions";
import { recordHelpFeedback } from "@/lib/help-feedback.functions";
import { findHelpAnswer, wantsHuman, type HelpArticle } from "@/lib/help-center";

type Msg = {
  from: "user" | "assistant";
  text: string;
  article?: HelpArticle;
  askHelpful?: boolean;
};

const GREETING: Msg = {
  from: "assistant",
  text: "Hi, I'm IGE's help assistant. Ask me anything about using IGE. If I can't help, I'll pass you to a person on the IGE Support team.",
};

/**
 * Live Chat with IGE Support, never with another user (TAB 17 §17.2). A
 * rules-based assistant answers from the Help Center first and hands off to
 * a human on request or after two unresolved replies; the transcript lands
 * in the Admin Inbox and the conversation continues in Message IGE.
 */
export function LiveChat() {
  const escalate = useServerFn(escalateLiveChat);
  const send = useServerFn(sendToIge);
  const feedback = useServerFn(recordHelpFeedback);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [text, setText] = useState("");
  const [unresolved, setUnresolved] = useState(0);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, open]);

  const say = (m: Msg) => setMsgs((all) => [...all, m]);

  const handOff = async (history: Msg[]) => {
    setBusy(true);
    try {
      const { thread_id } = await escalate({
        data: {
          transcript: history
            .filter((m) => m !== GREETING)
            .map((m) => ({ from: m.from, text: m.text.slice(0, 2000) }))
            .slice(-40),
        },
      });
      setThreadId(thread_id);
      say({
        from: "assistant",
        text: "I've passed this to the IGE Support team with our conversation so far. A person will reply here and in Message IGE, usually within a couple of hours.",
      });
    } catch (e) {
      say({
        from: "assistant",
        text: e instanceof Error ? e.message : "Couldn't reach Support. Please use Message IGE.",
      });
    } finally {
      setBusy(false);
    }
  };

  const markUnresolved = (history: Msg[]) => {
    const n = unresolved + 1;
    setUnresolved(n);
    if (n >= 2) void handOff(history);
  };

  const submit = async () => {
    const q = text.trim();
    if (!q || busy) return;
    setText("");
    const mine: Msg = { from: "user", text: q };
    const history = [...msgs.map((m) => ({ ...m, askHelpful: false })), mine];
    setMsgs(history);

    if (threadId) {
      setBusy(true);
      try {
        await send({ data: { thread_id: threadId, body: q } });
      } catch (e) {
        say({
          from: "assistant",
          text: e instanceof Error ? e.message : "That didn't send. Try Message IGE.",
        });
      } finally {
        setBusy(false);
      }
      return;
    }
    if (wantsHuman(q)) return void handOff(history);
    const article = findHelpAnswer(q);
    if (article) {
      say({ from: "assistant", text: article.a, article, askHelpful: true });
    } else {
      const reply: Msg = {
        from: "assistant",
        text: "I don't have a confident answer to that one.",
      };
      say(reply);
      // A question with no article is a Help Center content gap (TAB 17 §17.3).
      void feedback({ data: { question: q.slice(0, 500), source: "chat" } }).catch(() => {});
      markUnresolved([...history, reply]);
    }
  };

  const helpful = (yes: boolean) => {
    const asked = [...msgs].reverse().find((m) => m.askHelpful && m.article);
    if (asked?.article) {
      void feedback({ data: { article_id: asked.article.id, helpful: yes, source: "chat" } }).catch(
        () => {},
      );
    }
    setMsgs((all) => all.map((m) => ({ ...m, askHelpful: false })));
    if (yes) say({ from: "assistant", text: "Glad that helped. Anything else?" });
    else {
      const reply: Msg = {
        from: "assistant",
        text: "Sorry about that. Can you tell me a bit more?",
      };
      const history = [...msgs, { from: "user" as const, text: "(That didn't help.)" }, reply];
      setMsgs(history);
      markUnresolved(history);
    }
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Chat with IGE Support"
          className="fixed bottom-24 right-4 z-50 flex h-[min(520px,70vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between bg-brand-gradient px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">IGE Support</p>
              <p className="text-[11px] opacity-90">
                {threadId ? "Connected to the Support team" : "Help assistant"}
              </p>
            </div>
            <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.from === "user"
                    ? "ml-8 rounded-xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground"
                    : "mr-8 rounded-xl rounded-bl-sm bg-muted px-3 py-2 text-foreground"
                }
              >
                {m.article && <p className="mb-1 text-xs font-semibold">{m.article.q}</p>}
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.article?.link && (
                  <Link
                    to={m.article.link.to}
                    onClick={() => setOpen(false)}
                    className="mt-1 inline-block text-xs font-semibold text-primary underline"
                  >
                    {m.article.link.label}
                  </Link>
                )}
                {m.askHelpful && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    Was this helpful?
                    <button
                      type="button"
                      aria-label="Yes"
                      onClick={() => helpful(true)}
                      className="rounded p-1 hover:bg-background"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="No"
                      onClick={() => helpful(false)}
                      className="rounded p-1 hover:bg-background"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {threadId && (
              <Link
                to="/messages"
                search={{ thread: threadId }}
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold text-primary underline"
              >
                Open this conversation in Message IGE
              </Link>
            )}
            <div ref={end} />
          </div>
          <form
            className="flex gap-2 border-t border-border p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={threadId ? "Message Support…" : "Ask a question…"}
              aria-label="Your message"
              maxLength={2000}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !text.trim()}
              aria-label="Send"
              className="rounded-md bg-primary px-3 text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          {!threadId && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void handOff([...msgs, { from: "user", text: "I'd like to talk to a person." }])
              }
              className="border-t border-border py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Talk to a person instead
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        aria-label={open ? "Close IGE Support chat" : "Chat with IGE Support"}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
