import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isEmailConfirmed } from "@/lib/auth-email";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // DEV: skip the auth guard so the role switcher can reach protected routes.
    if (import.meta.env.DEV) return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    if (!isEmailConfirmed(data.user)) {
      await supabase.auth.signOut({ scope: "local" });
      throw redirect({
        to: "/login",
        search: { redirect: location.href, unconfirmed: "1" },
      });
    }
  },
  component: () => <Outlet />,
});
