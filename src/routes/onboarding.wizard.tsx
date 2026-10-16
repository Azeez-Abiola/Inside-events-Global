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
import { isSignupRole } from "@/lib/signup-roles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function odb(): any {
  return supabaseAdmin as any;
}

const loadWizardState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const userId = (context as any).userId as string;
    let { data } = await odb()
      .from("onboarding_applications")
      .select("role, sections, current_section, status, reviewer_notes")
      .eq("user_id", userId)
      .maybeSingle();
    // A role chosen at signup but no application yet (Google sign-up, or a
    // save that never landed): start the application for that role instead of
    // asking for the role again. Only ever creates — an existing application,
    // and the progress in it, is never touched here.
    if (!data) {
      const { data: roleRows } = await odb().from("user_roles").select("role").eq("user_id", userId);
      const role = ((roleRows ?? []) as { role: string }[]).map((r) => r.role).find((r) => isSignupRole(r));
      if (role) {
        const { data: created } = await odb()
          .from("onboarding_applications")
          .insert({
            user_id: userId,
            role,
            sections: { __role: { role } },
            section_status: {},
            current_section: 0,
            status: "draft",
          })
          .select("role, sections, current_section, status, reviewer_notes")
          .maybeSingle();
        data = created;
      }
    }
    // Cast to a JSON-serializable type so ServerFn is happy
    const app = data
      ? {
          role: (data as { role: string }).role,
          current_section: (data as { current_section: number }).current_section,
          status: (data as { status: string }).status,
          reviewer_notes: (data as { reviewer_notes: Record<string, string> }).reviewer_notes ?? {},
          sections: await withSignupDefaults(
            userId,
            (data as { role: string }).role,
            (data as { sections: Record<string, Record<string, string>> }).sections ?? {},
          ),
        }
      : null;
    return { app };
  });

/** Where each role's Section A keeps the organisation name from signup. */
const ORG_FIELD: Record<string, string> = {
  organiser: "org_name",
  sponsor: "brand_name",
  media_partner: "outlet_name",
  referral_partner: "company_name",
  partnerships_pro: "company_name",
};

/**
 * Section A asks for the name, email, phone and organisation the signup form
 * already collected. Pre-fill them from the account (signUp stores them in the
 * user metadata) so nobody types them twice. Anything already saved in
 * Section A wins; this only fills fields that are still empty.
 */
async function withSignupDefaults(
  userId: string,
  role: string,
  sections: Record<string, Record<string, string>>,
): Promise<Record<string, Record<string, string>>> {
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    const u = data.user;
    if (!u) return sections;
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const defaults: Record<string, string> = {
      full_name: str(meta.full_name) || str(meta.name),
      email: u.email ?? "",
      phone: str(meta.phone),
    };
    const orgKey = ORG_FIELD[role];
    if (orgKey) defaults[orgKey] = str(meta.company_name);
    const saved = sections.a ?? {};
    const a: Record<string, string> = { ...saved };
    for (const [k, v] of Object.entries(defaults)) {
      if (v && !str(saved[k])) a[k] = v;
    }
    return { ...sections, a };
  } catch {
    return sections;
  }
}

export const Route = createFileRoute("/onboarding/wizard")({
  // `?section=h` opens that section directly, which is how the profile
  // completion bar and every feature lock link back in (§3.2A).
  validateSearch: z.object({ section: z.string().max(4).optional() }),
  head: () => ({ meta: [{ title: "Onboarding — IGE" }] }),
  // The session lives in the browser, so the server render has no token to
  // send: run the loader client-side only. Without this, every full page load
  // of the wizard (refresh, typed URL, plain link) failed the auth check on
  // the server and bounced a signed-in person to /signup.
  ssr: false,
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
