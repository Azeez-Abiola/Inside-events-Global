import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Lock, MapPin, Users } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { connectWithLabel } from "@/lib/connect-with";
import { expressShareInterest, getSharedEvent } from "@/lib/share-links.functions";

/**
 * The page behind a private event's share link (TAB 4 §4.4.5).
 *
 * "The link opens a summary page (name, date, location, audience, what the
 *  event is looking for and the sponsorship ask). To see the full details or
 *  to express interest, the viewer signs in or signs up as a Brand / Sponsor,
 *  and the interest goes to Admin like any other match."
 */
export const Route = createFileRoute("/share/$token")({
  head: () => ({
    // A private event: never indexed, whoever forwards the link.
    meta: [{ title: "Shared event - IGE" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: SharedEventPage,
});

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : null;

function SharedEventPage() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const fetchEvent = useServerFn(getSharedEvent);
  const sendInterest = useServerFn(expressShareInterest);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["shared-event", token],
    queryFn: () => fetchEvent({ data: { token } }),
    staleTime: Infinity,
  });
  const ev = data?.event ?? null;
  const here = `/share/${token}`;

  const interest = useMutation({
    mutationFn: () => sendInterest({ data: { token, note: note.trim() || undefined } }),
    onSuccess: () => setSent(true),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        {isLoading ? null : !ev ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="mt-4 font-display text-2xl font-bold">This link is not available</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The owner may have switched it off, or it has expired.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Go to Inside Global Events
            </Link>
          </div>
        ) : (
          <article className="overflow-hidden rounded-2xl border border-border bg-card">
            {ev.banner_image_url && (
              <img src={ev.banner_image_url} alt="" className="h-56 w-full object-cover" />
            )}
            <div className="space-y-6 p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Shared with you · {ev.event_type ?? "Event"}
                </p>
                <h1 className="mt-1 font-display text-3xl font-bold text-foreground">{ev.name}</h1>
                {ev.event_theme && <p className="mt-2 text-muted-foreground">{ev.event_theme}</p>}
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                {ev.start_date && (
                  <p className="flex items-center gap-2 text-foreground">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {fmtDate(ev.start_date)}
                    {ev.end_date && ev.end_date !== ev.start_date && ` – ${fmtDate(ev.end_date)}`}
                  </p>
                )}
                {(ev.city || ev.country) && (
                  <p className="flex items-center gap-2 text-foreground">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {[ev.city, ev.country].filter(Boolean).join(", ")}
                    {ev.format && ` · ${ev.format}`}
                  </p>
                )}
                {ev.attendance_size != null && (
                  <p className="flex items-center gap-2 text-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {ev.attendance_size.toLocaleString()} expected
                  </p>
                )}
              </div>

              {(ev.primary_audience || ev.primary_sector) && (
                <section>
                  <h2 className="text-sm font-semibold text-foreground">Audience</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[ev.primary_audience, ev.primary_sector].filter(Boolean).join(" · ")}
                  </p>
                </section>
              )}

              {ev.looking_to_connect_with.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-foreground">Looking to connect with</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ev.looking_to_connect_with.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-secondary/40 px-2.5 py-0.5 text-xs text-secondary-deep"
                      >
                        {connectWithLabel(t)}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {(ev.tiers.length > 0 || ev.min_sponsorship_spend != null) && (
                <section>
                  <h2 className="text-sm font-semibold text-foreground">The sponsorship ask</h2>
                  {ev.min_sponsorship_spend != null && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      From {ev.currency ?? ""} {ev.min_sponsorship_spend.toLocaleString()}
                    </p>
                  )}
                  {ev.tiers.length > 0 && (
                    <ul className="mt-2 divide-y divide-border rounded-lg border border-border text-sm">
                      {ev.tiers.map((t) => (
                        <li key={t.tier_name} className="flex justify-between px-3 py-2">
                          <span className="text-foreground">{t.tier_name}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {t.price != null
                              ? `${t.currency ?? ev.currency ?? ""} ${t.price.toLocaleString()}`
                              : "On request"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              <section className="rounded-xl border border-border bg-muted/30 p-5">
                {loading ? null : !user ? (
                  <>
                    <h2 className="font-semibold text-foreground">Interested?</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Sign in or join IGE as a Brand / Sponsor to see the full details and express
                      interest. IGE reviews it and, if it fits, sets up the meeting.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild>
                        <Link to="/signup" search={{ role: "sponsor", next: here }}>
                          Join IGE as a Brand / Sponsor
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/login" search={{ redirect: here }}>
                          Sign in
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : sent ? (
                  <p className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    Sent to IGE. The team reviews every interest and will be in touch on your
                    dashboard if it is a fit. You will see their reply in Message IGE.
                  </p>
                ) : (
                  <>
                    <h2 className="font-semibold text-foreground">Express interest</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This goes to the IGE team, not straight to the organiser. If it is a fit, IGE
                      introduces you both and sets up the meeting.
                    </p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="What interests you, and anything IGE should know"
                      className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                    />
                    <Button
                      className="mt-3"
                      disabled={interest.isPending}
                      onClick={() => interest.mutate()}
                    >
                      {interest.isPending ? "Sending…" : "Send my interest to IGE"}
                    </Button>
                  </>
                )}
              </section>
            </div>
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
