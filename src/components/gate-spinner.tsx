import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { clearSessionMarkers } from "@/lib/session-policy";

/**
 * The full-screen spinner the dashboard gates show while they wait on the
 * session, roles or onboarding state. A gate that never resolves used to
 * leave people on a bare spinner with no way out; after a few seconds this
 * says so, logs what it was waiting on, and offers a reload or a clean
 * sign-in.
 */
export function GateSpinner({
  waitingOn,
  className = "bg-dashboard-canvas",
}: {
  /** Shown in the console when the wait runs long, to diagnose it. */
  waitingOn: Record<string, unknown>;
  className?: string;
}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSlow(true);
      console.warn("[IGE] Still waiting to load the dashboard:", waitingOn);
    }, 10_000);
    return () => window.clearTimeout(t);
    // Logged once with the state at the moment the wait ran long.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInAgain = async () => {
    clearSessionMarkers();
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    window.location.href = "/login";
  };

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center gap-4 px-4 ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {slow && (
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-foreground">This is taking longer than usual.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => window.location.reload()} className="btn-primary">
              Reload
            </button>
            <button
              type="button"
              onClick={() => void signInAgain()}
              className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Sign out and sign in again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
