import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getPublicEventBySlug, submitCommitmentForm, getCurrentRates, toggleSaveEvent } from "@/lib/marketplace.functions";
import { submitCustomPackageRequest } from "@/lib/custom-package.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { AppShell } from "@/components/app-shell";
import { Calendar, MapPin, Users, ShieldCheck, Globe, CheckCircle2, AlertCircle, CalendarPlus, Download, Sparkles, Bookmark, BookmarkCheck, Pencil, ChevronLeft, Newspaper, Link2, Copy, Loader2 } from "lucide-react";
import { generateReferralLink } from "@/lib/referrals.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { fmtDual } from "@/lib/currency";
import { CoverageRequestModal } from "@/components/dashboards/media-dashboard";
import { z } from "zod";

const searchSchema = z.object({ ref: z.string().max(20).optional() });

const FORM_INPUT =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring";

import { ensureMarketplaceAccess } from "@/lib/marketplace-visibility";

export const Route = createFileRoute("/events/$slug")({
  beforeLoad: () => ensureMarketplaceAccess(),
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} · IGE` }],
  }),
  component: EventDetail,
});

function fmt(curr: string, n: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${curr} ${n.toLocaleString()}`;
  }
}

function EventDetail() {
  const { slug } = Route.useParams();
  const search = useSearch({ from: "/events/$slug" });
  const { user, roles } = useAuth();
  const fetchEvent = useServerFn(getPublicEventBySlug);
  const fetchRates = useServerFn(getCurrentRates);

  const isAdmin = roles.includes("abw_admin") || roles.includes("super_admin");

  const { data, isLoading } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: () => fetchEvent({ data: { slug } }),
  });
  const { data: ratesData } = useQuery({ queryKey: ["fx-rates"], queryFn: () => fetchRates() });
  const rates = ratesData?.rates;

  const [showForm, setShowForm] = useState(false);
  const [showCustomPackage, setShowCustomPackage] = useState(false);
  const [showSponsor, setShowSponsor] = useState(false);
  const [showMediaRequest, setShowMediaRequest] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  if (isLoading) {
    return (
      <EventPageLayout>
        <div className="py-24 text-center text-muted-foreground">Loading event…</div>
      </EventPageLayout>
    );
  }

  const event = data?.event;
  if (!event) {
    return (
      <EventPageLayout>
        <div className="py-24 text-center">
          <h1 className="font-display text-3xl font-bold">Event not found</h1>
          <p className="mt-2 text-muted-foreground">This event may have been unlisted.</p>
          <Link to="/marketplace" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Back to marketplace
          </Link>
        </div>
      </EventPageLayout>
    );
  }

  const isOwner = !!user && user.id === event.organiser_id;
  const isMediaPartner = roles.includes("media_partner");
  const isReferralPartner = roles.includes("referral_partner");
  const canEngageAsSponsor = !isOwner && !isAdmin && !isMediaPartner && !isReferralPartner;
  const canReferEvent = isReferralPartner && ["approved", "listed"].includes(event.status);

  return (
    <EventPageLayout>
      {user && (
        <div className="mb-6">
          <Link
            to={isAdmin ? "/dashboard/vetting" : "/dashboard"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      )}

      {event.banner_image_url && (
        <div className="relative -mx-6 mb-8 h-72 overflow-hidden bg-muted md:rounded-xl">
          <img src={event.banner_image_url} alt={event.name} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {event.ige_vetted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-medium text-secondary-deep">
                  <ShieldCheck className="h-3 w-3" /> IGE Vetted
                </span>
              )}
              {event.event_type && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{event.event_type}</span>
              )}
              {event.primary_sector && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{event.primary_sector}</span>
              )}
            </div>

            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">{event.name}</h1>
            {event.event_theme && <p className="mt-2 text-lg text-muted-foreground">{event.event_theme}</p>}

            <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
              {event.start_date && (
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(event.start_date).toLocaleDateString()}</span>
              )}
              {(event.city || event.country) && (
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {[event.city, event.country].filter(Boolean).join(", ")}</span>
              )}
              {event.attendance_size && (
                <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {event.attendance_size.toLocaleString()} attendees</span>
              )}
              {event.format && <span className="inline-flex items-center gap-1.5"><Globe className="h-4 w-4" /> {event.format}</span>}
            </div>

            {data?.organiser && (
              <section className="mt-10 rounded-xl border border-border bg-card p-6">
                <h2 className="font-display text-lg font-semibold">About the organiser</h2>
                <div className="mt-3 flex items-start gap-4">
                  {data.organiser.logo_url && (
                    <img src={data.organiser.logo_url} alt={data.organiser.org_name} className="h-14 w-14 rounded-md object-cover" />
                  )}
                  <div>
                    <div className="font-medium">{data.organiser.org_name}</div>
                    {data.organiser.bio && <p className="mt-1 text-sm text-muted-foreground">{data.organiser.bio}</p>}
                  </div>
                </div>
                {data.organiser.track_record && (
                  <p className="mt-4 text-sm text-muted-foreground"><strong className="text-foreground">Track record:</strong> {data.organiser.track_record}</p>
                )}
              </section>
            )}

            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold">Sponsorship packages</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(data?.tiers ?? []).map((t: any) => (
                  <div
                    key={t.id}
                    className={`rounded-xl border p-5 transition-colors ${selectedTier === t.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="font-display text-lg font-semibold">{t.tier_name}</div>
                      <div className="font-display text-xl font-bold">{fmtDual(t.currency, Number(t.price), rates)}</div>
                    </div>
                    {Array.isArray(t.assets) && t.assets.length > 0 && (
                      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                        {t.assets.slice(0, 6).map((a: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" /> {a}</li>
                        ))}
                      </ul>
                    )}
                    {t.slots_remaining !== null && (
                      <div className="mt-3 text-xs text-muted-foreground">{t.slots_remaining} of {t.slots_total} slots left</div>
                    )}
                    {canEngageAsSponsor && (
                      <button
                        type="button"
                        onClick={() => { setSelectedTier(t.id); setShowForm(true); }}
                        className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Express interest
                      </button>
                    )}
                  </div>
                ))}
                {!data?.tiers?.length && (
                  <p className="text-sm text-muted-foreground">No packages published yet - contact the organiser directly.</p>
                )}
              </div>
            </section>
          </div>

          <GetInvolvedAside
            event={event}
            refCode={search.ref ?? null}
            isAdmin={isAdmin}
            isOwner={isOwner}
            isMediaPartner={isMediaPartner}
            canReferEvent={canReferEvent}
            canEngageAsSponsor={canEngageAsSponsor}
            onSponsor={() => { setSelectedTier(null); setShowSponsor(true); }}
            onCommitment={() => setShowForm(true)}
            onCustomPackage={() => setShowCustomPackage(true)}
            onMediaRequest={() => setShowMediaRequest(true)}
          />
        </div>

      {showSponsor && (
        <SponsorInterestDialog
          eventId={event.id}
          eventName={event.name}
          tiers={data?.tiers ?? []}
          onClose={() => setShowSponsor(false)}
        />
      )}
      {/* SponsorInterestDialog defined below */}

      {showForm && (
        <CommitmentDialog
          eventId={event.id}
          eventCurrency={event.currency ?? "USD"}
          tierId={selectedTier}
          refCode={search.ref ?? null}
          onClose={() => setShowForm(false)}
        />
      )}

      {showCustomPackage && (
        <CustomPackageDialog
          eventId={event.id}
          eventCurrency={event.currency ?? "USD"}
          refCode={search.ref ?? null}
          onClose={() => setShowCustomPackage(false)}
        />
      )}

      {showMediaRequest && (
        <CoverageRequestModal
          event={{ id: event.id, name: event.name }}
          onClose={() => setShowMediaRequest(false)}
        />
      )}
    </EventPageLayout>
  );
}

function EventPageLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (user) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}

function ReferThisEventPanel({ eventId, eventName }: { eventId: string; eventName: string }) {
  const generate = useServerFn(generateReferralLink);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const actionBtn =
    "inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors";

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await generate({ data: { event_id: eventId } });
      const full = `${window.location.origin}${res.link.vouch_link_url}`;
      setLinkUrl(full);
      setCommissionRate(Number(res.link.commission_rate ?? 0));
      if (!res.reused) toast.success("Vouch Link created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-6">
      <div className="text-xs font-semibold uppercase tracking-wide text-secondary-deep">Referral partner</div>
      <p className="mt-2 text-sm text-muted-foreground">
        Generate a trackable Vouch Link for <strong className="text-foreground">{eventName}</strong> and share with sponsors.
        {commissionRate != null && commissionRate > 0 && (
          <span className="mt-1 block text-xs font-semibold text-secondary-deep">
            Est. commission: {(commissionRate * 100).toFixed(1)}% of deal value when payment is received
          </span>
        )}
      </p>
      <div className="mt-4 space-y-2">
        <button type="button" onClick={() => void handleGenerate()} disabled={loading} className={`${actionBtn} border-secondary/40`}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          {linkUrl ? "Regenerate link" : "Refer this event"}
        </button>
        {linkUrl && (
          <div className="rounded-md border border-border bg-card p-3">
            <div className="break-all font-mono text-xs text-foreground">{linkUrl}</div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(linkUrl);
                toast.success("Link copied");
              }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Copy className="h-3 w-3" /> Copy link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GetInvolvedAside({
  event,
  refCode,
  isAdmin,
  isOwner,
  isMediaPartner,
  canReferEvent,
  canEngageAsSponsor,
  onSponsor,
  onCommitment,
  onCustomPackage,
  onMediaRequest,
}: {
  event: any;
  refCode: string | null;
  isAdmin: boolean;
  isOwner: boolean;
  isMediaPartner: boolean;
  canReferEvent: boolean;
  canEngageAsSponsor: boolean;
  onSponsor: () => void;
  onCommitment: () => void;
  onCustomPackage: () => void;
  onMediaRequest: () => void;
}) {
  const actionBtn = "inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors";

  return (
    <aside className="space-y-4">
      {isOwner && (
        <div className="rounded-xl border border-primary/30 bg-brand-soft/30 p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary-deep">Your event</div>
          <p className="mt-2 text-sm text-muted-foreground">Manage this listing from your organiser workspace.</p>
          <div className="mt-4 space-y-2">
            <Link
              to="/events/edit/$id"
              params={{ id: event.id }}
              className={`${actionBtn} border-primary/40 bg-card`}
            >
              <Pencil className="h-4 w-4" /> Edit event
            </Link>
            <Link to="/dashboard/pipeline" className={actionBtn}>
              View pipeline & analytics
            </Link>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</div>
          <p className="mt-2 text-sm text-muted-foreground">Review vetting details or open the full editor.</p>
          <div className="mt-4 space-y-2">
            <Link to="/dashboard/vetting" className={actionBtn}>
              <ShieldCheck className="h-4 w-4" /> Open vetting queue
            </Link>
            <Link
              to="/events/edit/$id"
              params={{ id: event.id }}
              className={actionBtn}
            >
              <Pencil className="h-4 w-4" /> Event editor
            </Link>
          </div>
        </div>
      )}

      {canReferEvent && (
        <ReferThisEventPanel eventId={event.id} eventName={event.name} />
      )}

      {isMediaPartner && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Media partner</div>
          <p className="mt-2 text-sm text-muted-foreground">Save this event or request coverage / press credentials.</p>
          <div className="mt-4 space-y-2">
            <SaveEventButton eventId={event.id} />
            <button type="button" onClick={onMediaRequest} className={`${actionBtn} border-primary/30`}>
              <Newspaper className="h-4 w-4" /> Request coverage
            </button>
          </div>
        </div>
      )}

      {canEngageAsSponsor && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Get involved</div>
          <button
            type="button"
            onClick={onSponsor}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-transform"
          >
            <Sparkles className="h-4 w-4" /> Sponsor this event
          </button>
          <button type="button" onClick={onCommitment} className={`mt-2 ${actionBtn}`}>
            Submit a Commitment Form
          </button>
          <button type="button" onClick={onCustomPackage} className={`mt-2 ${actionBtn}`}>
            Request custom package
          </button>
          <SaveEventButton eventId={event.id} />
          <p className="mt-2 text-xs text-muted-foreground">Commitment forms are verified by IGE before reaching the organiser.</p>
          {refCode && (
            <div className="mt-3 rounded-md bg-secondary/10 px-3 py-2 text-xs text-secondary-deep">
              Attributed to partner: <span className="font-mono">{refCode}</span>
            </div>
          )}
        </div>
      )}

      {event.sponsorship_deck_url && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Sponsorship deck</div>
          <a
            href={event.sponsorship_deck_url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className={`mt-3 ${actionBtn}`}
          >
            <Download className="h-4 w-4" /> Download deck (PDF)
          </a>
        </div>
      )}
      {event.cal_booking_url && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Book an intro call</div>
          <a
            href={event.cal_booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-3 ${actionBtn}`}
          >
            <CalendarPlus className="h-4 w-4" /> Schedule with organiser
          </a>
        </div>
      )}
      {event.sponsorship_deadline && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <div className="text-xs uppercase tracking-wide">Sponsorship deadline</div>
          <div className="mt-1 font-medium text-foreground">{new Date(event.sponsorship_deadline).toLocaleDateString()}</div>
        </div>
      )}
    </aside>
  );
}

function CommitmentDialog({
  eventId, eventCurrency, tierId, refCode, onClose,
}: { eventId: string; eventCurrency: string; tierId: string | null; refCode: string | null; onClose: () => void }) {
  const submit = useServerFn(submitCommitmentForm);
  const [form, setForm] = useState({
    contact_name: "",
    contact_title: "",
    company_name: "",
    company_linkedin_url: "",
    currency: eventCurrency,
    partnership_type: "cash",
    budget_range_min: "",
    budget_range_max: "",
    expected_roi: "",
    custom_requirements: "",
    readiness_confirmed: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return await submit({
        data: {
          event_id: eventId,
          readiness_confirmed: true as const,
          contact_name: form.contact_name,
          contact_title: form.contact_title || null,
          company_name: form.company_name,
          company_linkedin_url: form.company_linkedin_url,
          currency: form.currency as any,
          partnership_type: form.partnership_type as any,
          budget_range_min: form.budget_range_min ? Number(form.budget_range_min) : null,
          budget_range_max: form.budget_range_max ? Number(form.budget_range_max) : null,
          expected_roi: form.expected_roi || null,
          custom_requirements: form.custom_requirements || null,
          tier_id: tierId,
          referral_short_code: refCode,
        },
      });
    },
  });

  const submitted = mutation.isSuccess;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-secondary" />
            <h2 className="mt-4 font-display text-2xl font-bold">Commitment received</h2>
            <p className="mt-2 text-muted-foreground">IGE will review your submission and connect you with the organiser within 48 hours.</p>
            <button onClick={onClose} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Close</button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (form.readiness_confirmed) mutation.mutate(); }}
            className="space-y-5 p-8"
          >
            <div>
              <h2 className="font-display text-2xl font-bold">Commitment Form</h2>
              <p className="mt-1 text-sm text-muted-foreground">Budget-ready inquiries only. Verified by IGE before reaching the organiser.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Your name *">
                <input required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Your title">
                <input value={form.contact_title} onChange={(e) => setForm({ ...form, contact_title: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Company name *">
                <input required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Company LinkedIn URL *">
                <input required type="url" placeholder="https://linkedin.com/company/…" value={form.company_linkedin_url} onChange={(e) => setForm({ ...form, company_linkedin_url: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Currency *">
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={FORM_INPUT}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="NGN">NGN</option>
                </select>
              </Field>
              <Field label="Partnership type">
                <select value={form.partnership_type} onChange={(e) => setForm({ ...form, partnership_type: e.target.value })} className={FORM_INPUT}>
                  <option value="cash">Cash</option>
                  <option value="in_kind">In-kind</option>
                  <option value="co_creation">Co-creation</option>
                  <option value="jv">Joint venture</option>
                </select>
              </Field>
              <Field label="Budget min">
                <input type="number" min={0} value={form.budget_range_min} onChange={(e) => setForm({ ...form, budget_range_min: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Budget max">
                <input type="number" min={0} value={form.budget_range_max} onChange={(e) => setForm({ ...form, budget_range_max: e.target.value })} className={FORM_INPUT} />
              </Field>
            </div>

            <Field label="Expected ROI / objectives">
              <textarea rows={3} value={form.expected_roi} onChange={(e) => setForm({ ...form, expected_roi: e.target.value })} className={FORM_INPUT} />
            </Field>
            <Field label="Custom requirements">
              <textarea rows={3} value={form.custom_requirements} onChange={(e) => setForm({ ...form, custom_requirements: e.target.value })} className={FORM_INPUT} />
            </Field>

            <label className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <input
                type="checkbox"
                checked={form.readiness_confirmed}
                onChange={(e) => setForm({ ...form, readiness_confirmed: e.target.checked })}
                className="mt-0.5"
              />
              <span>I confirm budget is allocated and an internal decision-maker is briefed. I understand IGE collects a platform commission on closed deals.</span>
            </label>

            {mutation.error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                {(mutation.error as Error).message}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
              <button
                type="submit"
                disabled={!form.readiness_confirmed || mutation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {mutation.isPending ? "Submitting…" : "Submit commitment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CustomPackageDialog({
  eventId,
  eventCurrency,
  refCode,
  onClose,
}: {
  eventId: string;
  eventCurrency: string;
  refCode: string | null;
  onClose: () => void;
}) {
  const submit = useServerFn(submitCustomPackageRequest);
  const [form, setForm] = useState({
    contact_name: "",
    contact_title: "",
    company_name: "",
    company_linkedin_url: "",
    currency: eventCurrency,
    budget_range_min: "",
    budget_range_max: "",
    package_brief: "",
    deliverables_wanted: "",
    timeline: "",
  });

  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          event_id: eventId,
          contact_name: form.contact_name,
          contact_title: form.contact_title || null,
          company_name: form.company_name,
          company_linkedin_url: form.company_linkedin_url || null,
          currency: form.currency as "NGN" | "USD" | "GBP" | "EUR",
          budget_range_min: form.budget_range_min ? Number(form.budget_range_min) : null,
          budget_range_max: form.budget_range_max ? Number(form.budget_range_max) : null,
          package_brief: form.package_brief,
          deliverables_wanted: form.deliverables_wanted || null,
          timeline: form.timeline || null,
          referral_short_code: refCode,
        },
      }),
  });

  const submitted = mutation.isSuccess;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-secondary" />
            <h2 className="mt-4 font-display text-2xl font-bold">Custom package request sent</h2>
            <p className="mt-2 text-muted-foreground">
              IGE will review your brief and work with the organiser on a bespoke sponsorship package.
            </p>
            <button onClick={onClose} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Close</button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.package_brief.trim().length < 20) {
                toast.error("Please describe your package needs (at least 20 characters).");
                return;
              }
              mutation.mutate();
            }}
            className="space-y-5 p-8"
          >
            <div>
              <h2 className="font-display text-2xl font-bold">Request a custom package</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us what you need beyond standard tiers. IGE reviews bespoke requests before sharing with the organiser.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Your name *">
                <input required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Your title">
                <input value={form.contact_title} onChange={(e) => setForm({ ...form, contact_title: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Company name *">
                <input required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Company LinkedIn URL">
                <input type="url" placeholder="https://linkedin.com/company/…" value={form.company_linkedin_url} onChange={(e) => setForm({ ...form, company_linkedin_url: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Currency *">
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={FORM_INPUT}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="NGN">NGN</option>
                </select>
              </Field>
              <Field label="Target timeline">
                <input placeholder="e.g. Q3 2026" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Budget min">
                <input type="number" min={0} value={form.budget_range_min} onChange={(e) => setForm({ ...form, budget_range_min: e.target.value })} className={FORM_INPUT} />
              </Field>
              <Field label="Budget max">
                <input type="number" min={0} value={form.budget_range_max} onChange={(e) => setForm({ ...form, budget_range_max: e.target.value })} className={FORM_INPUT} />
              </Field>
            </div>
            <Field label="Package brief *">
              <textarea
                required
                rows={4}
                placeholder="Describe the sponsorship activation, audience goals, and deliverables you need…"
                value={form.package_brief}
                onChange={(e) => setForm({ ...form, package_brief: e.target.value })}
                className={FORM_INPUT}
              />
            </Field>
            <Field label="Desired deliverables">
              <textarea rows={3} value={form.deliverables_wanted} onChange={(e) => setForm({ ...form, deliverables_wanted: e.target.value })} className={FORM_INPUT} />
            </Field>
            {mutation.error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                {(mutation.error as Error).message}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {mutation.isPending ? "Submitting…" : "Submit custom request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SaveEventButton({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const toggle = useServerFn(toggleSaveEvent);

  const { data: saved } = useQuery({
    queryKey: ["event-saved", eventId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_saves")
        .select("id")
        .eq("event_id", eventId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const mut = useMutation({
    mutationFn: () => toggle({ data: { event_id: eventId } }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["event-saved", eventId] });
      qc.invalidateQueries({ queryKey: ["sponsor-dash"] });
      qc.invalidateQueries({ queryKey: ["media-saves"] });
      toast.success(res.saved ? "Saved to your list" : "Removed from saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!user) {
    return (
      <Link
        to="/login"
        search={{ redirect: typeof window !== "undefined" ? window.location.pathname : undefined }}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
      >
        <Bookmark className="h-4 w-4" /> Sign in to save
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => mut.mutate()}
      disabled={mut.isPending}
      className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
        saved ? "border-secondary/40 bg-secondary/10 text-secondary-deep" : "border-border hover:bg-muted"
      }`}
    >
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {saved ? "Saved" : "Save event"}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 font-medium text-foreground">{label}</div>
      {children}
    </label>
  );
}

function SponsorInterestDialog({
  eventId, eventName, tiers, onClose,
}: { eventId: string; eventName: string; tiers: any[]; onClose: () => void }) {
  const [form, setForm] = useState({
    full_name: "", email: "", company: "", role_title: "", phone: "",
    tier_interest: "", message: "",
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sponsorship_interests").insert({
        event_id: eventId,
        event_name: eventName,
        full_name: form.full_name,
        email: form.email,
        company: form.company || null,
        role_title: form.role_title || null,
        phone: form.phone || null,
        tier_interest: form.tier_interest || null,
        message: form.message || null,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Interest received — the IGE team will be in touch."),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {mutation.isSuccess ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-secondary" />
            <h2 className="mt-4 font-display text-2xl font-bold">Thanks — we'll be in touch</h2>
            <p className="mt-2 text-muted-foreground">A member of the IGE team will contact you within 48 hours about sponsoring {eventName}.</p>
            <button onClick={onClose} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Close</button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
            className="space-y-4 p-8"
          >
            <div>
              <h2 className="font-display text-2xl font-bold">Sponsor {eventName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tell us a bit about your brand — IGE will reach out with the deck and next steps.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Your name *"><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={FORM_INPUT} /></Field>
              <Field label="Work email *"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={FORM_INPUT} /></Field>
              <Field label="Company"><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={FORM_INPUT} /></Field>
              <Field label="Role / title"><input value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} className={FORM_INPUT} /></Field>
              <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={FORM_INPUT} /></Field>
              <Field label="Tier of interest">
                {tiers.length > 0 ? (
                  <select
                    value={form.tier_interest}
                    onChange={(e) => setForm({ ...form, tier_interest: e.target.value })}
                    className={FORM_INPUT}
                  >
                    <option value="">Select a tier…</option>
                    {tiers.map((t: any) => (
                      <option key={t.id} value={t.tier_name}>
                        {t.tier_name} — {t.currency} {Number(t.price).toLocaleString()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                    No sponsorship tiers published yet.
                  </p>
                )}
              </Field>
            </div>
            <Field label="Message"><textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={FORM_INPUT} /></Field>
            {mutation.error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                {(mutation.error as Error).message}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {mutation.isPending ? "Sending…" : "Send interest"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
