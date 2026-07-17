import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DEV_AUTH_ENABLED, DEV_USER, getDevRoles, onDevRolesChange, setDevRoles } from "@/lib/dev-auth";
import { isEmailConfirmed } from "@/lib/auth-email";

type Role =
  | "organiser"
  | "sponsor"
  | "referral_partner"
  | "media_partner"
  | "abw_admin"
  | "super_admin";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  roles: Role[];
  loading: boolean;
  isDevImpersonating: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  roles: [],
  loading: true,
  isDevImpersonating: false,
  signOut: async () => {},
  refreshRoles: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  // DEV-only: impersonated roles from the floating role switcher.
  const [devRoles, setDevRolesState] = useState<Role[] | null>(null);
  useEffect(() => {
    if (!DEV_AUTH_ENABLED) return;
    const sync = () => setDevRolesState(getDevRoles() as Role[] | null);
    sync();
    return onDevRolesChange(sync);
  }, []);
  const devActive = DEV_AUTH_ENABLED && devRoles != null;

  useEffect(() => {
    // In dev impersonation mode, bypass Supabase entirely.
    if (devActive) {
      setLoading(false);
      return;
    }
    // 1) Listener FIRST (don't await inside)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setSession(s);
      } else if (event === "SIGNED_OUT" || !s) {
        setSession(null);
        setRoles([]);
        setLoading(false);
        return;
      } else {
        setSession(s);
      }
      if (s?.user) {
        // fetch roles asynchronously (not inside listener body)
        setTimeout(() => {
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", s.user.id)
            .then(({ data }) => {
              setRoles((data ?? []).map((r) => r.role as Role));
            });
        }, 0);
      } else {
        setRoles([]);
      }
      router.invalidate();
      queryClient.invalidateQueries();
    });

    // 2) Then existing session — clear stale refresh tokens
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error?.message?.toLowerCase().includes("refresh")) {
        await supabase.auth.signOut({ scope: "local" });
        setSession(null);
        setRoles([]);
        setLoading(false);
        return;
      }
      if (data.session) {
        const { error: userError, data: userData } = await supabase.auth.getUser();
        if (userError?.message?.toLowerCase().includes("refresh") || userError?.status === 401) {
          await supabase.auth.signOut({ scope: "local" });
          setSession(null);
          setRoles([]);
          setLoading(false);
          return;
        }
        if (userData.user && !isEmailConfirmed(userData.user)) {
          setSession(null);
          setRoles([]);
          setLoading(false);
          return;
        }
      }
      setSession(data.session);
      if (data.session?.user) {
        const uid = data.session.user.id;
        const [{ data: rolesData }, { data: profile }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", uid),
          supabase.from("profiles").select("is_suspended").eq("id", uid).maybeSingle(),
        ]);
        if (profile?.is_suspended) {
          await supabase.auth.signOut({ scope: "local" });
          setSession(null);
          setRoles([]);
          setLoading(false);
          return;
        }
        setRoles((rolesData ?? []).map((r) => r.role as Role));
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, queryClient, devActive]);

  const refreshRoles = async () => {
    if (devActive) return;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        setRoles([]);
        return;
      }
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (!error) {
        setRoles((data ?? []).map((r) => r.role as Role));
        return;
      }
      const retryable =
        (error as { status?: number }).status === 403 ||
        error.code === "42501" ||
        error.message.toLowerCase().includes("row-level");
      if (!retryable || attempt === 5) return;
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  };

  const signOut = async () => {
    if (devActive) {
      setDevRoles(null);
      router.invalidate();
      await router.navigate({ to: "/login" });
      return;
    }
    await supabase.auth.signOut();
    await router.navigate({ to: "/login" });
  };

  const mockUser = devActive ? (DEV_USER as unknown as User) : null;

  return (
    <Ctx.Provider
      value={{
        session: devActive ? ({ user: mockUser } as unknown as Session) : session,
        user: devActive ? mockUser : session?.user ?? null,
        roles: devActive ? (devRoles as Role[]) : roles,
        loading: devActive ? false : loading,
        isDevImpersonating: devActive,
        signOut,
        refreshRoles,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
