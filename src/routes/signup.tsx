import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Globe2, Handshake, Newspaper, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthShell, GoogleButton, Divider } from "@/components/auth-shell";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Create your IGE account" }],
  }),
  component: SignupPage,
});

type RoleKey = "organiser" | "sponsor" | "referral_partner" | "media_partner";

const ROLES: { key: RoleKey; title: string; desc: string; icon: any }[] = [
  {
    key: "organiser",
    title: "Event Organiser",
    desc: "List your event and find sponsors.",
    icon: Megaphone,
  },
  {
    key: "sponsor",
    title: "Brand / Sponsor",
    desc: "Discover vetted events to sponsor.",
    icon: Globe2,
  },
  {
    key: "referral_partner",
    title: "Referral Partner",
    desc: "Earn commission introducing sponsors.",
    icon: Handshake,
  },
  {
    key: "media_partner",
    title: "Media Partner",
    desc: "Cross-promote with quality events.",
    icon: Newspaper,
  },
];

function SignupPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<RoleKey>("sponsor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your password.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { role },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your inbox to confirm your email.");
    navigate({ to: "/login" });
  }

  async function handleGoogle() {
    // Stash chosen role so the onboarding step can persist it after the OAuth round-trip.
    try {
      sessionStorage.setItem("ige:pending-role", role);
    } catch {}
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/onboarding`,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/onboarding" });
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Pick how you'll use IGE. You can add more roles later."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-deep">
            Sign in
          </Link>
        </>
      }
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          I'm signing up as
        </span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as RoleKey)}
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
        >
          {ROLES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.title}
            </option>
          ))}
        </select>
        <span className="mt-1.5 block text-xs text-muted-foreground">
          {ROLES.find((r) => r.key === role)?.desc}
        </span>
      </label>

      <div className="mt-6">
        <GoogleButton onClick={handleGoogle} loading={googleLoading} label="Sign up with Google" />
      </div>
      <Divider />
      <form onSubmit={handlePassword} className="space-y-4">
        <Field
          label="Work email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
        />
        <Field
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
