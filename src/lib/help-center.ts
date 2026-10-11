/**
 * Help Center content (TAB 17 §17.3–17.4), shared by the public FAQ page and
 * the Live Chat assistant so both always say the same thing. No prices or
 * fee percentages for IGE's own services appear here (TAB 11); the referral
 * tier range is the partner's earning, as published in TAB 17 §17.4.
 */
export type HelpArticle = {
  id: string;
  category: HelpCategory;
  q: string;
  a: string;
  keywords: string[];
  link?: { label: string; to: string };
};
export type HelpCategory =
  | "Organisers"
  | "Sponsors"
  | "Referral Partners"
  | "Partnerships Pro & Creative Hub"
  | "Account and Sign In"
  | "Platform Basics";

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "readiness-score",
    category: "Organisers",
    q: "How is my Brand-Readiness Score calculated?",
    a: "Across six dimensions: audience clarity, attendance proof, sponsor ROI history, commercialisation readiness, experience quality, and organiser credibility. Your Coaching Feed shows exactly what to fix.",
    keywords: ["readiness", "score", "coach", "coaching", "dimensions"],
    link: { label: "Open Brand-Readiness Coach", to: "/dashboard/readiness" },
  },
  {
    id: "vetting-time",
    category: "Organisers",
    q: "How long does vetting take?",
    a: "Most events get a decision within three to five business days.",
    keywords: ["vetting", "vet", "approval", "approved", "review", "how long", "decision"],
  },
  {
    id: "multiple-events",
    category: "Organisers",
    q: "Can I list more than one event?",
    a: "Yes. Use the Multi-Event View on your Command Center; each event gets its own Fundraising Tracker.",
    keywords: ["more than one", "multiple", "several events", "another event", "second event"],
  },
  {
    id: "funding-gap",
    category: "Organisers",
    q: "What happens if my funding gap doesn't close before the event date?",
    a: "Your Command Center flags it early with pace indicators. You can also email Admin for execution support or a recourse recommendation at any time, or ask about the Managed Service pathway if you would rather AlexBoyo World take the process over entirely.",
    keywords: ["funding", "gap", "not enough", "sponsors", "fundraising", "short"],
    link: { label: "Open Fundraising Tracker", to: "/dashboard/fundraising" },
  },
  {
    id: "private-event",
    category: "Organisers",
    q: "Can I use IGE for a private event that is not looking for sponsors?",
    a: "Yes. Create the event as Private. You get the calendar, tasks, activation tracker, CRM and reports, and the event never appears on the marketplace. You can publish it later if you want sponsors or media partners.",
    keywords: ["private", "not looking", "hidden", "internal", "no sponsors"],
  },
  {
    id: "approval-dashboard",
    category: "Organisers",
    q: "Do I need approval before I can use my dashboard?",
    a: "No. Complete the compulsory onboarding sections and you are in. Admin only reviews an event when you publish it to the marketplace.",
    keywords: ["approval", "dashboard", "access", "locked", "onboarding", "wait"],
  },
  {
    id: "roi-vs-roo",
    category: "Sponsors",
    q: "What's the difference between the IGE ROI Score and the ROO breakdown?",
    a: "The ROI Score is one composite number for quick comparison. The ROO breakdown shows return against each objective you actually weighted — that is the number to bring to your CFO.",
    keywords: ["roi", "roo", "score", "return", "objective", "cfo", "investment report"],
    link: { label: "Open Sponsorship ROI", to: "/dashboard/roi" },
  },
  {
    id: "multi-market",
    category: "Sponsors",
    q: "Can I manage more than one country's budget?",
    a: "Yes. Set up a Market Budget per country; they roll up into one Portfolio View automatically.",
    keywords: ["budget", "country", "market", "countries", "portfolio"],
  },
  {
    id: "benchmarks",
    category: "Sponsors",
    q: "How is the fair market value benchmark sourced?",
    a: "Every benchmark is labelled — Industry Reference, Industry Reference plus Early IGE Data, or IGE Platform Benchmark — so you always know how mature the data is.",
    keywords: ["benchmark", "fair market", "fmv", "source", "industry reference"],
  },
  {
    id: "billing",
    category: "Sponsors",
    q: "Do I ever get billed for using the platform?",
    a: "Not before May 2027. Listing and planning events, browsing the marketplace, receiving matches and using the daily tools are free. A commission is only charged on a sponsorship IGE sourced, once it is signed and the sponsor has paid. From May 2027 some premium features may be paid; core use stays free.",
    keywords: [
      "billed",
      "bill",
      "pay",
      "cost",
      "price",
      "pricing",
      "free",
      "fee",
      "fees",
      "charge",
      "commission",
    ],
  },
  {
    id: "talk-before-match",
    category: "Sponsors",
    q: "Can I talk to the organiser directly before Admin approves a match?",
    a: "No. All matching is reviewed by Admin first, and you are notified with meeting details once a match is approved. This is by design, so every match is reviewed for genuine fit before either side spends time on it.",
    keywords: [
      "talk",
      "contact",
      "message",
      "organiser directly",
      "reach out",
      "chat with",
      "email the",
      "phone number",
    ],
    link: { label: "See your matches", to: "/dashboard/matches" },
  },
  {
    id: "referral-commission",
    category: "Referral Partners",
    q: "How much commission do I earn?",
    a: "3 to 15 percent, based on your tier (Connector, Champion, Partner) and the deal, paid out of IGE's commission once the sponsor's payment is received.",
    keywords: ["referral", "commission", "earn", "tier", "connector", "champion"],
  },
  {
    id: "referral-payout",
    category: "Referral Partners",
    q: "When do I get paid?",
    a: "On confirmed payment receipt from the sponsor, via the Payout Queue. See your Earnings tab for status.",
    keywords: ["paid", "payout", "earnings", "when", "payment"],
  },
  {
    id: "import-contacts",
    category: "Partnerships Pro & Creative Hub",
    q: "Can I import my existing contacts?",
    a: "Yes. Upload a CSV or Excel file from Contacts, or add contacts one by one. Your contacts stay private to your workspace.",
    keywords: ["import", "contacts", "csv", "excel", "upload contacts"],
    link: { label: "Open Contacts", to: "/dashboard/crm" },
  },
  {
    id: "brands-contact-production",
    category: "Partnerships Pro & Creative Hub",
    q: "Can brands contact me directly about my production?",
    a: "No. Brands express interest through IGE, and Admin introduces you once the match is approved, with details to book a meeting.",
    keywords: ["production", "brands contact", "creative", "placement", "directly"],
  },
  {
    id: "forgot-password",
    category: "Account and Sign In",
    q: "I forgot my password.",
    a: 'Use "Forgot password?" on the sign in screen and we will email you a reset link valid for 60 minutes.',
    keywords: ["forgot", "password", "reset", "can't sign in", "cannot log in", "locked out"],
    link: { label: "Reset password", to: "/forgot-password" },
  },
  {
    id: "signed-out",
    category: "Account and Sign In",
    q: "Why was I signed out?",
    a: "For your security, every IGE session ends 24 hours after you sign in. Sign in again to continue; anything you were typing is saved as a draft.",
    keywords: ["signed out", "logged out", "session", "kicked out", "expired"],
  },
  {
    id: "info-icon",
    category: "Platform Basics",
    q: 'What does the small "i" next to a field mean?',
    a: "Tap or hover over it to see what that section or field means and why we ask for it.",
    keywords: ["i icon", "info", "what does", "field mean", "tooltip"],
  },
];

const STOP = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "i",
  "my",
  "me",
  "to",
  "of",
  "do",
  "does",
  "can",
  "how",
  "what",
  "why",
  "when",
  "for",
  "on",
  "in",
  "it",
  "and",
  "or",
  "with",
  "you",
  "your",
  "we",
  "be",
  "this",
  "that",
  "there",
]);

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));

/**
 * Rules-based answer lookup for Live Chat (TAB 17 §17.2): keyword phrases
 * score highest, then word overlap with the question. Returns null when
 * nothing is a confident match, so the chat offers a human instead of
 * guessing.
 */
export function findHelpAnswer(message: string): HelpArticle | null {
  const text = ` ${message.toLowerCase()} `;
  const msgWords = new Set(words(message));
  let best: { a: HelpArticle; score: number } | null = null;
  for (const a of HELP_ARTICLES) {
    let score = 0;
    for (const k of a.keywords) {
      if (k.includes(" ") ? text.includes(k) : msgWords.has(k)) score += k.includes(" ") ? 3 : 2;
    }
    for (const w of words(a.q)) if (msgWords.has(w)) score += 1;
    if (!best || score > best.score) best = { a, score };
  }
  return best && best.score >= 2 ? best.a : null;
}

/** Phrases that mean "let me talk to a person". */
export function wantsHuman(message: string): boolean {
  return /\b(human|person|agent|someone|real people|support team|talk to (ige|support|you)|speak to|call me)\b/i.test(
    message,
  );
}
