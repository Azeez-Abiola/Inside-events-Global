import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, History, MapPin, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getPastEvents } from "@/lib/public-site.functions";

/**
 * Past Events (TAB 1 §1.5C) — public, no sign-in (confirmed v6.4). An event
 * moves here automatically when its date passes; it stays useful as proof of
 * track record for the next sponsorship cycle.
 */
export const Route = createFileRoute("/past-events")({
  head: () => ({
    meta: [
      { title: "Past Events — Inside Global Events" },
      {
        name: "description",
        content:
          "Events that have run on Inside Global Events — the track record behind the next sponsorship cycle.",
      },
    ],
  }),
  component: PastEventsPage,
});

function PastEventsPage() {
  const fetchPast = useServerFn(getPastEvents);
  const { data, isLoading } = useQuery({ queryKey: ["past-events"], queryFn: () => fetchPast() });
  const events = data?.events ?? [];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary-deep">
          Track record
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Past Events</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Events that have run on Inside Global Events. Live events are in the marketplace for
          signed-in members.
        </p>
        {isLoading ? null : events.length === 0 ? (
          <p className="mt-12 text-muted-foreground">The archive fills as events conclude.</p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <article
                key={e.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
              >
                {e.banner_image_url ? (
                  <img
                    src={e.banner_image_url}
                    alt=""
                    className="h-44 w-full object-cover grayscale-[30%]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-muted">
                    <History className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <span className="self-start rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Concluded · {e.event_type ?? "Event"}
                  </span>
                  <h2 className="mt-3 font-display text-xl font-bold">{e.name}</h2>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {(e.end_date ?? e.start_date) && (
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        {new Date((e.end_date ?? e.start_date)!).toLocaleDateString(undefined, {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    {(e.city || e.country) && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {[e.city, e.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {e.attendance_size != null && (
                      <p className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {e.attendance_size.toLocaleString()} attendees
                      </p>
                    )}
                  </div>
                  <div className="mt-auto pt-5">
                    {e.next_edition_slug ? (
                      <Link
                        to="/events/$slug"
                        params={{ slug: e.next_edition_slug }}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        This event has concluded — view the next edition →
                      </Link>
                    ) : (
                      <Link
                        to="/signup"
                        className="inline-flex rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
                      >
                        Join IGE
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
