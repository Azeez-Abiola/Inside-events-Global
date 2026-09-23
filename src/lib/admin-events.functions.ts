/**
 * Admin-assisted event listings.
 *
 * During launch an organiser may reach out before they have an account. An
 * admin builds the listing for them — but the event is owned by the
 * organiser's own account from the moment it is created. `organiser_id` is
 * what getMyEvents filters on, what the edit guards check, and what
 * adminCreateDeal copies onto every deal and notification, so a listing
 * parked under the admin would misroute every future inquiry and payout.
 *
 * Creation and the claim invite are deliberately separate steps: the admin
 * builds the listing first, then invites, so the organiser's first sign-in
 * lands on a finished listing rather than an empty draft.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requirePlatformAdmin, getActorProfile, getUserRoles } from "@/lib/admin-auth";
import { auditAdminAction } from "@/lib/admin-audit";
import { generateTempPassword } from "@/lib/temp-password";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { flushEmailQueueInDev } from "@/lib/email/flush-queue-dev";
import { getSiteUrl } from "@/lib/site-url";

const ADMIN_ROLES = ["abw_admin", "super_admin"];

// `events.created_by_admin` and `profiles.invite_sent_at` are not yet in the
// generated Supabase types (the migration is new). Reads and writes that touch
// them go through adb(), which casts to `any` — same convention as the odb()
// helper in onboarding.functions.ts. Drop this once `supabase gen types` is
// re-run against the applied migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adb(): any {
  return supabaseAdmin as any;
}

/** Roles that must never be converted into an organiser account by mistake. */
function isStaffAccount(roles: string[]) {
  return roles.some((r) => ADMIN_ROLES.includes(r));
}

// ───────────────────────────────────────────────────────────────
// Look up an organiser by email before creating anything
// ───────────────────────────────────────────────────────────────

export type OrganiserLookup =
  | { state: "new"; email: string }
  | {
      state: "organiser" | "other_role";
      email: string;
      user_id: string;
      display_name: string | null;
      org_name: string | null;
      roles: string[];
      claimed: boolean;
      invite_sent_at: string | null;
    }
  | { state: "staff"; email: string };

export const adminLookupOrganiser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<OrganiserLookup> => {
    await requirePlatformAdmin(context.userId);
    const email = data.email.toLowerCase();

    const { data: profile } = (await adb()
      .from("profiles")
      .select("id, email, display_name, last_login_at, invite_sent_at")
      .eq("email", email)
      .maybeSingle()) as {
      data: {
        id: string;
        email: string | null;
        display_name: string | null;
        last_login_at: string | null;
        invite_sent_at: string | null;
      } | null;
    };

    if (!profile?.id) return { state: "new", email };

    const roles = await getUserRoles(profile.id);
    if (isStaffAccount(roles)) return { state: "staff", email };

    const [{ data: orgProfile }, { data: authUser }] = await Promise.all([
      supabaseAdmin
        .from("organiser_profiles")
        .select("org_name")
        .eq("user_id", profile.id)
        .maybeSingle(),
      // Same authoritative check the invite uses, so what the admin is told
      // here matches what actually happens when they click Send invite.
      supabaseAdmin.auth.admin.getUserById(profile.id),
    ]);

    return {
      state: roles.includes("organiser") ? "organiser" : "other_role",
      email,
      user_id: profile.id,
      display_name: profile.display_name,
      org_name: orgProfile?.org_name ?? null,
      roles,
      claimed: Boolean(authUser?.user?.last_sign_in_at || profile.last_login_at),
      invite_sent_at: profile.invite_sent_at,
    };
  });

// ───────────────────────────────────────────────────────────────
// Create a draft owned by the organiser
// ───────────────────────────────────────────────────────────────

const CreateInput = z.object({
  email: z.string().trim().email().max(255),
  org_name: z.string().trim().min(1).max(160),
  event_name: z.string().trim().max(200).optional(),
  contact_name: z.string().trim().max(160).optional(),
  contact_phone: z.string().trim().max(60).optional(),
  contact_role: z.string().trim().max(120).optional(),
  /** Explicit confirmation before granting the organiser role to an existing non-organiser account. */
  allow_add_role: z.boolean().optional().default(false),
});

export const adminCreateEventForOrganiser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePlatformAdmin(context.userId);
    const email = data.email.toLowerCase();
    const actor = await getActorProfile(context.userId);

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let organiserId = existing?.id ?? null;
    let accountCreated = false;
    let roleAdded = false;

    if (organiserId) {
      const roles = await getUserRoles(organiserId);
      if (isStaffAccount(roles)) {
        throw new Error("That email belongs to an IGE admin account. Use a different address.");
      }
      if (!roles.includes("organiser")) {
        if (!data.allow_add_role) {
          throw new Error(
            "That email already has an IGE account without the organiser role. Confirm adding the role to continue.",
          );
        }
        await supabaseAdmin.from("user_roles").insert({ user_id: organiserId, role: "organiser" });
        roleAdded = true;
      }
    } else {
      // No password yet — the account stays unusable until the admin sends the
      // claim invite, which is what issues a temporary one.
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role: "organiser", full_name: data.contact_name ?? data.org_name },
      });
      if (createErr || !created.user) {
        throw new Error(createErr?.message ?? "Could not create the organiser account");
      }
      organiserId = created.user.id;
      accountCreated = true;

      await supabaseAdmin.from("profiles").upsert({
        id: organiserId,
        email,
        display_name: data.org_name,
        // An admin vouched for this organiser, so they skip the pending-approval
        // gate — otherwise claiming the invite would land them on a waiting screen.
        is_active: true,
        last_login_at: null,
      } as never);
      await supabaseAdmin.from("user_roles").insert({ user_id: organiserId, role: "organiser" });
    }

    // Minimal organiser profile so the listing has an org name behind it.
    const { data: orgProfile } = await supabaseAdmin
      .from("organiser_profiles")
      .select("user_id, org_name")
      .eq("user_id", organiserId)
      .maybeSingle();
    if (!orgProfile) {
      await supabaseAdmin
        .from("organiser_profiles")
        .insert({ user_id: organiserId, org_name: data.org_name } as never);
    }

    const { data: event, error: eventErr } = (await adb()
      .from("events")
      .insert({
        organiser_id: organiserId,
        created_by_admin: context.userId,
        name: data.event_name?.trim() || "Untitled event",
        status: "draft",
        form_step_completed: 0,
        organiser_contact_name: data.contact_name ?? null,
        organiser_contact_email: email,
        organiser_contact_phone: data.contact_phone ?? null,
        organiser_contact_role: data.contact_role ?? null,
      } as never)
      .select("id")
      .single()) as { data: { id: string } | null; error: { message: string } | null };
    if (eventErr || !event)
      throw new Error(eventErr?.message ?? "Could not create the event draft");

    if (accountCreated) {
      await auditAdminAction({
        actorId: context.userId,
        actorEmail: actor?.email,
        action: "organiser_account_created",
        summary: `Created organiser account ${data.org_name} (${email})`,
        resourceType: "user",
        resourceId: organiserId,
        metadata: { email, org_name: data.org_name },
        notifyTitle: "Organiser account created",
        notifyBody: `${actor?.display_name ?? actor?.email ?? "An admin"} created an organiser account for ${data.org_name} (${email}).`,
      });
    }

    await auditAdminAction({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "event_created_for_organiser",
      summary: `Created a listing for ${data.org_name} (${email})`,
      resourceType: "event",
      resourceId: event.id,
      metadata: {
        email,
        org_name: data.org_name,
        organiser_id: organiserId,
        role_added: roleAdded,
      },
      notifyTitle: "Listing created for an organiser",
      notifyBody: `${actor?.display_name ?? actor?.email ?? "An admin"} created a listing on behalf of ${data.org_name} (${email}).`,
    });

    return {
      event_id: event.id as string,
      user_id: organiserId,
      account_created: accountCreated,
      role_added: roleAdded,
    };
  });

// ───────────────────────────────────────────────────────────────
// Send the claim invite
// ───────────────────────────────────────────────────────────────

export const adminInviteOrganiser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePlatformAdmin(context.userId);

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, last_login_at, is_suspended")
      .eq("id", data.user_id)
      .single();
    if (profileErr || !profile?.email) {
      throw new Error(profileErr?.message ?? "Organiser profile not found");
    }
    if (profile.is_suspended) throw new Error("That account is deactivated.");

    // Resetting the password of an account already in use would lock the
    // organiser out. profiles.last_login_at is only stamped when someone signs
    // in through the login form, so the auth record is the authoritative
    // source here — this is the one place where being wrong costs someone
    // their access.
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    if (authUser?.user?.last_sign_in_at || profile.last_login_at) {
      throw new Error(
        "That organiser has already signed in. Ask them to use Forgot password instead of re-inviting.",
      );
    }

    // Guard against this becoming a generic "reset anyone's password" tool:
    // only accounts we built a listing for can be invited this way.
    const { data: assisted } = (await adb()
      .from("events")
      .select("id, name, created_by_admin")
      .eq("organiser_id", data.user_id)
      .not("created_by_admin", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)) as { data: { id: string; name: string | null }[] | null };
    if (!assisted?.length) {
      throw new Error("That account has no admin-created listing, so there is nothing to claim.");
    }

    const { data: orgProfile } = await supabaseAdmin
      .from("organiser_profiles")
      .select("org_name")
      .eq("user_id", data.user_id)
      .maybeSingle();

    const password = generateTempPassword();
    const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password,
      email_confirm: true,
    });
    if (pwdErr) throw new Error(pwdErr.message);

    const siteUrl = getSiteUrl();
    const sendResult = await sendTransactionalEmailServer({
      templateName: "organiser-listing-invite",
      recipientEmail: profile.email,
      idempotencyKey: `organiser-listing-invite-${profile.email}-${Date.now()}`,
      templateData: {
        name: profile.display_name ?? orgProfile?.org_name ?? undefined,
        email: profile.email,
        orgName: orgProfile?.org_name ?? profile.display_name ?? undefined,
        eventName: assisted[0].name ?? undefined,
        temporaryPassword: password,
        loginUrl: `${siteUrl}/login`,
        siteUrl,
      },
    });
    if (!sendResult.success) {
      throw new Error(
        sendResult.reason === "suppressed"
          ? `Could not send invite: ${profile.email} is on the email suppression list.`
          : "Could not queue the invite email. Please try again.",
      );
    }
    const queueFlush = await flushEmailQueueInDev();
    if (queueFlush.error)
      throw new Error(`Invite saved but email delivery failed: ${queueFlush.error}`);

    await adb()
      .from("profiles")
      .update({ invite_sent_at: new Date().toISOString() })
      .eq("id", data.user_id);

    const actor = await getActorProfile(context.userId);
    await auditAdminAction({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "organiser_invite_sent",
      summary: `Sent listing claim invite to ${profile.email}`,
      resourceType: "user",
      resourceId: data.user_id,
      metadata: { email: profile.email, event_id: assisted[0].id },
    });

    return { ok: true };
  });

// ───────────────────────────────────────────────────────────────
// List the assisted listings
// ───────────────────────────────────────────────────────────────

type AssistedEventRow = {
  id: string;
  name: string | null;
  status: string;
  city: string | null;
  country: string | null;
  start_date: string | null;
  organiser_id: string | null;
  created_at: string;
  updated_at: string;
};

export const adminListAssistedEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePlatformAdmin(context.userId);

    const { data: events } = (await adb()
      .from("events")
      .select("id, name, status, city, country, start_date, organiser_id, created_at, updated_at")
      .not("created_by_admin", "is", null)
      .order("created_at", { ascending: false })
      .limit(200)) as { data: AssistedEventRow[] | null };

    const organiserIds = [
      ...new Set((events ?? []).map((e) => e.organiser_id).filter(Boolean)),
    ] as string[];
    const byUser: Record<
      string,
      {
        email: string | null;
        display_name: string | null;
        claimed: boolean;
        invite_sent_at: string | null;
      }
    > = {};
    if (organiserIds.length) {
      const { data: profiles } = (await adb()
        .from("profiles")
        .select("id, email, display_name, last_login_at, invite_sent_at")
        .in("id", organiserIds)) as {
        data:
          | {
              id: string;
              email: string | null;
              display_name: string | null;
              last_login_at: string | null;
              invite_sent_at: string | null;
            }[]
          | null;
      };
      for (const p of profiles ?? []) {
        byUser[p.id] = {
          email: p.email,
          display_name: p.display_name,
          claimed: Boolean(p.last_login_at),
          invite_sent_at: p.invite_sent_at,
        };
      }
    }

    return {
      events: (events ?? []).map((e) => ({
        ...e,
        organiser: e.organiser_id
          ? (byUser[e.organiser_id] ?? {
              email: null,
              display_name: null,
              claimed: false,
              invite_sent_at: null,
            })
          : { email: null, display_name: null, claimed: false, invite_sent_at: null },
      })),
    };
  });
