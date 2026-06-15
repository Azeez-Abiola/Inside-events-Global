import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DEV_AUTH_ENABLED, getDevRoles } from "@/lib/dev-auth";

// Gate the entire site behind /waitlist until launch.
// Signed-in users (admins / team) bypass so they can still manage the platform.
const LAUNCH = new Date("2026-07-01T00:00:00Z").getTime();
const ALLOWED_PREFIXES = [
  "/welcome",
  "/waitlist",
  "/contact",
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
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      // Test phase: site is publicly open (marketplace is the landing page).
      // Re-enable the waitlist gate before a gated launch by removing this block.
      if (!cancelled) { setAllowed(true); setChecked(true); }
      return;

      // DEV impersonation bypasses the gate.
      if (DEV_AUTH_ENABLED && getDevRoles()) {
        if (!cancelled) { setAllowed(true); setChecked(true); }
        return;
      }
      if (Date.now() >= LAUNCH) {
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
        navigate({ to: "/welcome", replace: true });
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
