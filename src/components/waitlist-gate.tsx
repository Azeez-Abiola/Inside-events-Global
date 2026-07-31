import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DEV_AUTH_ENABLED, getDevRoles } from "@/lib/dev-auth";

// Legacy pre-launch gate. Signup is open — leave disabled.
const SITE_GATE_DISABLED = true;

const ALLOWED_PREFIXES = [
  "/welcome",
  "/waitlist",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/api/",
  "/r/",
];

export function WaitlistGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  // SSR-safe: server and client must start with the same initial state.
  const [checked, setChecked] = useState(SITE_GATE_DISABLED);
  const [allowed, setAllowed] = useState(SITE_GATE_DISABLED);

  useEffect(() => {
    if (SITE_GATE_DISABLED) return;

    let cancelled = false;
    async function run() {
      // DEV impersonation bypasses the gate.
      if (DEV_AUTH_ENABLED && getDevRoles()) {
        if (!cancelled) { setAllowed(true); setChecked(true); }
        return;
      }
      const path = location.pathname;
      if (ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p))) {
        if (!cancelled) { setAllowed(true); setChecked(true); }
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        if (!cancelled) { setAllowed(true); setChecked(true); }
        return;
      }
      if (!cancelled) {
        setAllowed(false);
        setChecked(true);
        navigate({ to: "/", replace: true });
      }
    }
    run();
    return () => { cancelled = true; };
  }, [location.pathname, navigate]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!allowed) return null;
  return <>{children}</>;
}
