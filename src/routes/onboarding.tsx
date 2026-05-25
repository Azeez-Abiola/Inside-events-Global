import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Megaphone, Globe2, Handshake, Newspaper, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome to IGE" }] }),
  component: Onboarding,
});

type RoleKey = "organiser" | "sponsor" | "referral_partner" | "media_partner";

const ROLES: { key: RoleKey; title: string; desc: string; icon: any }[] = [
  { key: "organiser", title: "Event Organiser", desc: "List your event, find sponsors.", icon: Megaphone },
  { key: "sponsor", title: "Brand / Sponsor", desc: "Discover vetted events to sponsor.", icon: Globe2 },
  { key: "referral_partner", title: "Referral Partner", desc: "Earn commission introducing sponsors.", icon: Handshake },
  { key: "media_partner", title: "Media Partner", desc: "Cross-promote with quality events.", icon: Newspaper },
];

const NEXT_FOR_ROLE: Record<RoleKey, string> = {
  organiser: "/dashboard",
  sponsor: "/dashboard",
  referral_partner: "/dashboard",
  media_partner: "/dashboard",
};

function Onboarding() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<RoleKey>("sponsor");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (roles.length > 0) {
      const r = roles[0] as RoleKey;
      navigate({ to: NEXT_FOR_ROLE[r] ?? "/dashboard" });
      return;
    }
    const pending = typeof window !== "undefined" ? sessionStorage.getItem("ige:pending-role") : null;
    if (pending && ROLES.some((r) => r.key === pending)) {
      setSelected(pending as RoleKey);
      (async () => {
        await applyRole(user.id, pending as RoleKey);
        try { sessionStorage.removeItem("ige:pending-role"); } catch {}
        navigate({ to: NEXT_FOR_ROLE[pending as RoleKey] ?? "/dashboard" });
      })();
      return;
    }
    setChecking(false);
  }, [loading, user, roles, navigate]);

  async function applyRole(userId: string, role: RoleKey) {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  }

  async function handleContinue() {
    if (!user) return;
    setSaving(true);
    try {
      await applyRole(user.id, selected);
      toast.success("You're all set");
      navigate({ to: NEXT_FOR_ROLE[selected] ?? "/dashboard" });
    } catch (e: any) {
      toast.error(e.message ?? "Could not save your role");
    } finally {
      setSaving(false);
    }
  }

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <AuthShell
      title="One more step"
      subtitle="Tell us how you'll use IGE so we can tailor your workspace."
      footer={
        <>
          Wrong account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-deep">
            Sign in as someone else
          </Link>
        </>
      }
    >
      <div className="grid gap-2.5">
        {ROLES.map((r) => {
          const isSel = selected === r.key;
          return (
            <button
              type="button"
              key={r.key}
              onClick={() => setSelected(r.key)}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                isSel ? "border-primary bg-brand-soft" : "border-border bg-card hover:bg-muted"
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${isSel ? "bg-brand-gradient text-white" : "bg-muted text-muted-foreground"}`}>
                <r.icon className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-foreground">{r.title}</span>
                <span className="block text-xs text-muted-foreground">{r.desc}</span>
              </span>
              <span className={`h-4 w-4 rounded-full border ${isSel ? "border-primary bg-primary" : "border-border"}`} />
            </button>
          );
        })}
      </div>

      <button
        onClick={handleContinue}
        disabled={saving}
        className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Continue"}
      </button>
    </AuthShell>
  );
}
