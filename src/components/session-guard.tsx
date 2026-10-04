import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  HEARTBEAT_INTERVAL_MS,
  beat,
  clearSessionMarkers,
  evaluateSession,
} from "@/lib/session-policy";

/**
 * Enforces the 24-hour session ceiling and the browser-close rule
 * (TAB 2 §2.4). Renders nothing; mount it once, inside the auth provider.
 *
 * The warning fires five minutes out, as the spec asks. Draft-keeping for
 * unsaved form input is handled by the forms themselves, which already
 * autosave — this only has to get the person back to the sign-in screen with
 * an explanation rather than dropping them on a dead dashboard.
 */
export function SessionGuard() {
  const navigate = useNavigate();
  const { user, isDevImpersonating } = useAuth();
  const warned = useRef(false);
  const expiring = useRef(false);

  useEffect(() => {
    // Dev impersonation has no real session to expire.
    if (!user || isDevImpersonating) {
      warned.current = false;
      return;
    }

    let cancelled = false;

    async function check() {
      const verdict = evaluateSession();

      if (verdict.state === "expired") {
        if (expiring.current) return;
        expiring.current = true;
        clearSessionMarkers();
        // Local scope only: we are ending this browser's session, not
        // revoking the person's other devices.
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        if (cancelled) return;
        await navigate({
          to: "/login",
          search: { expired: verdict.reason },
          replace: true,
        });
        return;
      }

      if (verdict.state === "expiring" && !warned.current) {
        warned.current = true;
        const minutes = Math.max(1, Math.round((verdict.expiresAt - Date.now()) / 60000));
        toast.warning(
          `Your session ends in about ${minutes} minute${minutes === 1 ? "" : "s"}. Save anything in progress and sign in again.`,
          { duration: 15000 },
        );
      }

      if (verdict.state === "ok") warned.current = false;

      beat();
    }

    void check();
    const id = window.setInterval(() => void check(), HEARTBEAT_INTERVAL_MS);

    // A tab that wakes from background may have missed several intervals.
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, isDevImpersonating, navigate]);

  return null;
}
