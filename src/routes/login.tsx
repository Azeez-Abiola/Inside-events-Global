import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { isEmailNotConfirmedError } from "@/lib/auth-email";

const search = z.object({
  redirect: z.string().optional(),
  email: z.string().max(200).optional(),
  password: z.string().optional(),
  unconfirmed: z.enum(["1"]).optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: search,
  head: () => ({
    meta: [{ title: "Sign in - IGE" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect, email: emailParam, password: passwordParam, unconfirmed } = useSearch({ from: "/login" });
  const [email, setEmail] = useState(emailParam ?? "");
  const [password, setPassword] = useState(passwordParam ?? "");
  const [submitting, setSubmitting] = useState(false);
  const demoPrefill = !!(emailParam && passwordParam);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (passwordParam) setPassword(passwordParam);
  }, [emailParam, passwordParam]);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      if (isEmailNotConfirmedError(error.message)) {
        toast.error("Confirm your email first — enter the verification code from your inbox on the signup page.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Welcome back");
    navigate({ to: redirect ?? "/dashboard" });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your IGE workspace."
      footer={
        <>
          New to IGE?{" "}
          <Link
            to="/signup"
            className="font-semibold text-primary hover:text-primary-deep"
          >
            Create an account
          </Link>
        </>
      }
    >
      {unconfirmed === "1" && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
          Your email isn&apos;t confirmed yet. Enter the verification code from your email on the{" "}
          <Link to="/signup" search={{ step: "verify" }} className="font-semibold text-primary">
            signup page
          </Link>
          , then sign in here.
        </p>
      )}
      {demoPrefill && (
        <p className="rounded-lg border border-primary/20 bg-brand-soft px-3 py-2 text-xs text-primary-deep">
          Demo credentials filled in — click Sign in to open this workspace.
        </p>
      )}
      <form onSubmit={handlePassword} className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(v) => setEmail(v)}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(v) => setPassword(v)}
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="block">
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          {...rest}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background pl-3 pr-10 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
