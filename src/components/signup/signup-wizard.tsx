import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSiteUrl } from "@/lib/site-url";
import { AuthShell } from "@/components/auth-shell";
import { SignupProfileStep } from "@/components/signup/profile-step";
import { useAuth } from "@/lib/auth-context";
import {
  SIGNUP_ROLES,
  type SignupRole,
  type SignupStep,
  stashSignupRole,
  readSignupRole,
  clearSignupRole,
  applySignupRole,
  hasRoleProfile,
} from "@/lib/signup-roles";

const STEPS: { key: SignupStep; label: string }[] = [
  { key: "role", label: "Role" },
  { key: "account", label: "Account" },
  { key: "profile", label: "Profile" },
];

export function SignupWizard({ initialStep }: { initialStep?: SignupStep }) {
  const navigate = useNavigate();
  const { user, roles, loading, refreshRoles } = useAuth();
  const [step, setStep] = useState<SignupStep>(initialStep ?? "role");
  const [role, setRole] = useState<SignupRole>("sponsor");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailConfirmPending, setEmailConfirmPending] = useState(false);

  const signupRole = (roles[0] as SignupRole | undefined) ?? role;
  const roleMeta = SIGNUP_ROLES.find((r) => r.key === signupRole)!;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  function goToStep(next: SignupStep) {
    setStep(next);
    navigate({ to: "/signup", search: next === "role" ? {} : { step: next }, replace: true });
  }

  useEffect(() => {
    if (loading) return;

    (async () => {
      if (!user) {
        const stored = readSignupRole();
        if (stored) setRole(stored);
        if (initialStep === "profile") goToStep("account");
        else if (initialStep && initialStep !== "role") setStep(initialStep);
        setBootstrapping(false);
        return;
      }

      const storedRole = readSignupRole();
      const primaryRole = roles[0] as SignupRole | undefined;

      if (!primaryRole && storedRole) {
        try {
          await applySignupRole(user.id, storedRole);
          await refreshRoles();
          clearSignupRole();
          setRole(storedRole);
          goToStep("profile");
        } catch (e: any) {
          toast.error(e.message ?? "Could not save your role");
        }
        setBootstrapping(false);
        return;
      }

      if (primaryRole) {
        setRole(primaryRole);
        const complete = await hasRoleProfile(user.id, primaryRole);
        if (complete) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        goToStep("profile");
        setBootstrapping(false);
        return;
      }

      if (storedRole) setRole(storedRole);
      if (initialStep === "profile") goToStep(user ? "role" : "account");
      else if (initialStep && initialStep !== "role") setStep(initialStep);
      setBootstrapping(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, roles.join(",")]);

  async function handleRoleContinue() {
    stashSignupRole(role);
    if (user) {
      try {
        await applySignupRole(user.id, role);
        await refreshRoles();
        clearSignupRole();
        toast.success("Role set — let's complete your profile");
        goToStep("profile");
      } catch (e: any) {
        toast.error(e.message ?? "Could not save your role");
      }
      return;
    }
    goToStep("account");
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your password.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/signup?step=profile`,
        data: { role },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session?.user) {
      try {
        await applySignupRole(data.session.user.id, role);
        await refreshRoles();
        clearSignupRole();
        toast.success("Account created — one more step");
        goToStep("profile");
      } catch (err: any) {
        toast.error(err.message ?? "Could not save your role");
      }
      return;
    }
    setEmailConfirmPending(true);
    toast.success("Check your inbox to confirm your email, then sign in to finish your profile.");
  }

  if (loading || bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  const { title, subtitle } = stepCopy(step, roleMeta.title);

  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      footer={
        step === "profile" && user ? (
          <>
            Wrong account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-deep">
              Sign in as someone else
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-deep">
              Sign in
            </Link>
          </>
        )
      }
    >
      <StepIndicator current={stepIndex} />

      {step === "role" && (
        <>
          <div className="grid gap-2.5">
            {SIGNUP_ROLES.map((r) => {
              const isSel = role === r.key;
              return (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    isSel ? "border-primary bg-brand-soft" : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isSel ? "bg-brand-gradient text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <r.icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">{r.title}</span>
                    <span className="block text-xs text-muted-foreground">{r.desc}</span>
                  </span>
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      isSel ? "border-primary bg-primary" : "border-border"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleRoleContinue}
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Continue
          </button>
        </>
      )}

      {step === "account" && (
        <>
          {user ? (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">You're already signed in as {user.email}.</p>
              <button type="button" onClick={() => goToStep("role")} className="btn-primary w-full">
                Continue setup
              </button>
            </div>
          ) : (
            <>
          <p className="mb-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Signing up as <span className="font-semibold text-foreground">{roleMeta.title}</span>
            {!user && (
              <>
                {" "}
                —{" "}
                <button
                  type="button"
                  onClick={() => goToStep("role")}
                  className="font-semibold text-primary hover:text-primary-deep"
                >
                  Change
                </button>
              </>
            )}
          </p>

          {emailConfirmPending ? (
            <div className="space-y-4 rounded-xl border border-border bg-card p-4 text-sm">
              <p className="text-foreground">We sent a confirmation link to <strong>{email}</strong>.</p>
              <p className="text-muted-foreground">
                After confirming, sign in and we'll take you straight to your profile step.
              </p>
              <Link to="/login" className="btn-primary inline-flex w-full justify-center">
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePassword} className="space-y-4">
              <AccountField
                label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={setEmail}
                />
                <AccountField
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={setPassword}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {submitting ? "Creating account…" : "Create account"}
                </button>
                <p className="text-xs text-muted-foreground">
                  By continuing you agree to IGE's Terms and Privacy Policy.
                </p>
              </form>
          )}
            </>
          )}
        </>
      )}

      {step === "profile" && user && (
        <SignupProfileStep role={signupRole} onDone={() => navigate({ to: "/dashboard" })} />
      )}
    </AuthShell>
  );
}

function stepCopy(step: SignupStep, roleTitle: string) {
  if (step === "role") {
    return {
      title: "How will you use IGE?",
      subtitle: "We'll tailor your workspace from the start.",
    };
  }
  if (step === "account") {
    return {
      title: "Create your account",
      subtitle: `Set up access for your ${roleTitle} workspace.`,
    };
  }
  return {
    title: "Complete your profile",
    subtitle: "A few details so we can match you with the right opportunities.",
  };
}

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Signup progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.key} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-brand-gradient text-white"
                    : done
                      ? "bg-primary/15 text-primary-deep"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span className={`mx-1 h-px flex-1 ${done ? "bg-primary/40" : "bg-border"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function AccountField({
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
