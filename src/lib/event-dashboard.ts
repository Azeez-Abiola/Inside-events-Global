export type EventStatusGroup =
  | "all"
  | "private"
  | "draft"
  | "pending"
  | "approved"
  | "live"
  | "revision"
  | "rejected"
  | "past";

export const EVENT_STATUS_GROUPS: Record<
  Exclude<EventStatusGroup, "all">,
  { label: string; statuses: string[]; description: string }
> = {
  // A private event never enters vetting, so it is grouped by visibility
  // rather than status (TAB 3 §3.6.1 Section B). This entry comes first so it
  // wins over the "draft" status a private event would otherwise fall into.
  private: {
    label: "Private",
    statuses: [],
    description: "Workspace only — not on the marketplace and not vetted.",
  },
  draft: {
    label: "Drafts",
    statuses: ["draft"],
    description: "Events you are still building.",
  },
  pending: {
    label: "Pending vetting",
    statuses: ["submitted", "under_review"],
    description: "Submitted to IGE and awaiting admin review.",
  },
  approved: {
    label: "Approved",
    statuses: ["approved"],
    description: "IGE vetted — awaiting public listing on the marketplace.",
  },
  live: {
    label: "Live",
    statuses: ["listed"],
    description: "Public on the marketplace and open to sponsors.",
  },
  revision: {
    label: "Revision requested",
    statuses: ["revision_requested"],
    description: "Sent back for updates before resubmission.",
  },
  rejected: {
    label: "Rejected",
    statuses: ["rejected"],
    description: "Not approved for listing.",
  },
  past: {
    label: "Closed",
    statuses: ["closed", "archived"],
    description: "Past or archived events.",
  },
};

/** A private event is grouped by visibility; everything else by status. */
type GroupableEvent = { status: string; visibility?: string | null };

function groupFor(event: GroupableEvent): Exclude<EventStatusGroup, "all"> | null {
  if (event.visibility === "private") return "private";
  for (const [group, meta] of Object.entries(EVENT_STATUS_GROUPS) as [
    Exclude<EventStatusGroup, "all">,
    (typeof EVENT_STATUS_GROUPS)[Exclude<EventStatusGroup, "all">],
  ][]) {
    if (meta.statuses.includes(event.status)) return group;
  }
  return null;
}

export function groupEventsByStatus<T extends GroupableEvent>(events: T[]) {
  const counts: Record<EventStatusGroup, number> = {
    all: events.length,
    private: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    live: 0,
    revision: 0,
    rejected: 0,
    past: 0,
  };

  const buckets: Record<Exclude<EventStatusGroup, "all">, T[]> = {
    private: [],
    draft: [],
    pending: [],
    approved: [],
    live: [],
    revision: [],
    rejected: [],
    past: [],
  };

  for (const event of events) {
    const group = groupFor(event);
    if (!group) continue;
    buckets[group].push(event);
    counts[group]++;
  }

  return { counts, buckets };
}

export function filterEventsByGroup<T extends GroupableEvent>(
  events: T[],
  group: EventStatusGroup,
): T[] {
  if (group === "all") return events;
  return events.filter((e) => groupFor(e) === group);
}
