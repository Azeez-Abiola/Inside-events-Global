import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { getPublicEventBySlug, submitCommitmentForm, getCurrentRates } from "@/lib/marketplace.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Calendar, MapPin, Users, ShieldCheck, Globe, CheckCircle2, AlertCircle, CalendarPlus, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fmtDual } from "@/lib/currency";
import { z } from "zod";

const searchSchema = z.object({ ref: z.string().max(20).optional() });

export const Route = createFileRoute("/events/$slug")({
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
  const fetchEvent = useServerFn(getPublicEventBySlug);
  const fetchRates = useServerFn(getCurrentRates);

  const { data, isLoading } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: () => fetchEvent({ data: { slug } }),
  });
  const { data: ratesData } = useQuery({ queryKey: ["fx-rates"], queryFn: () => fetchRates() });
  const rates = ratesData?.rates;

  const [showForm, setShowForm] = useState(false);
  const [showSponsor, setShowSponsor] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-6 py-24 text-center text-muted-foreground">Loading event…</div>
      </div>
    );
  }

  const event = data?.event;
  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl font-bold">Event not found</h1>
          <p className="mt-2 text-muted-foreground">This event may have been unlisted.</p>
          <Link to="/marketplace" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {event.banner_image_url && (
        <div className="relative h-72 w-full overflow-hidden bg-muted">
          <img src={event.banner_image_url} alt={event.name} className="h-full w-full object-cover" />
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 py-10">
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
                    <button
                      type="button"
                      onClick={() => { setSelectedTier(t.id); setShowForm(true); }}
                      className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Express interest
                    </button>
                  </div>
                ))}
                {!data?.tiers?.length && (
                  <p className="text-sm text-muted-foreground">No packages published yet - contact the organiser directly.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Get involved</div>
              <button
                type="button"
                onClick={() => { setSelectedTier(null); setShowSponsor(true); }}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-transform"
              >
                <Sparkles className="h-4 w-4" /> Sponsor this event
              </button>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-2 w-full rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Submit a Commitment Form
              </button>
              <p className="mt-2 text-xs text-muted-foreground">Commitment forms are verified by IGE before reaching the organiser.</p>
              {search.ref && (
                <div className="mt-3 rounded-md bg-secondary/10 px-3 py-2 text-xs text-secondary-deep">
                  Attributed to partner: <span className="font-mono">{search.ref}</span>
                </div>
              )}
            </div>
            {event.sponsorship_deck_url && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Sponsorship deck</div>
                <a
                  href={event.sponsorship_deck_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
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
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
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
        </div>
      </main>

      {showSponsor && (
        <SponsorInterestDialog
          eventId={event.id}
          eventName={event.name}
          onClose={() => setShowSponsor(false)}
        />
      )}

      {showForm && (
        <CommitmentDialog
          eventId={event.id}
          eventCurrency={event.currency ?? "USD"}
          tierId={selectedTier}
          refCode={search.ref ?? null}
          onClose={() => setShowForm(false)}
        />
      )}

      <SiteFooter />
    </div>
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
                <input required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="input" />
              </Field>
              <Field label="Your title">
                <input value={form.contact_title} onChange={(e) => setForm({ ...form, contact_title: e.target.value })} className="input" />
              </Field>
              <Field label="Company name *">
                <input required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="input" />
              </Field>
              <Field label="Company LinkedIn URL *">
                <input required type="url" placeholder="https://linkedin.com/company/…" value={form.company_linkedin_url} onChange={(e) => setForm({ ...form, company_linkedin_url: e.target.value })} className="input" />
              </Field>
              <Field label="Currency *">
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="NGN">NGN</option>
                </select>
              </Field>
              <Field label="Partnership type">
                <select value={form.partnership_type} onChange={(e) => setForm({ ...form, partnership_type: e.target.value })} className="input">
                  <option value="cash">Cash</option>
                  <option value="in_kind">In-kind</option>
                  <option value="co_creation">Co-creation</option>
                  <option value="jv">Joint venture</option>
                </select>
              </Field>
              <Field label="Budget min">
                <input type="number" min={0} value={form.budget_range_min} onChange={(e) => setForm({ ...form, budget_range_min: e.target.value })} className="input" />
              </Field>
              <Field label="Budget max">
                <input type="number" min={0} value={form.budget_range_max} onChange={(e) => setForm({ ...form, budget_range_max: e.target.value })} className="input" />
              </Field>
            </div>

            <Field label="Expected ROI / objectives">
              <textarea rows={3} value={form.expected_roi} onChange={(e) => setForm({ ...form, expected_roi: e.target.value })} className="input" />
            </Field>
            <Field label="Custom requirements">
              <textarea rows={3} value={form.custom_requirements} onChange={(e) => setForm({ ...form, custom_requirements: e.target.value })} className="input" />
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
      <style>{`.input{display:block;width:100%;border-radius:.375rem;border:1px solid hsl(var(--border,0 0% 90%));background:transparent;padding:.5rem .75rem;font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--primary,221 83% 53%))}`}</style>
    </div>
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
