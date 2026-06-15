export type EventStatusGroup =
  | "all"
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

export function groupEventsByStatus<T extends { status: string }>(events: T[]) {
  const counts: Record<EventStatusGroup, number> = {
    all: events.length,
    draft: 0,
    pending: 0,
    approved: 0,
    live: 0,
    revision: 0,
    rejected: 0,
    past: 0,
  };

  const buckets: Record<Exclude<EventStatusGroup, "all">, T[]> = {
    draft: [],
    pending: [],
    approved: [],
    live: [],
    revision: [],
    rejected: [],
    past: [],
  };

  for (const event of events) {
    for (const [group, meta] of Object.entries(EVENT_STATUS_GROUPS) as [
      Exclude<EventStatusGroup, "all">,
      (typeof EVENT_STATUS_GROUPS)[Exclude<EventStatusGroup, "all">],
    ][]) {
      if (meta.statuses.includes(event.status)) {
        buckets[group].push(event);
        counts[group]++;
        break;
      }
    }
  }

  return { counts, buckets };
}

export function filterEventsByGroup<T extends { status: string }>(
  events: T[],
  group: EventStatusGroup,
): T[] {
  if (group === "all") return events;
  const statuses = EVENT_STATUS_GROUPS[group].statuses;
  return events.filter((e) => statuses.includes(e.status));
}
