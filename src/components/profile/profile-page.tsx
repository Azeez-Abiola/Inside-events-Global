import { useRef, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, Compass, Loader2, Lock, Shield, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useDashboardTour } from "@/lib/dashboard-tour-context";
import {
  getMyProfileSummary,
  updateBaseProfile,
  upsertOrganiserProfile,
  upsertSponsorProfile,
  upsertReferralProfile,
  upsertMediaPartnerProfile,
} from "@/lib/profile.functions";
import { completenessHint } from "@/lib/profile-completeness";
import {
  COMPANY_SIZES,
  COUNTRIES,
  PRIMARY_SECTORS,
  PRIMARY_AUDIENCES,
  GEOGRAPHIC_MIX,
  CURRENCIES,
  SECTOR_EXPERTISE,
} from "@/lib/event-taxonomy";
import { roleLabel } from "@/lib/dashboard-meta";
import { ChipMulti, Field, SelectField, TextArea } from "@/components/signup/profile-fields";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Tab = "general" | "role" | "security";

const OUTLET_TYPES = ["Publication", "Podcast", "Newsletter", "Creator", "Agency", "Freelance", "Other"];

export function ProfilePage({ initialTab = "general" }: { initialTab?: Tab }) {
  const { user, roles, signOut } = useAuth();
  const { startTour, tourRole } = useDashboardTour();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = useServerFn(getMyProfileSummary);
  const saveBase = useServerFn(updateBaseProfile);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
    enabled: !!user,
  });

  const profile = data?.profile as Record<string, unknown> | null | undefined;
  const displayName =
    (typeof profile?.display_name === "string" && profile.display_name.trim()) ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl = typeof profile?.avatar_url === "string" ? profile.avatar_url : null;
  const initials = displayName.slice(0, 2).toUpperCase();

  const primaryRole = roles[0] ?? "member";
  const profileComplete = typeof data?.profileComplete === "number" ? data.profileComplete : 0;
  const completeHint = data?.completenessHint ?? completenessHint(primaryRole, profileComplete);

  async function onAvatarChange(file: File) {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("event-assets")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data: urlData } = supabase.storage.from("event-assets").getPublicUrl(path);
      await saveBase({ data: { avatar_url: urlData.publicUrl } });
      await refetch();
      qc.invalidateQueries({ queryKey: ["header-profile"] });
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "general", label: "Account", icon: User },
    { id: "role", label: "Role profile", icon: Shield },
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your account details, {roleLabel(roles).toLowerCase()} profile, and security settings.
          </p>
        </div>
        {tourRole && (
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => startTour({ force: true })}
          >
            <Compass className="mr-2 h-4 w-4" />
            See tour
          </Button>
        )}
      </header>

      {/* Avatar hero */}
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 sm:flex-row sm:items-start">
        <div className="relative">
          <Avatar className="h-24 w-24 ring-4 ring-primary/10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-brand-soft text-2xl font-bold text-primary-deep">{initials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted disabled:opacity-50"
            aria-label="Change photo"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onAvatarChange(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="text-center sm:text-left sm:flex-1">
          <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="mt-2 inline-flex rounded-full bg-brand-soft px-3 py-0.5 text-xs font-semibold text-primary-deep">
            {roleLabel(roles)}
          </span>
          {primaryRole !== "abw_admin" && primaryRole !== "super_admin" && (
            <div className="mt-4 max-w-sm text-left">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Profile completeness</span>
                <span className="font-bold text-foreground">{profileComplete}%</span>
              </div>
              <Progress value={profileComplete} className="h-2" />
              <p className="mt-1.5 text-xs text-muted-foreground">{completeHint}</p>
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tab === "general" ? (
        <GeneralProfileForm
          profile={profile}
          email={user?.email ?? ""}
          onSaved={() => {
            refetch();
            qc.invalidateQueries({ queryKey: ["header-profile"] });
          }}
        />
      ) : tab === "role" ? (
        <RoleProfileForm role={primaryRole} data={data} onSaved={() => refetch()} />
      ) : (
        <SecuritySection onPasswordChanged={signOut} />
      )}
    </div>
  );
}

function GeneralProfileForm({
  profile,
  email,
  onSaved,
}: {
  profile: Record<string, unknown> | null | undefined;
  email: string;
  onSaved: () => void;
}) {
  const save = useServerFn(updateBaseProfile);
  const [form, setForm] = useState({
    display_name: String(profile?.display_name ?? ""),
    phone: String(profile?.phone ?? ""),
    linkedin_url: String(profile?.linkedin_url ?? ""),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      display_name: String(profile?.display_name ?? ""),
      phone: String(profile?.phone ?? ""),
      linkedin_url: String(profile?.linkedin_url ?? ""),
    });
  }, [profile?.display_name, profile?.phone, profile?.linkedin_url]);

  return (
    <form
      className="space-y-5 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await save({ data: form });
          toast.success("Your account details have been saved.");
          onSaved();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 className="font-display text-lg font-bold">Account details</h3>
      <Field label="Display name" value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted-foreground">Email</span>
        <input value={email} disabled className="w-full rounded-md border border-input bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground" />
      </label>
      <Field label="Phone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <Field label="LinkedIn URL" type="url" placeholder="https://linkedin.com/in/…" value={form.linkedin_url} onChange={(v) => setForm({ ...form, linkedin_url: v })} />
      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function RoleProfileForm({
  role,
  data,
  onSaved,
}: {
  role: string;
  data: {
    organiser?: unknown;
    sponsor?: unknown;
    referral?: unknown;
    media?: unknown;
    profile?: unknown;
  } | undefined;
  onSaved: () => void;
}) {
  if (role === "abw_admin" || role === "super_admin") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Admin accounts use platform-wide settings from the dashboard. Update your display name and photo in the Account tab.
      </div>
    );
  }
  if (role === "organiser") return <OrganiserProfileEdit data={data?.organiser} onSaved={onSaved} />;
  if (role === "sponsor") return <SponsorProfileEdit data={data?.sponsor} onSaved={onSaved} />;
  if (role === "referral_partner") return <ReferralProfileEdit data={data?.referral} profile={data?.profile} onSaved={onSaved} />;
  if (role === "media_partner") return <MediaProfileEdit data={data?.media} onSaved={onSaved} />;
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
      No role-specific profile for your account yet.
    </div>
  );
}

function OrganiserProfileEdit({ data, onSaved }: { data: any; onSaved: () => void }) {
  const submit = useServerFn(upsertOrganiserProfile);
  const [form, setForm] = useState({
    org_name: data?.org_name ?? "",
    bio: data?.bio ?? "",
    website: data?.website ?? "",
    event_history: data?.event_history ?? "",
    logo_url: data?.logo_url ?? "",
  });
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-5 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.org_name.trim()) return toast.error("Organisation name is required");
        setSaving(true);
        try {
          await submit({ data: form });
          toast.success("Organiser profile saved");
          onSaved();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 className="font-display text-lg font-bold">Organiser profile</h3>
      <Field label="Organisation name" value={form.org_name} onChange={(v) => setForm({ ...form, org_name: v })} required />
      <Field label="Website" type="url" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
      <Field label="Logo URL" type="url" placeholder="https://… or upload via profile photo" value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v })} />
      <TextArea label="Short bio" rows={3} value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} />
      <TextArea label="Event track record" rows={3} value={form.event_history} onChange={(v) => setForm({ ...form, event_history: v })} />
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save organiser profile"}</Button>
    </form>
  );
}

function SponsorProfileEdit({ data, onSaved }: { data: any; onSaved: () => void }) {
  const submit = useServerFn(upsertSponsorProfile);
  const [form, setForm] = useState({
    brand_name: data?.brand_name ?? "",
    industry: data?.industry ?? "",
    company_size: data?.company_size ?? "",
    hq_country: data?.hq_country ?? "",
    hq_city: data?.hq_city ?? "",
    preferred_currency: data?.preferred_currency ?? "USD",
    sponsorship_sectors: (data?.sponsorship_sectors as string[]) ?? [],
    target_geographies: (data?.target_geographies as string[]) ?? [],
    audience_types: (data?.audience_types as string[]) ?? [],
    budget_range_min: data?.budget_range_min != null ? String(data.budget_range_min) : "",
    budget_range_max: data?.budget_range_max != null ? String(data.budget_range_max) : "",
  });
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-5 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.brand_name.trim()) return toast.error("Brand name is required");
        setSaving(true);
        try {
          await submit({
            data: {
              ...form,
              budget_range_min: form.budget_range_min ? Number(form.budget_range_min) : null,
              budget_range_max: form.budget_range_max ? Number(form.budget_range_max) : null,
            },
          });
          toast.success("Sponsor profile saved");
          onSaved();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 className="font-display text-lg font-bold">Sponsor profile</h3>
      <Field label="Brand name" value={form.brand_name} onChange={(v) => setForm({ ...form, brand_name: v })} required />
      <Field label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Company size" value={form.company_size} onChange={(v) => setForm({ ...form, company_size: v })} options={COMPANY_SIZES} />
        <SelectField label="HQ country" value={form.hq_country} onChange={(v) => setForm({ ...form, hq_country: v })} options={COUNTRIES} />
      </div>
      <Field label="HQ city" value={form.hq_city} onChange={(v) => setForm({ ...form, hq_city: v })} />
      <ChipMulti label="Sponsorship sectors" options={PRIMARY_SECTORS} value={form.sponsorship_sectors} onChange={(v) => setForm({ ...form, sponsorship_sectors: v })} />
      <ChipMulti label="Target geographies" options={GEOGRAPHIC_MIX} value={form.target_geographies} onChange={(v) => setForm({ ...form, target_geographies: v })} />
      <ChipMulti label="Audience types" options={PRIMARY_AUDIENCES} value={form.audience_types} onChange={(v) => setForm({ ...form, audience_types: v })} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Min budget" type="number" value={form.budget_range_min} onChange={(v) => setForm({ ...form, budget_range_min: v })} />
        <Field label="Max budget" type="number" value={form.budget_range_max} onChange={(v) => setForm({ ...form, budget_range_max: v })} />
        <SelectField label="Currency" value={form.preferred_currency} onChange={(v) => setForm({ ...form, preferred_currency: v })} options={[...CURRENCIES]} />
      </div>
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save sponsor profile"}</Button>
    </form>
  );
}

function ReferralProfileEdit({ data, profile, onSaved }: { data: any; profile: any; onSaved: () => void }) {
  const submit = useServerFn(upsertReferralProfile);
  const [form, setForm] = useState({
    full_name: data?.full_name ?? "",
    professional_title: data?.professional_title ?? "",
    sector_expertise: (data?.sector_expertise as string[]) ?? [],
    professional_bg: data?.professional_bg ?? "",
    sponsor_network_desc: data?.sponsor_network_desc ?? "",
    payout_currency: data?.payout_currency ?? "NGN",
    linkedin_url: profile?.linkedin_url ?? "",
  });
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-5 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.full_name.trim()) return toast.error("Full name is required");
        setSaving(true);
        try {
          await submit({ data: form });
          toast.success("Referral profile saved");
          onSaved();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 className="font-display text-lg font-bold">Referral partner profile</h3>
      <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
      <Field label="Professional title" value={form.professional_title} onChange={(v) => setForm({ ...form, professional_title: v })} />
      <Field label="LinkedIn URL" type="url" value={form.linkedin_url} onChange={(v) => setForm({ ...form, linkedin_url: v })} />
      <ChipMulti label="Sector expertise" options={SECTOR_EXPERTISE} value={form.sector_expertise} onChange={(v) => setForm({ ...form, sector_expertise: v })} />
      <TextArea label="Professional background" rows={3} value={form.professional_bg} onChange={(v) => setForm({ ...form, professional_bg: v })} />
      <TextArea label="Sponsor network" rows={3} value={form.sponsor_network_desc} onChange={(v) => setForm({ ...form, sponsor_network_desc: v })} />
      <SelectField label="Payout currency" value={form.payout_currency} onChange={(v) => setForm({ ...form, payout_currency: v })} options={["NGN", "USD", "GBP", "EUR"]} />
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save referral profile"}</Button>
    </form>
  );
}

function MediaProfileEdit({ data, onSaved }: { data: any; onSaved: () => void }) {
  const submit = useServerFn(upsertMediaPartnerProfile);
  const [form, setForm] = useState({
    outlet_name: data?.outlet_name ?? "",
    outlet_type: data?.outlet_type ?? "",
    beat_sectors: (data?.beat_sectors as string[]) ?? [],
    portfolio_url: data?.portfolio_url ?? "",
    bio: data?.bio ?? "",
  });
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-5 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!form.outlet_name.trim()) return toast.error("Outlet name is required");
        setSaving(true);
        try {
          await submit({ data: form });
          toast.success("Media profile saved");
          onSaved();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 className="font-display text-lg font-bold">Media partner profile</h3>
      <Field label="Outlet / publication name" value={form.outlet_name} onChange={(v) => setForm({ ...form, outlet_name: v })} required />
      <SelectField label="Outlet type" value={form.outlet_type} onChange={(v) => setForm({ ...form, outlet_type: v })} options={OUTLET_TYPES} />
      <Field label="Portfolio / website" type="url" value={form.portfolio_url} onChange={(v) => setForm({ ...form, portfolio_url: v })} />
      <ChipMulti label="Coverage beats" options={PRIMARY_SECTORS} value={form.beat_sectors} onChange={(v) => setForm({ ...form, beat_sectors: v })} />
      <TextArea label="Bio" rows={4} value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} placeholder="What do you cover and who is your audience?" />
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save media profile"}</Button>
    </form>
  );
}

function SecuritySection({ onPasswordChanged }: { onPasswordChanged: () => Promise<void> }) {
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [changing, setChanging] = useState(false);

  return (
    <form
      className="space-y-5 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pw.next.length < 8) return toast.error("Password must be at least 8 characters.");
        if (pw.next !== pw.confirm) return toast.error("Passwords do not match.");
        setChanging(true);
        try {
          const { error } = await supabase.auth.updateUser({ password: pw.next });
          if (error) throw error;
          toast.success("Password updated. Please sign in again with your new password.");
          setPw({ next: "", confirm: "" });
          await onPasswordChanged();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not update password");
        } finally {
          setChanging(false);
        }
      }}
    >
      <h3 className="font-display text-lg font-bold">Change password</h3>
      <p className="text-sm text-muted-foreground">
        After updating your password you will be signed out and asked to sign in again.
      </p>
      <Field label="New password" type="password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} />
      <Field label="Confirm new password" type="password" value={pw.confirm} onChange={(v) => setPw({ ...pw, confirm: v })} />
      <Button type="submit" disabled={changing}>{changing ? "Updating…" : "Update password"}</Button>
    </form>
  );
}
