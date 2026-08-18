/**
 * Onboarding wizard route — loads save & resume state from the server,
 * then renders the OnboardingWizard shell with the correct role schema.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import type { OnboardingRole } from "@/lib/onboarding-constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function odb(): any { return supabaseAdmin as any; }

const loadWizardState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const userId = (context as any).userId as string;
    const { data } = await odb()
      .from("onboarding_applications")
      .select("role, sections, current_section, status, reviewer_notes")
      .eq("user_id", userId)
      .maybeSingle();
    // Cast to a JSON-serializable type so ServerFn is happy
    const app = data ? {
      role:            (data as {role:string}).role,
      current_section: (data as {current_section:number}).current_section,
      status:          (data as {status:string}).status,
      reviewer_notes:  (data as {reviewer_notes:Record<string,string>}).reviewer_notes ?? {},
      sections:        (data as {sections:Record<string,Record<string,string>>}).sections ?? {},
    } : null;
    return { app };
  });

export const Route = createFileRoute("/onboarding/wizard")({
  head: () => ({ meta: [{ title: "Onboarding — IGE" }] }),
  loader: async () => {
    try {
      const result = await loadWizardState({ data: undefined as never }) as { app: {
        role: string; sections: Record<string, unknown>; current_section: number;
        status: string; reviewer_notes: Record<string, string>;
      } | null };
      if (result.app?.status === "submitted" || result.app?.status === "under_review") {
        throw redirect({ to: "/onboarding/pending" });
      }
      if (result.app?.status === "approved") {
        throw redirect({ to: "/dashboard" });
      }
      if (!result.app) {
        throw redirect({ to: "/onboarding/role" });
      }
      return { app: result.app };
    } catch (e) {
      if (e instanceof Response || (e && typeof e === "object" && "status" in e)) throw e;
      throw redirect({ to: "/signup" });
    }
  },
  component: WizardPage,
});

function WizardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { app } = (Route as any).useLoaderData() as { app: { role: string; sections: Record<string, unknown>; current_section: number; reviewer_notes: Record<string, string> } | null };

  if (!app) {
    // No application yet — redirect to role selection
    return (
      <div className="flex min-h-screen items-center justify-center">
        <a href="/onboarding/role" className="text-primary underline text-sm">
          Start by choosing your role →
        </a>
      </div>
    );
  }

  return (
    <OnboardingWizard
      role={app.role as OnboardingRole}
      savedSections={(app.sections as Record<string, never>) ?? {}}
      resumeAt={app.current_section ?? 0}
      reviewerNotes={(app.reviewer_notes as Record<string, string>) ?? {}}
    />
  );
}
