import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuthShell } from "@/components/auth-shell";
import { requestPasswordReset } from "@/lib/password-reset.functions";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password - IGE" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const requestReset = useServerFn(requestPasswordReset);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // The server decides whether an account exists, sends the link to the
    // address on file rather than the one typed here, and notifies Admin
    // (TAB 2 §2.4). It never reports back which of those happened, and a
    // thrown error is swallowed for the same reason: the screen must not
    // become a way to find out who is registered.
    await requestReset({ data: { email: email.trim() } }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure link to set a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-deep">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          If <span className="font-semibold text-foreground">{email}</span> has an IGE account, a
          reset link is on its way to the email address registered on it. The link expires in 60
          minutes.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              placeholder="you@company.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-transform disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
