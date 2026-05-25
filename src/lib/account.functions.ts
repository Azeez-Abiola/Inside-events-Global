import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * NDPR / GDPR right-to-erasure.
 * Anonymises PII on the user's profile and revokes their auth account.
 * Deal and referral attribution records are retained for accounting (12-month minimum).
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const anonEmail = `deleted_${userId}@deleted.ige`;

    await supabaseAdmin
      .from("profiles")
      .update({
        email: anonEmail,
        email_domain: "deleted.ige",
        linkedin_url: null,
        linkedin_employer: null,
        is_active: false,
      } as never)
      .eq("id", userId);


    // Revoke auth account
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { success: true };
  });
