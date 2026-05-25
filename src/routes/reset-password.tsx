import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth-shell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — IGE" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase recovery flow: arrives with type=recovery in hash and sets a session.
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token=")) {
      setReady(true);
    } else {
      // Already-authenticated direct visit also OK
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
        else {
          toast.error("Open this page from the reset link in your email.");
          navigate({ to: "/forgot-password" });
        }
      });
    }
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (pwd !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    navigate({ to: "/dashboard" });
  }

  if (!ready) return null;

  return (
    <AuthShell title="Set a new password" subtitle="Pick something you'll remember.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="New password" value={pwd} onChange={setPwd} />
        <Field label="Confirm password" value={confirm} onChange={setConfirm} />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-transform disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      <input
        type="password"
        required
        minLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}
