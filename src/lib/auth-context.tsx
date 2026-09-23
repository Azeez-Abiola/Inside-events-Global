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
  /**
   * True once `roles` reflects the signed-in user (or there is no user).
   * `loading` only covers the session — roles land a round-trip later, so gates
   * that branch on a role must wait for this or they'll treat an admin as an
   * unapproved applicant and blank the screen.
   */
  rolesReady: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  isPendingApproval: boolean;
  isDevImpersonating: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  roles: [],
  loading: true,
  rolesReady: false,
  isSuspended: false,
  suspensionReason: null,
  isPendingApproval: false,
  isDevImpersonating: false,
  signOut: async () => {},
  refreshRoles: async () => {},
});

/**
 * The role read decides every gate in the app, so a request that never comes
 * back leaves the whole UI parked on a loading spinner — indistinguishable from
 * a blank page. Bound each attempt and retry rather than waiting forever.
 */
const ROLE_FETCH_TIMEOUT_MS = 5000;
const ROLE_FETCH_ATTEMPTS = 3;

async function fetchRoles(uid: string): Promise<Role[]> {
  for (let attempt = 0; attempt < ROLE_FETCH_ATTEMPTS; attempt += 1) {
    const settled = await Promise.race([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ROLE_FETCH_TIMEOUT_MS)),
    ]);
    // `null` means the attempt timed out — the abandoned request may still land,
    // but a fresh one is cheaper than blocking the app on it.
    if (settled && !settled.error) return (settled.data ?? []).map((r) => r.role as Role);
  }
  return [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  // Which user id the current `roles` belong to — null until they've been fetched.
  const [rolesForUserId, setRolesForUserId] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
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

  async function applyProfileGateState(uid: string) {
    // Bounded for the same reason as fetchRoles — the bootstrap awaits this
    // before clearing `loading`, so a stalled read would freeze the app.
    const settled = await Promise.race([
      supabase
        .from("profiles")
        .select("is_suspended, suspension_reason, is_active")
        .eq("id", uid)
        .maybeSingle(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ROLE_FETCH_TIMEOUT_MS)),
    ]);
    const profile = settled?.data ?? null;
    const suspended = Boolean(profile?.is_suspended);
    setIsSuspended(suspended);
    setSuspensionReason(suspended ? profile?.suspension_reason ?? null : null);
    setIsPendingApproval(!suspended && profile?.is_active === false);
    return { suspended, pending: !suspended && profile?.is_active === false };
  }

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
        setRolesForUserId(null);
        setIsSuspended(false);
        setSuspensionReason(null);
        setIsPendingApproval(false);
        setLoading(false);
        return;
      } else {
        setSession(s);
      }
      if (s?.user) {
        // INITIAL_SESSION is already covered by the getSession() bootstrap below.
        // Running both fires the same two round-trips twice on every cold load —
        // `user_roles` alone measured 6s there, and every role gate is blocked on
        // it, so the app sits on a spinner long enough to read as a blank page.
        if (event === "INITIAL_SESSION") {
          router.invalidate();
          queryClient.invalidateQueries();
          return;
        }
        // fetch roles asynchronously (not inside listener body)
        setTimeout(() => {
          const uid = s.user.id;
          void applyProfileGateState(uid);
          void fetchRoles(uid).then((next) => {
            setRoles(next);
            // Mark ready even when every attempt failed — an empty role set is
            // an answer, and leaving this false would hang every gate forever.
            setRolesForUserId(uid);
          });
        }, 0);
      } else {
        setRoles([]);
        setRolesForUserId(null);
        setIsSuspended(false);
        setSuspensionReason(null);
        setIsPendingApproval(false);
      }
      router.invalidate();
      queryClient.invalidateQueries();
    });

    // 2) Then existing session — clear stale refresh tokens
    const resolved = supabase.auth.getSession().then(async ({ data, error }) => {
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
        const nextRoles = await fetchRoles(uid);
        await applyProfileGateState(uid);
        setRoles(nextRoles);
        setRolesForUserId(uid);
        setLoading(false);
      } else {
        setRolesForUserId(null);
        setIsSuspended(false);
        setSuspensionReason(null);
        setIsPendingApproval(false);
        setLoading(false);
      }
    });
    // A network failure while resolving the session must not strand the app on
    // the loading spinner — fall through and let the route guards decide.
    void resolved.catch(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, [router, queryClient, devActive]);

  const refreshRoles = async () => {
    if (devActive) return;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        setRoles([]);
        setRolesForUserId(null);
        return;
      }
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (!error) {
        setRoles((data ?? []).map((r) => r.role as Role));
        setRolesForUserId(uid);
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
        rolesReady: devActive ? true : !session?.user || rolesForUserId === session.user.id,
        isSuspended: devActive ? false : isSuspended,
        suspensionReason: devActive ? null : suspensionReason,
        isPendingApproval: devActive ? false : isPendingApproval,
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
