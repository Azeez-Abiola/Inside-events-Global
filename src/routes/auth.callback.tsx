import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { ensureSignupRole } from "@/lib/signup.functions";
import { recordAdminLogin } from "@/lib/admin-team.functions";
import { markSignedIn } from "@/lib/session-policy";
import { isSignupRole, stashSignupRole } from "@/lib/signup-roles";

/**
 * Where Google sends people back to (TAB 2 §2.1, §2.3).
 *
 * Supabase exchanges the code for a session on its own as the client boots, so
 * this screen's job is the part Supabase cannot know about: attach the role
 * the person picked before they left, apply the Remember me choice that was
 * lost across the redirect, and route them on to onboarding or their dashboard.
 */

const search = z.object({
  role: z.string().max(40).optional(),
  redirect: z.string().max(500).optional(),
  remember: z.enum(["1"]).optional(),
  error: z.string().max(200).optional(),
  error_description: z.string().max(500).optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Signing you in - IGE" }] }),
  component: AuthCallbackPage,
});

/** How long to wait for Supabase to finish the code exchange before giving up. */
const SESSION_WAIT_MS = 15000;
const POLL_MS = 150;

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { role, redirect, remember, error, error_description } = useSearch({
    from: "/auth/callback",
  });
  const ensureRole = useServerFn(ensureSignupRole);
  const recordLogin = useServerFn(recordAdminLogin);
  const [failure, setFailure] = useState<string | null>(
    error ? (error_description ?? "Google sign-in was cancelled or failed.") : null,
  );
  // StrictMode double-invokes effects in dev; the role write is idempotent but
  // the navigation is not, so guard the whole run.
  const ran = useRef(false);

  useEffect(() => {
    if (failure || ran.current) return;
    ran.current = true;

    let cancelled = false;

    void (async () => {
      const deadline = Date.now() + SESSION_WAIT_MS;
      let userId: string | null = null;
      let email: string | undefined;

      // Poll rather than rely on onAuthStateChange: the exchange may already
      // have completed before this component mounted, in which case no further
      // event fires and a listener would wait forever.
      while (!cancelled && Date.now() < deadline) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          userId = data.session.user.id;
          email = data.session.user.email ?? undefined;
          break;
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }

      if (cancelled) return;

      if (!userId) {
        setFailure(
          "We couldn't complete the Google sign-in. Try again, or use your email and password.",
        );
        return;
      }

      markSignedIn({ rememberMe: remember === "1", email });

      // A role only comes through on sign-up. Signing in with Google to an
      // existing account must never reassign the role the person already has —
      // ensureSignupRole is a no-op when one is set, so this is safe either way.
      let landedRole: string | null = null;
      if (isSignupRole(role)) {
        try {
          const res = await ensureRole({ data: { role } });
          landedRole = res?.role ?? role;
          stashSignupRole(role);
        } catch {
          // Role assignment failing is recoverable — the onboarding role
          // screen asks again rather than stranding them here.
          landedRole = null;
        }
      }

      void recordLogin().catch(() => {});

      if (cancelled) return;
      if (redirect) navigate({ to: redirect, replace: true });
      else if (landedRole) navigate({ to: "/onboarding/role", replace: true });
      else navigate({ to: "/dashboard", replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [failure, role, redirect, remember, ensureRole, recordLogin, navigate]);

  if (failure) {
    return (
      <AuthShell title="Sign-in didn't complete" subtitle={failure}>
        <button
          type="button"
          onClick={() => navigate({ to: "/login", replace: true })}
          className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
        >
          Back to sign in
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Signing you in"
      subtitle="One moment while we finish setting up your session."
    >
      <div className="flex justify-center py-6" role="status" aria-live="polite">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="sr-only">Signing you in</span>
      </div>
    </AuthShell>
  );
}
