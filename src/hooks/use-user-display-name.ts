import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { greetingName } from "@/lib/dashboard-meta";

/** Prefer profile / role name over email for headers and greetings. */
export function useUserDisplayName() {
  const { user, roles } = useAuth();

  return useQuery({
    queryKey: ["user-display-name", user?.id, roles.join(",")],
    queryFn: async () => {
      if (!user) return "there";

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.display_name?.trim()) return profile.display_name.trim();

      if (roles.includes("organiser")) {
        const { data } = await supabase
          .from("organiser_profiles")
          .select("org_name")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.org_name?.trim()) return data.org_name.trim();
      }
      if (roles.includes("sponsor")) {
        const { data } = await supabase
          .from("sponsor_profiles")
          .select("brand_name")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.brand_name?.trim()) return data.brand_name.trim();
      }
      if (roles.includes("referral_partner")) {
        const { data } = await supabase
          .from("referral_partner_profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.full_name?.trim()) return data.full_name.trim();
      }

      return greetingName(user.email, user.user_metadata);
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
