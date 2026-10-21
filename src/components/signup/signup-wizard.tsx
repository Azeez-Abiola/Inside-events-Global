import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isEmailConfirmed } from "@/lib/auth-email";
import { clearStaleSession } from "@/lib/stale-session";
import { ensureSignupRole } from "@/lib/signup.functions";
import { saveOnboardingSection } from "@/lib/onboarding.functions";
import { AuthShell } from "@/components/auth-shell";
import { SignupProfileStep } from "@/components/signup/profile-step";
import { SignupOtpStep } from "@/components/signup/signup-otp-step";
import { RetainerRequest, RoleQuiz } from "@/components/signup/role-quiz";
import { useAuth } from "@/lib/auth-context";
import { markSignedIn, wasRemembered } from "@/lib/session-policy";
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
  stashReturnTo,
  takeReturnTo,
  readSignupExtraRoles,
  stashSignupExtraRoles,
} from "@/lib/signup-roles";

const STEPS: { key: SignupStep; label: string }[] = [
  { key: "role", label: "Role" },
  { key: "account", label: "Account" },
  { key: "verify", label: "Verify" },
  { key: "profile", label: "Profile" },
];

export function SignupWizard({
  initialStep,
  presetRole,
  returnTo,
}: {
  initialStep?: SignupStep;
  presetRole?: string;
  returnTo?: string;
}) {
  const navigate = useNavigate();
  const { user, roles, loading, refreshRoles } = useAuth();
  const ensureRole = useServerFn(ensureSignupRole);
  const saveOnboarding = useServerFn(saveOnboardingSection);
  const [step, setStep] = useState<SignupStep>(initialStep ?? "role");
  const [role, setRole] = useState<SignupRole>(
    presetRole && isSignupRole(presetRole) ? presetRole : "sponsor",
  );
  // Multi-role signup: `role` is the primary pick (the first dashboard they
  // land on); these are the other roles ticked alongside it.
  const [extraRoles, setExtraRoles] = useState<SignupRole[]>([]);
  // The pre-ticked default is only a placeholder: the first tap replaces it
  // rather than adding to it, so nobody becomes a Sponsor by accident.
  const [rolePicked, setRolePicked] = useState(Boolean(presetRole && isSignupRole(presetRole)));

  /** Tick or untick a role card. At least one role always stays picked. */
  function toggleRole(key: SignupRole) {
    if (!rolePicked) {
      setRolePicked(true);
      setRole(key);
      setExtraRoles([]);
      return;
    }
    if (key === role) {
      if (extraRoles.length) {
        setRole(extraRoles[0]);
        setExtraRoles(extraRoles.slice(1));
      }
      return;
    }
    setExtraRoles((xs) => (xs.includes(key) ? xs.filter((k) => k !== key) : [...xs, key]));
  }

  /** The quiz suggests a primary role; keep any other ticks. */
  function pickPrimary(key: SignupRole) {
    if (!rolePicked) {
      setRolePicked(true);
      setRole(key);
      setExtraRoles([]);
      return;
    }
    setExtraRoles((xs) => {
      const rest = xs.filter((k) => k !== key);
      return key !== role ? [role, ...rest].filter((k) => k !== key) : rest;
    });
    setRole(key);
  }

  // A marketplace button or share link sent them here with a role in mind and
  // a page to come back to. Remember both across the verify round-trip.
  useEffect(() => {
    if (presetRole && isSignupRole(presetRole)) stashSignupRole(presetRole);
    stashReturnTo(returnTo);
  }, [presetRole, returnTo]);
  /** Which user id the bootstrap below has already run for. */
  const bootstrappedFor = useRef<string | null>(null);
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
    const extras = (extraRoles.length ? extraRoles : readSignupExtraRoles()).filter(
      (r) => r !== selected,
    );
    await ensureRole({ data: { role: selected, extraRoles: extras, makeActive: true } });
    await refreshRoles();
  }

  async function startOnboarding(selected: SignupRole) {
    try {
      await assignRole(selected);
    } catch (e) {
      // Signed in as an account that has since been deleted. Clear the dead
      // session so the next attempt starts from a clean slate instead of
      // failing on the same foreign key forever.
      if (await clearStaleSession(e)) {
        bootstrappedFor.current = null;
        toast.error("That session had expired. Please sign up again.");
        navigate({ to: "/signup", search: {}, replace: true });
        return;
      }
      throw e;
    }
    await saveOnboarding({
      data: {
        role: selected,
        sectionKey: "__role",
        sectionData: { role: selected },
        currentSection: 0,
      },
    });
    clearSignupRole();
    // The role was picked on the first signup screen and is saved above. Land
    // on the dashboard: its setup panel collects the onboarding sections.
    navigate({ to: "/dashboard", replace: true });
  }

  useEffect(() => {
    if (loading) return;

    // startOnboarding assigns the role, refreshes auth state and navigates.
    // Refreshing auth state re-runs this effect, so without a latch the
    // bootstrap re-enters itself: the console fills with hundreds of paired
    // ensureSignupRole / saveOnboardingSection calls and the page never
    // leaves "Loading…". Latch per user so switching account still works.
    if (bootstrappedFor.current === (user?.id ?? "anon")) return;
    bootstrappedFor.current = user?.id ?? "anon";

    (async () => {
      if (!user) {
        const stored = readSignupRole();
        if (stored) {
          setRole(stored);
          setRolePicked(true);
        }
        setExtraRoles(readSignupExtraRoles().filter((r) => r !== stored));
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
        // Unguarded, a rejection here rejects the whole IIFE and `bootstrapping`
        // never clears — the page sits on "Loading…" for good. Treat a failed
        // check as "not complete" and let onboarding sort it out.
        const complete = await hasRoleProfile(user.id, primaryRole).catch(() => false);
        if (complete) {
          const back = takeReturnTo();
          if (back) navigate({ href: back, replace: true });
          else navigate({ to: "/dashboard", replace: true });
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
    })().catch(() => {
      // Never leave the wizard stuck behind its loader: show the form and let
      // the user carry on rather than stranding them on "Loading…".
      setBootstrapping(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, roles.join(",")]);

  async function handleRoleContinue() {
    stashSignupRole(role);
    stashSignupExtraRoles(extraRoles);
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
    navigate({ to: "/dashboard" });
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
          roles: [role, ...extraRoles],
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
      markSignedIn({ rememberMe: wasRemembered(), email });
      try {
        await startOnboarding(role);
        toast.success("Account created — now complete onboarding");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Could not save your role");
      }
      return;
    }
    // Supabase will not say "that email is taken" — it returns a fake success
    // with no session so the screen cannot be used to discover who is
    // registered. The giveaway is an empty `identities` array. Without this
    // check the person is sent to the OTP screen to wait for a code that was
    // never sent, which is exactly what it looks like when signup is broken.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      toast.error("That email already has an IGE account. Sign in instead.");
      navigate({ to: "/login", search: { email } });
      return;
    }

    toast.success("Check your inbox for your verification code.");
    goToStep("verify");
  }

  async function handleOtpVerified() {
    const { data: sessionData } = await supabase.auth.getSession();
    const verifiedUser = sessionData.session?.user ?? (await supabase.auth.getUser()).data.user;
    if (!verifiedUser) throw new Error("Session missing after verification");
    // A new session needs a fresh sign-in stamp. Without it, a stamp or
    // heartbeat left in this browser by an earlier session makes the session
    // guard judge this one expired and sign the person straight back out,
    // bouncing them from onboarding to a /signup stuck on "Loading…".
    markSignedIn({ rememberMe: wasRemembered(), email: verifiedUser.email ?? email });

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
          <p className="mb-3 text-xs text-muted-foreground">
            Pick every role that fits. You get a dashboard for each and can switch between them,
            or add more later.
          </p>
          <div className="grid gap-2.5">
            {SIGNUP_ROLES.map((r) => {
              const isPrimary = role === r.key;
              const isSel = isPrimary || extraRoles.includes(r.key);
              return (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => toggleRole(r.key)}
                  aria-pressed={isSel}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    isSel ? "border-primary bg-brand-soft" : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isSel ? "bg-brand-gradient text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <r.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {r.title}
                      {isPrimary && extraRoles.length > 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Opens first
                        </span>
                      )}
                    </span>
                    {/* The one-liner is always visible; TAB 2 §2.2's full
                        description is a tap away, so the grid stays scannable
                        instead of six paragraphs deep. */}
                    <span className="block text-xs text-muted-foreground">{r.tagline}</span>
                    {isPrimary && (
                      <span className="mt-2 block border-t border-primary/20 pt-2 text-xs leading-relaxed text-primary-deep">
                        {r.desc}
                      </span>
                    )}
                  </span>
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center self-start rounded border ${
                      isSel ? "border-primary bg-primary text-white" : "border-border"
                    }`}
                  >
                    {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
          <RoleQuiz onPick={pickPrimary} />
          <button
            type="button"
            onClick={handleRoleContinue}
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Continue
          </button>
          <RetainerRequest />
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
                Signing up as{" "}
                <span className="font-semibold text-foreground">{roleMeta.title}</span>
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
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Phone *
                  </label>
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
                  <span className="mb-1.5 block text-sm font-medium text-foreground">
                    Account type
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "individual" as const, label: "Individual" },
                      { id: "organisation" as const, label: "Organisation" },
                    ].map((opt) => (
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
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Password
                  </label>
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
        <SignupOtpStep email={email} onVerified={handleOtpVerified} onResend={handleResendOtp} />
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
