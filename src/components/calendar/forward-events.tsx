import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Loader2, MapPin, Sparkles, Users } from "lucide-react";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { expressCoCreationInterest, getForwardEvents } from "@/lib/calendar.functions";
import { ONBOARDING_SECTORS, ONBOARDING_COUNTRIES } from "@/lib/onboarding-constants";
import { connectWithLabel } from "@/lib/connect-with";

/**
 * The Forward Events Calendar (TAB 4 §4.4.1).
 *
 * "Any published event, and any planned event the owner flags as Open to early
 *  co-creation, appears on the Forward Events Calendar that Brand / Sponsor
 *  accounts see, filtered by sector, market, audience and budget window. It
 *  shows the event summary only, never the owner's contact details."
 *
 * So there is no way to reach the owner from this screen. "Co-create this
 * event" raises an interest with Admin and tells the viewer exactly that, so
 * nobody sits waiting for a reply that was never going to come directly.
 */
export function ForwardEvents() {
  const fetchForward = useServerFn(getForwardEvents);
  const express = useServerFn(expressCoCreationInterest);

  const [sector, setSector] = useState("");
  const [country, setCountry] = useState("");
  const [budgetOnly, setBudgetOnly] = useState(false);
  const [raising, setRaising] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [raised, setRaised] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["forward-events", sector, country, budgetOnly],
    queryFn: () =>
      fetchForward({
        data: {
          sector: sector || undefined,
          country: country || undefined,
          in_budget_window_only: budgetOnly || undefined,
        },
      }),
  });

  const interest = useMutation({
    mutationFn: (eventId: string) =>
      express({ data: { event_id: eventId, message: message.trim() || undefined } }),
    onSuccess: (res, eventId) => {
      setRaised((s) => new Set(s).add(eventId));
      setRaising(null);
      setMessage("");
      toast.success(
        res.alreadyRaised
          ? "You have already asked about this one — IGE is on it."
          : "Sent to IGE. They will review it and set up the meeting if it is a fit.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const events = data?.events ?? [];

  return (
    <DashboardPanel
      title="Forward events"
      description="Events being planned months ahead — come in early, before the packages are fixed."
      bodyClassName="p-0"
    >
      <div className="flex flex-wrap items-end gap-3 border-b border-border/60 px-5 py-4">
        <label className="min-w-[160px] flex-1">
          <span className="mb-1 block text-xs font-medium text-foreground">Sector</span>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">All sectors</option>
            {ONBOARDING_SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[160px] flex-1">
          <span className="mb-1 block text-xs font-medium text-foreground">Market</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">All markets</option>
            {ONBOARDING_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {data?.hasBudgetWindows && (
          <label className="inline-flex cursor-pointer items-center gap-2 pb-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={budgetOnly}
              onChange={(e) => setBudgetOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-input accent-[hsl(var(--primary))]"
            />
            Only in my budget windows
          </label>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          No forward events match that. Organisers flag events for early co-creation as they plan
          them, so this fills up over time.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {events.map((e) => (
            <li key={e.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{e.name}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
                      {e.planning_status}
                    </span>
                    {e.in_budget_window && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-primary-deep">
                        <Sparkles className="h-3 w-3" /> In your budget window
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {e.start_date && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(e.start_date).toLocaleDateString()}
                      </span>
                    )}
                    {(e.city || e.country) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[e.city, e.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {e.attendance_size && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {Number(e.attendance_size).toLocaleString()}
                      </span>
                    )}
                    {e.primary_sector && <span>{e.primary_sector}</span>}
                  </p>
                  {e.looking_to_connect_with?.length ? (
                    <p className="mt-1.5 flex flex-wrap gap-1">
                      {e.looking_to_connect_with.map((w) => (
                        <span
                          key={w}
                          className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent"
                        >
                          {connectWithLabel(w)}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
                {raised.has(e.id) ? (
                  <span className="shrink-0 text-xs text-muted-foreground">With IGE</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setRaising(raising === e.id ? null : e.id)}
                  >
                    Co-create this event
                  </Button>
                )}
              </div>

              {raising === e.id && (
                <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    This goes to IGE, not the organiser. If it is a fit, IGE introduces you both and
                    sets up the meeting.
                  </p>
                  <textarea
                    value={message}
                    onChange={(ev) => setMessage(ev.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="What would you want to do with this event?"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      disabled={interest.isPending}
                      onClick={() => interest.mutate(e.id)}
                    >
                      {interest.isPending ? "Sending…" : "Send to IGE"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRaising(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
