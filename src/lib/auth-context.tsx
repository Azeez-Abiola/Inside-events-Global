import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DEV_AUTH_ENABLED, DEV_USER, getDevRoles, onDevRolesChange, setDevRoles } from "@/lib/dev-auth";

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
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  roles: [],
  loading: true,
  signOut: async () => {},
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
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

    // 2) Then existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .then(({ data: rolesData }) => {
            setRoles((rolesData ?? []).map((r) => r.role as Role));
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, queryClient, devActive]);

  const signOut = async () => {
    if (devActive) {
      setDevRoles(null);
      router.invalidate();
      return;
    }
    await supabase.auth.signOut();
  };

  const mockUser = devActive ? (DEV_USER as unknown as User) : null;

  return (
    <Ctx.Provider
      value={{
        session: devActive ? ({ user: mockUser } as unknown as Session) : session,
        user: devActive ? mockUser : session?.user ?? null,
        roles: devActive ? (devRoles as Role[]) : roles,
        loading: devActive ? false : loading,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
