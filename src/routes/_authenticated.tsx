import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isEmailConfirmed } from "@/lib/auth-email";
import { useAuth } from "@/lib/auth-context";
import { SuspendedAccountGate } from "@/components/suspended-account-gate";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // DEV: skip the auth guard so the role switcher can reach protected routes.
    if (import.meta.env.DEV) return;

    // Session is in localStorage — skip guard during SSR or refresh redirects to login.
    if (import.meta.env.SSR) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    if (!isEmailConfirmed(user)) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href, unconfirmed: "1" },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (import.meta.env.DEV || loading) return;
    if (!user) {
      void navigate({ to: "/login", search: { redirect: window.location.pathname } });
    }
  }, [user, loading, navigate]);

  if (!import.meta.env.DEV && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dashboard-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!import.meta.env.DEV && !user) return null;

  return (
    <SuspendedAccountGate>
      <Outlet />
    </SuspendedAccountGate>
  );
}
