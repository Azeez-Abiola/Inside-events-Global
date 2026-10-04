/**
 * Onboarding wizard route — loads save & resume state from the server,
 * then renders the OnboardingWizard shell with the correct role schema.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { CreativeTypePicker } from "@/components/onboarding/sections/creative-hub-sections";
import { saveOnboardingSection } from "@/lib/onboarding.functions";
import { getSectionsForRole, type OnboardingRole } from "@/lib/onboarding-constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function odb(): any {
  return supabaseAdmin as any;
}

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
    const app = data
      ? {
          role: (data as { role: string }).role,
          current_section: (data as { current_section: number }).current_section,
          status: (data as { status: string }).status,
          reviewer_notes: (data as { reviewer_notes: Record<string, string> }).reviewer_notes ?? {},
          sections: (data as { sections: Record<string, Record<string, string>> }).sections ?? {},
        }
      : null;
    return { app };
  });

export const Route = createFileRoute("/onboarding/wizard")({
  // `?section=h` opens that section directly, which is how the profile
  // completion bar and every feature lock link back in (§3.2A).
  validateSearch: z.object({ section: z.string().max(4).optional() }),
  head: () => ({ meta: [{ title: "Onboarding — IGE" }] }),
  loader: async () => {
    try {
      const result = (await loadWizardState({ data: undefined as never })) as {
        app: {
          role: string;
          sections: Record<string, unknown>;
          current_section: number;
          status: string;
          reviewer_notes: Record<string, string>;
        } | null;
      };
      if (result.app?.status === "submitted" || result.app?.status === "under_review") {
        throw redirect({ to: "/onboarding/pending" });
      }
      // A finished account is deliberately NOT bounced out: the completion bar
      // and the feature locks both deep-link back here to finish a deferred
      // section (§3.2A, "can be completed at any time from the dashboard").
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
  const { app } = (Route as any).useLoaderData() as {
    app: {
      role: string;
      sections: Record<string, unknown>;
      current_section: number;
      reviewer_notes: Record<string, string>;
    } | null;
  };
  const { section } = Route.useSearch();

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

  // Creative Hub picks its creative type before the wizard starts (TAB 3 §3.1).
  if (app.role === "creative_hub" && !(app.sections as Record<string, unknown>).ctype) {
    return <CreativeTypeStep />;
  }

  // An explicit ?section= wins over the saved resume point. An unknown key
  // falls back to resume rather than dropping someone on section A.
  const requestedIdx = section
    ? getSectionsForRole(app.role as OnboardingRole).findIndex((s) => s.key === section)
    : -1;

  return (
    <OnboardingWizard
      role={app.role as OnboardingRole}
      savedSections={(app.sections as Record<string, never>) ?? {}}
      resumeAt={requestedIdx >= 0 ? requestedIdx : (app.current_section ?? 0)}
      reviewerNotes={(app.reviewer_notes as Record<string, string>) ?? {}}
    />
  );
}

function CreativeTypeStep() {
  const router = useRouter();
  const save = useServerFn(saveOnboardingSection);
  const [saving, setSaving] = useState(false);

  return (
    <CreativeTypePicker
      saving={saving}
      onPick={(creativeType) => {
        setSaving(true);
        void save({
          data: {
            role: "creative_hub",
            sectionKey: "ctype",
            sectionData: { creative_type: creativeType },
            currentSection: 0,
          },
        })
          .then(() => router.invalidate())
          .finally(() => setSaving(false));
      }}
    />
  );
}
