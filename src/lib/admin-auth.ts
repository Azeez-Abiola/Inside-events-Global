import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hasAdminPermission, isSuperAdmin, type AdminPermission } from "@/lib/admin-permissions";

export async function getUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.role);
}

export async function requirePlatformAdmin(userId: string) {
  const roles = await getUserRoles(userId);
  if (!roles.includes("abw_admin") && !roles.includes("super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
  return roles;
}

export async function requireSuperAdmin(userId: string) {
  const roles = await requirePlatformAdmin(userId);
  if (!isSuperAdmin(roles)) {
    throw new Error("Forbidden: super admin access required");
  }
  return roles;
}

export async function requireAdminPermission(userId: string, permission: AdminPermission) {
  const roles = await requirePlatformAdmin(userId);
  if (!hasAdminPermission(roles, permission)) {
    throw new Error("Forbidden: you do not have permission for this action");
  }
  return roles;
}

export async function getActorProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("id", userId)
    .maybeSingle();
  return data;
}
