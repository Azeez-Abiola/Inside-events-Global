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
import { claimPendingInvites } from "@/lib/workspace.functions";
import { startGoogleSignIn } from "@/lib/google-auth";
import { markSignedIn, rememberedEmail, wasRemembered } from "@/lib/session-policy";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/auth/turnstile";

type GuardResult = { allowed?: boolean; captchaRequired?: boolean; lockedUntil?: string };

/** Five failures in 15 minutes: short lock, then CAPTCHA (TAB 12 §12.4). */
async function signInGuard(body: { email: string; event: "check" | "failed" | "succeeded"; captchaToken?: string | null }, accessToken?: string): Promise<GuardResult> {
  try {
    const res = await fetch("/api/public/sign-in-guard", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ ...body, captchaToken: body.captchaToken ?? undefined }),
    });
    return (await res.json()) as GuardResult;
  } catch {
    return { allowed: true };
  }
}

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
  const claimInvites = useServerFn(claimPendingInvites);
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
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const demoPrefill = !!(emailParam && passwordParam);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (passwordParam) setPassword(passwordParam);
  }, [emailParam, passwordParam]);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const guard = await signInGuard({ email, event: "check", captchaToken });
    setCaptchaRequired(!!guard.captchaRequired);
    if (guard.allowed === false) {
      setSubmitting(false);
      if (guard.lockedUntil) {
        setLockedUntil(new Date(guard.lockedUntil));
        toast.error("Too many attempts. Wait a couple of minutes, or reset your password.");
      } else {
        toast.error(TURNSTILE_SITE_KEY ? "Complete the check below, then sign in." : "Too many attempts. Try again shortly.");
      }
      return;
    }
    setLockedUntil(null);
    const { data: signedIn, error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (captchaToken) {
      // A CAPTCHA token is single use.
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
    }
    if (error) {
      if (!isEmailNotConfirmedError(error.message)) void signInGuard({ email, event: "failed" });
      if (isEmailNotConfirmedError(error.message)) {
        toast.error(
          "Confirm your email first — enter the verification code from your inbox on the signup page.",
        );
      } else {
        toast.error(error.message);
      }
      return;
    }
    if (signedIn.session) void signInGuard({ email, event: "succeeded" }, signedIn.session.access_token);
    markSignedIn({ rememberMe, email });
    toast.success("Welcome back");
    void recordLogin().catch(() => {});
    // A seat invited before this account existed has no user_id to point at;
    // sign-in is the first moment it can be claimed (TAB 4 §4.3).
    void claimInvites().catch(() => {});
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
        {lockedUntil && lockedUntil > new Date() && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-foreground">
            Too many sign-in attempts. Try again after {lockedUntil.toLocaleTimeString()}, or{" "}
            <Link to="/forgot-password" className="font-semibold text-primary">reset your password</Link>.
          </p>
        )}
        {captchaRequired && TURNSTILE_SITE_KEY && <Turnstile key={captchaKey} onToken={setCaptchaToken} />}
        <button
          type="submit"
          disabled={submitting || (captchaRequired && !!TURNSTILE_SITE_KEY && !captchaToken)}
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
