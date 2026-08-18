import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isEmailConfirmed } from "@/lib/auth-email";
import { ensureSignupRole } from "@/lib/signup.functions";
import { saveOnboardingSection } from "@/lib/onboarding.functions";
import { AuthShell } from "@/components/auth-shell";
import { SignupProfileStep } from "@/components/signup/profile-step";
import { SignupOtpStep } from "@/components/signup/signup-otp-step";
import { useAuth } from "@/lib/auth-context";
import {
  SIGNUP_ROLES,
  type SignupRole,
  type SignupStep,
  stashSignupRole,
  readSignupRole,
  clearSignupRole,
  hasRoleProfile,
  resolveSignupRole,
  getSignupRoleMeta,
  isSignupRole,
  stashSignupAccountDraft,
} from "@/lib/signup-roles";

const STEPS: { key: SignupStep; label: string }[] = [
  { key: "role", label: "Role" },
  { key: "account", label: "Account" },
  { key: "verify", label: "Verify" },
  { key: "profile", label: "Profile" },
];

export function SignupWizard({ initialStep }: { initialStep?: SignupStep }) {
  const navigate = useNavigate();
  const { user, roles, loading, refreshRoles } = useAuth();
  const ensureRole = useServerFn(ensureSignupRole);
  const saveOnboarding = useServerFn(saveOnboardingSection);
  const [step, setStep] = useState<SignupStep>(initialStep ?? "role");
  const [role, setRole] = useState<SignupRole>("sponsor");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [accountType, setAccountType] = useState<"individual" | "organisation">("individual");
  const [companyName, setCompanyName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const signupRole = resolveSignupRole(roles, role);
  const roleMeta = getSignupRoleMeta(signupRole);
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  function goToStep(next: SignupStep) {
    setStep(next);
    navigate({ to: "/signup", search: next === "role" ? {} : { step: next }, replace: true });
  }

  async function assignRole(selected: SignupRole) {
    await ensureRole({ data: { role: selected } });
    await refreshRoles();
  }

  async function startOnboarding(selected: SignupRole) {
    await assignRole(selected);
    await saveOnboarding({
      data: {
        role: selected,
        sectionKey: "__role",
        sectionData: { role: selected },
        currentSection: 0,
      },
    });
    clearSignupRole();
    navigate({ to: "/onboarding/role", replace: true });
  }

  useEffect(() => {
    if (loading) return;

    (async () => {
      if (!user) {
        const stored = readSignupRole();
        if (stored) setRole(stored);
        if (initialStep === "profile" || initialStep === "verify") goToStep("account");
        else if (initialStep && initialStep !== "role") setStep(initialStep);
        setBootstrapping(false);
        return;
      }

      if (!isEmailConfirmed(user)) {
        setEmail(user.email ?? "");
        goToStep("verify");
        setBootstrapping(false);
        return;
      }

      const storedRole = readSignupRole();
      const primaryRole = roles.find((r): r is SignupRole => isSignupRole(r));

      // Staff/admin accounts should not use the public signup flow.
      if (roles.some((r) => r === "abw_admin" || r === "super_admin") && !primaryRole) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      if (!primaryRole && storedRole) {
        try {
          await startOnboarding(storedRole);
          // Let SignupOtpStep show the success toast when coming from verify.
          if (step !== "verify") return;
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : "Could not save your role");
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
        try {
          await startOnboarding(primaryRole);
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : "Could not start onboarding");
          setBootstrapping(false);
        }
        return;
      }

      if (storedRole) setRole(storedRole);
      if (initialStep === "profile") goToStep("role");
      else if (initialStep && initialStep !== "role") setStep(initialStep);
      setBootstrapping(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, roles.join(",")]);

  async function handleRoleContinue() {
    stashSignupRole(role);
    if (user && isEmailConfirmed(user)) {
      try {
        await startOnboarding(role);
        toast.success("Role set — next, confirm it and complete onboarding");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Could not save your role");
      }
      return;
    }
    goToStep("account");
  }

  async function handleSignupComplete() {
    navigate({ to: "/onboarding/role" });
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Enter your full name.");
      return;
    }
    if (!phoneLocal.trim()) {
      toast.error("Enter your phone number.");
      return;
    }
    if (accountType === "organisation" && !companyName.trim()) {
      toast.error("Organisation / company name is required.");
      return;
    }
    if (!termsAccepted) {
      toast.error("Please agree to the Terms and Privacy Policy.");
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your password.");
      return;
    }
    const phone = `+234${phoneLocal.replace(/\D/g, "").replace(/^0+/, "")}`;
    stashSignupAccountDraft({
      fullName: fullName.trim(),
      phone,
      accountType,
      companyName: companyName.trim(),
    });
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName.trim(),
          phone,
          account_type: accountType,
          company_name: companyName.trim() || null,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session?.user && isEmailConfirmed(data.session.user)) {
      try {
        await startOnboarding(role);
        toast.success("Account created — now complete onboarding");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Could not save your role");
      }
      return;
    }
    toast.success("Check your inbox for your verification code.");
    goToStep("verify");
  }

  async function handleOtpVerified() {
    const { data: sessionData } = await supabase.auth.getSession();
    const verifiedUser = sessionData.session?.user ?? (await supabase.auth.getUser()).data.user;
    if (!verifiedUser) throw new Error("Session missing after verification");

    await startOnboarding(role);
    toast.success("Email verified — now complete onboarding");
  }

  async function handleResendOtp() {
    if (!email.trim()) {
      toast.error("Enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("We sent a new verification code.");
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
          {user && isEmailConfirmed(user) ? (
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
                {" — "}
                <button
                  type="button"
                  onClick={() => goToStep("role")}
                  className="font-semibold text-primary hover:text-primary-deep"
                >
                  Change
                </button>
              </p>
              <form onSubmit={handlePassword} className="space-y-4">
                <AccountField
                  label="Full name"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={setFullName}
                />
                <AccountField
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={setEmail}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Phone *</label>
                  <div className="flex gap-2">
                    <span className="inline-flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                      +234
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder="801 234 5678"
                      value={phoneLocal}
                      onChange={(e) => setPhoneLocal(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-foreground">Account type</span>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: "individual" as const, label: "Individual" },
                      { id: "organisation" as const, label: "Organisation" },
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAccountType(opt.id)}
                        className={`rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                          accountType === opt.id
                            ? "border-primary bg-brand-soft text-foreground"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {accountType === "organisation" && (
                  <AccountField
                    label="Organisation / company name"
                    type="text"
                    autoComplete="organization"
                    required
                    value={companyName}
                    onChange={setCompanyName}
                  />
                )}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5"
                    required
                  />
                  <span>
                    I agree to IGE's{" "}
                    <Link to="/terms" className="font-semibold text-primary hover:underline">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="font-semibold text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {submitting ? "Creating account…" : "Create account"}
                </button>
              </form>
            </>
          )}
        </>
      )}

      {step === "verify" && (
        <SignupOtpStep
          email={email}
          onVerified={handleOtpVerified}
          onResend={handleResendOtp}
        />
      )}

      {step === "profile" && user && isEmailConfirmed(user) && (
        <SignupProfileStep role={signupRole} onDone={() => void handleSignupComplete()} />
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
  if (step === "verify") {
    return {
      title: "Verify your email",
      subtitle: "Enter the verification code we sent to your inbox.",
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
