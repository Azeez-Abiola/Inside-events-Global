import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import { type SignupRole } from "@/lib/signup-roles";

/**
 * "Not sure which one fits? Take our thirty second quiz" — a three question
 * branching quiz that recommends a role (TAB 2 §2.2).
 */
type Answer = { label: string; next?: string; role?: SignupRole };
const QUESTIONS: Record<string, { q: string; answers: Answer[] }> = {
  start: {
    q: "What brings you to IGE?",
    answers: [
      { label: "I run or manage an event", next: "event" },
      { label: "I have a sponsorship or marketing budget", role: "sponsor" },
      { label: "I connect, sell or manage partnerships", next: "partner" },
      { label: "I make or cover content", next: "content" },
    ],
  },
  event: {
    q: "What do you need for it?",
    answers: [
      { label: "Sponsors, partners or funding", role: "organiser" },
      { label: "Just a place to plan and manage it privately", role: "organiser" },
      { label: "It's my brand's own event", role: "sponsor" },
    ],
  },
  partner: {
    q: "How do you work?",
    answers: [
      { label: "I introduce brands to events and want commission", role: "referral_partner" },
      { label: "I manage clients, outreach and a pipeline every day", role: "partnerships_pro" },
    ],
  },
  content: {
    q: "Which sounds more like you?",
    answers: [
      { label: "I cover and document events for an outlet or channel", role: "media_partner" },
      { label: "I have a production brands could appear in", role: "creative_hub" },
    ],
  },
};

export function RoleQuiz({ onPick }: { onPick: (role: SignupRole) => void }) {
  const [open, setOpen] = useState(false);
  const [node, setNode] = useState("start");
  const [steps, setSteps] = useState(1);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <Sparkles className="h-4 w-4" /> Not sure which one fits? Take our thirty second quiz
      </button>
    );
  }
  const step = QUESTIONS[node];
  return (
    <div className="mt-4 rounded-xl border border-primary/30 bg-brand-soft p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-primary-deep">
          Question {steps} of 3
        </p>
        <button
          type="button"
          aria-label="Close quiz"
          onClick={() => {
            setOpen(false);
            setNode("start");
            setSteps(1);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{step.q}</p>
      <div className="mt-3 grid gap-2">
        {step.answers.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => {
              if (a.role) {
                onPick(a.role);
                setOpen(false);
                setNode("start");
                setSteps(1);
                toast.success("We've picked the role that fits — check it below the list.");
              } else if (a.next) {
                setNode(a.next);
                setSteps((s) => s + 1);
              }
            }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-left text-sm hover:border-primary"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The secondary link below the role cards (TAB 2 §2.2): a request for a
 * service rather than an identity, so it opens a contact form to the Admin
 * Inbox and does not create an account.
 */
export function RetainerRequest() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", company: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  if (done) {
    return (
      <p className="mt-5 flex items-center justify-center gap-1.5 text-sm text-secondary-deep">
        <CheckCircle2 className="h-4 w-4" /> Sent. The ABW team will be in touch.
      </p>
    );
  }
  return (
    <div className="mt-5 border-t border-border pt-4 text-center">
      {!open ? (
        <p className="text-xs text-muted-foreground">
          Would you rather AlexBoyo World handle execution strategy, planning or management for you?{" "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-semibold text-primary hover:underline"
          >
            Email Admin to talk about our retainer services.
          </button>
        </p>
      ) : (
        <form
          className="space-y-2 text-left"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const res = await fetch("/api/public/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  source: "abw_consulting",
                  name: f.name,
                  email: f.email,
                  company: f.company,
                  subject: "Retainer services enquiry (from sign-up)",
                  message: f.message,
                }),
              });
              const body = (await res.json().catch(() => ({}))) as { error?: string };
              if (!res.ok) throw new Error(body.error ?? "Could not send.");
              setDone(true);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not send.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="text-sm font-semibold text-foreground">
            Talk to ABW about retainer services
          </p>
          <input
            required
            placeholder="Full name"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            className={input}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            className={input}
          />
          <input
            placeholder="Organisation"
            value={f.company}
            onChange={(e) => setF({ ...f, company: e.target.value })}
            className={input}
          />
          <textarea
            rows={2}
            placeholder="What do you need help with?"
            value={f.message}
            onChange={(e) => setF({ ...f, message: e.target.value })}
            className={input}
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-brand-soft disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send to IGE"}
          </button>
        </form>
      )}
    </div>
  );
}
