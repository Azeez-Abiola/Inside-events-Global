import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { heldSignupRoles, pickActiveRole } from "@/lib/active-role";
import { setMyActiveRole } from "@/lib/signup.functions";
import type { SignupRole } from "@/lib/signup-roles";

/** Per-browser copy, so the right dashboard shows before the profile read lands. */
const LOCAL_KEY = "ige:active-role";

function readLocal(): string | null {
  try {
    return localStorage.getItem(LOCAL_KEY);
  } catch {
    return null;
  }
}

function writeLocal(role: string) {
  try {
    localStorage.setItem(LOCAL_KEY, role);
  } catch {
    // Storage blocked: the profile copy still carries it.
  }
}

/**
 * The role whose dashboard a multi-role account is looking at, and a way to
 * switch it. Stored on the profile (`active_role`) so it follows the account
 * across devices; the DEV role switcher keeps it in this browser only.
 */
export function useActiveRole() {
  const { user, roles, isDevImpersonating } = useAuth();
  const qc = useQueryClient();
  const save = useServerFn(setMyActiveRole);
  const held = heldSignupRoles(roles);

  const { data: stored } = useQuery({
    queryKey: ["active-role", user?.id],
    queryFn: async () => {
      // `active_role` postdates the generated types.
      const { data } = await supabase
        .from("profiles")
        .select("active_role" as never)
        .eq("id", user!.id)
        .maybeSingle();
      const role = ((data as { active_role?: string | null } | null)?.active_role ?? null) as
        string | null;
      if (role) writeLocal(role);
      return role;
    },
    enabled: !!user && !isDevImpersonating,
    staleTime: Infinity,
    // Before the profile read lands, use this browser's copy.
    placeholderData: () => (typeof window === "undefined" ? null : readLocal()),
  });

  const activeRole = pickActiveRole(
    roles,
    stored ?? (typeof window === "undefined" ? null : readLocal()),
  );

  const setActiveRole = useCallback(
    async (role: SignupRole) => {
      writeLocal(role);
      qc.setQueryData(["active-role", user?.id], role);
      if (!isDevImpersonating) await save({ data: { role } });
      // Everything role-scoped (onboarding gate, setup panel, dashboards)
      // was read for the previous role.
      await qc.invalidateQueries();
    },
    [qc, save, user?.id, isDevImpersonating],
  );

  return { activeRole, heldRoles: held, setActiveRole };
}

/**
 * The roles a dashboard page should branch on: the active role, plus any
 * admin roles (admins keep their console whichever role is active). Use in
 * place of `useAuth().roles` wherever the page picks one role's view.
 */
export function useDashboardRoles(): string[] {
  const { roles } = useAuth();
  const { activeRole } = useActiveRole();
  const staff = roles.filter((r) => r === "abw_admin" || r === "super_admin");
  return activeRole ? [...staff, activeRole] : staff.length ? staff : roles;
}
