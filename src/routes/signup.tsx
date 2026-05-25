import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Globe2, Handshake, Newspaper } from "lucide-react";
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
      <div className="grid gap-2.5">
        {ROLES.map((r) => {
          const selected = role === r.key;
          return (
            <button
              type="button"
              key={r.key}
              onClick={() => setRole(r.key)}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                selected
                  ? "border-primary bg-brand-soft"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  selected
                    ? "bg-brand-gradient text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <r.icon className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {r.title}
                </span>
                <span className="block text-xs text-muted-foreground">{r.desc}</span>
              </span>
              <span
                className={`h-4 w-4 rounded-full border ${
                  selected ? "border-primary bg-primary" : "border-border"
                }`}
              />
            </button>
          );
        })}
      </div>

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
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <input
        {...rest}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
