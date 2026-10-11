/**
 * Alert categories a person can switch off per channel (Account Settings →
 * Notifications). Mirrors public.notification_category() for in-app alerts.
 * Account, security and "IGE changed your record" notices are deliberately
 * not here: they always send.
 */
export const NOTIFICATION_CATEGORIES = [
  {
    id: "matches",
    label: "Matches and meetings",
    body: "Approved matches, booking reminders, media coverage introductions.",
  },
  {
    id: "deals",
    label: "Deals and payments",
    body: "Pipeline changes, contracts, payment links, commission.",
  },
  {
    id: "events",
    label: "Events and listings",
    body: "Vetting decisions, listing changes, production reviews.",
  },
  {
    id: "deliverables",
    label: "Deliverables and approvals",
    body: "Overdue approvals and exclusivity conflicts.",
  },
  { id: "messages", label: "Replies from IGE", body: "Replies in Message IGE and to complaints." },
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]["id"];

/** Email templates that belong to a switchable category. */
export const TEMPLATE_CATEGORY: Record<string, NotificationCategory> = {
  "deal-status": "deals",
  "payment-link": "deals",
  "commission-paid": "deals",
  "commitment-received": "deals",
  "vetting-status": "events",
  "event-listed": "events",
  "new-message": "messages",
  "complaint-reply": "messages",
};
