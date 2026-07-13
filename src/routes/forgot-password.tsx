import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirectUrl } from "@/lib/site-url";
import { AuthShell } from "@/components/auth-shell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password - IGE" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${getAuthRedirectUrl()}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
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
          Check <span className="font-semibold text-foreground">{email}</span> for a reset link.
          It expires in 1 hour.
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
