import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, GoogleButton, Divider } from "@/components/auth-shell";
import { isEmailNotConfirmedError } from "@/lib/auth-email";
import { recordAdminLogin } from "@/lib/admin-team.functions";
import { startGoogleSignIn } from "@/lib/google-auth";
import { markSignedIn, rememberedEmail, wasRemembered } from "@/lib/session-policy";

const search = z.object({
  redirect: z.string().optional(),
  email: z.string().max(200).optional(),
  password: z.string().optional(),
  unconfirmed: z.enum(["1"]).optional(),
  /** Set when the 24-hour session rule or a browser close ended the session. */
  expired: z.enum(["max_age", "browser_closed"]).optional(),
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
  const recordLogin = useServerFn(recordAdminLogin);
  const {
    redirect,
    email: emailParam,
    password: passwordParam,
    unconfirmed,
    expired,
  } = useSearch({ from: "/login" });
  // Remember me pre-fills the email next time (TAB 2 §2.4).
  const [email, setEmail] = useState(emailParam ?? rememberedEmail());
  const [password, setPassword] = useState(passwordParam ?? "");
  const [rememberMe, setRememberMe] = useState(() => wasRemembered());
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
        toast.error(
          "Confirm your email first — enter the verification code from your inbox on the signup page.",
        );
      } else {
        toast.error(error.message);
      }
      return;
    }
    markSignedIn({ rememberMe, email });
    toast.success("Welcome back");
    void recordLogin().catch(() => {});
    navigate({ to: redirect ?? "/dashboard" });
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    // Remember me carries through the redirect: /auth/callback reads it back
    // so a Google sign-in obeys the same browser-close rule as a password one.
    const message = await startGoogleSignIn({
      redirect: redirect ?? undefined,
      rememberMe,
    });
    if (message) {
      setGoogleLoading(false);
      toast.error(message);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your IGE workspace."
      footer={
        <>
          New to IGE?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:text-primary-deep">
            Create an account
          </Link>
        </>
      }
    >
      {expired && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
          {expired === "max_age"
            ? "Your session reached its 24-hour limit. Sign in again to carry on."
            : "You were signed out when the browser closed. Tick Remember me to stay signed in on this device."}
        </p>
      )}
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
        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-input accent-[hsl(var(--primary))]"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-primary hover:text-primary-deep"
          >
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <Divider />
      <GoogleButton onClick={() => void handleGoogle()} loading={googleLoading} />
      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
        For security, every session ends 24 hours after you sign in, whether or not Remember me is
        ticked.
      </p>
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
