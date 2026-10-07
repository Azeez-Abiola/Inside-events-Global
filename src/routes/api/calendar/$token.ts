import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * ICS feed for one-way sync to Google Calendar and Outlook (TAB 4 §4.4.1).
 *
 * Both subscribe to a URL and poll it, so a feed is the whole mechanism —
 * there is no write path back, which matches "syncs one way".
 *
 * The token in the URL is the only credential, because a calendar client
 * cannot carry a session. That makes it a bearer secret: it is per workspace,
 * random, and rotatable, and the feed deliberately carries titles and dates
 * only. Anyone holding the URL can read it, so nothing sensitive goes in.
 */

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function toIcsDate(value: string, allDay: boolean): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  if (allDay) return d.toISOString().slice(0, 10).replace(/-/g, "");
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** RFC 5545 caps lines at 75 octets; longer ones are folded with a leading space. */
function fold(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 72) {
    parts.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  if (rest) parts.push(" " + rest);
  return parts.join("\r\n");
}

export const Route = createFileRoute("/api/calendar/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token?.replace(/\.ics$/i, "");
        if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
          return new Response("Not found", { status: 404 });
        }

        const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return new Response("Server not configured", { status: 500 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = createClient(url, key) as any;

        const { data: workspace } = await db
          .from("workspaces")
          .select("id, name")
          .eq("calendar_feed_token", token)
          .maybeSingle();
        // Same answer for a wrong token as for a missing one, so the endpoint
        // cannot be used to confirm that a token is valid.
        if (!workspace) return new Response("Not found", { status: 404 });

        const { data: members } = await db
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", workspace.id)
          .eq("status", "active");
        const memberIds = ((members ?? []) as { user_id: string | null }[])
          .map((m) => m.user_id)
          .filter((id): id is string => !!id);

        const [entries, events] = await Promise.all([
          db
            .from("calendar_entries")
            .select("id, title, entry_type, starts_at, ends_at, all_day, notes")
            .eq("workspace_id", workspace.id),
          memberIds.length
            ? db
                .from("events")
                .select("id, name, start_date, end_date, planning_status")
                .in("organiser_id", memberIds)
                .not("start_date", "is", null)
            : Promise.resolve({ data: [] }),
        ]);

        const lines: string[] = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Inside Global Events//IGE Calendar//EN",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          fold(`X-WR-CALNAME:${icsEscape(workspace.name)} — IGE`),
        ];

        const stamp = new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\.\d{3}/, "");

        for (const e of (events.data ?? []) as Record<string, string | null>[]) {
          const start = toIcsDate(e.start_date!, true);
          if (!start) continue;
          lines.push(
            "BEGIN:VEVENT",
            `UID:ige-event-${e.id}@insideglobalevents.com`,
            `DTSTAMP:${stamp}`,
            `DTSTART;VALUE=DATE:${start}`,
            fold(`SUMMARY:${icsEscape(e.name ?? "Untitled event")}`),
            fold(`DESCRIPTION:${icsEscape(`Planning status: ${e.planning_status ?? "planning"}`)}`),
            "END:VEVENT",
          );
        }

        for (const c of (entries.data ?? []) as Record<string, string | boolean | null>[]) {
          const allDay = (c.all_day as boolean) ?? true;
          const start = toIcsDate(c.starts_at as string, allDay);
          if (!start) continue;
          lines.push(
            "BEGIN:VEVENT",
            `UID:ige-entry-${c.id}@insideglobalevents.com`,
            `DTSTAMP:${stamp}`,
            allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
            fold(`SUMMARY:${icsEscape(String(c.title ?? "Untitled"))}`),
            ...(c.notes ? [fold(`DESCRIPTION:${icsEscape(String(c.notes))}`)] : []),
            fold(`CATEGORIES:${icsEscape(String(c.entry_type ?? "other"))}`),
            "END:VEVENT",
          );
        }

        lines.push("END:VCALENDAR");

        return new Response(lines.join("\r\n"), {
          headers: {
            "content-type": "text/calendar; charset=utf-8",
            // Calendar clients poll; a short cache keeps them from hammering it
            // without making an edit take long to show up.
            "cache-control": "public, max-age=900",
            "content-disposition": 'inline; filename="ige-calendar.ics"',
          },
        });
      },
    },
  },
});
