import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Megaphone,
  Globe2,
  Handshake,
  Newspaper,
  ShieldCheck,
  Crown,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Compass,
  Inbox,
  Bookmark,
  TrendingUp,
  Users,
  DollarSign,
  SlidersHorizontal,
  Send,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { toast } from "sonner";
import { DEMO_PASSWORD, demoLoginSearch } from "@/lib/demo-accounts";

export const Route = createFileRoute("/knowledge-base")({
  head: () => ({
    meta: [
      { title: "IGE Knowledge Base — Dashboard Walkthroughs & Demo Accounts" },
      {
        name: "description",
        content:
          "Explore every IGE workspace: organiser, sponsor, referral partner, media, and admin dashboards. Demo login credentials, feature walkthroughs, and platform guides.",
      },
      { property: "og:title", content: "IGE Knowledge Base — Platform Guide" },
      { property: "og:url", content: "https://www.insideglobalevents.com/knowledge-base" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/knowledge-base" }],
  }),
  component: KnowledgeBasePage,
});

const DEMO_ACCOUNTS = [
  { role: "Event Organiser", email: "organiser@ige.test", icon: Megaphone, color: "from-violet-600 to-purple-500" },
  { role: "Brand / Sponsor", email: "sponsor@ige.test", icon: Globe2, color: "from-indigo-600 to-blue-500" },
  { role: "Referral Partner", email: "partner@ige.test", icon: Handshake, color: "from-emerald-600 to-teal-500" },
  { role: "Media Partner", email: "media@ige.test", icon: Newspaper, color: "from-rose-600 to-pink-500" },
  { role: "IGE Admin", email: "admin@ige.test", icon: ShieldCheck, color: "from-amber-600 to-orange-500" },
  { role: "Super Admin", email: "super@ige.test", icon: Crown, color: "from-slate-700 to-slate-900" },
];

const WORKSPACES = [
  {
    id: "organiser",
    title: "Event Organiser",
    tagline: "List events, pass vetting, close sponsor deals",
    icon: Megaphone,
    gradient: "from-violet-600/90 to-purple-700/90",
    overview:
      "Event organisers use IGE to publish B2B events, build professional sponsorship packs, and connect with verified corporate sponsors. You control your listing, respond to interest, and close deals — IGE only earns commission when money changes hands.",
    whoItsFor:
      "Conference producers, association event teams, festival organisers, corporate marketing teams running flagship B2B events, and agencies managing events on behalf of clients.",
    responsibilities: [
      "Create event listings with accurate audience, pricing, and deliverable data",
      "Submit events for IGE manual vetting before going live on the marketplace",
      "Respond to sponsor commitments and negotiate packages via messages",
      "Manage your sponsor pipeline from first inquiry through to payment received",
      "Maintain event details, tiers, and materials as the event approaches",
    ],
    outcomes: [
      "Live marketplace listing visible to verified sponsors worldwide",
      "Structured sponsor inquiries instead of scattered email threads",
      "Audit-ready deal records for every closed sponsorship",
      "Zero listing fees — pay commission only on successful deals",
    ],
    notFor: "Casual one-off meetups without a sponsorship model, or events that cannot provide verification documents.",
    nav: [
      { icon: LayoutDashboard, label: "My events", desc: "Create drafts, submit for vetting, and manage live listings across draft → pending → approved → live" },
      { icon: TrendingUp, label: "Pipeline", desc: "Track sponsor interest, commitment forms, deal stages, and revenue in one view" },
      { icon: BarChart3, label: "Analytics", desc: "Views, saves, inquiries, and conversion trends per event" },
      { icon: MessageSquare, label: "Messages", desc: "Chat with sponsors who submitted commitments or asked questions" },
    ],
    walkthrough: [
      "Sign up as an Event Organiser and complete your organisation profile.",
      "Create an event via the guided 9-step editor — packages, audience, deliverables, and media.",
      "Submit for IGE vetting. Track status: draft → pending → approved → live.",
      "Respond to sponsor commitments and messages from your pipeline.",
      "Close deals with structured records — invoice, payment, and commission tracked automatically.",
    ],
    features: ["9-step event editor", "Vetting timeline", "Sponsor pipeline", "In-app messaging", "Deal analytics", "Optional ABW-managed sales"],
  },
  {
    id: "sponsor",
    title: "Brand / Sponsor",
    tagline: "Discover vetted events and submit commitments",
    icon: Globe2,
    gradient: "from-indigo-600/90 to-blue-700/90",
    overview:
      "Sponsors use IGE to discover B2B events that match their target audience, sector, and budget — without wading through unvetted directories. Every listing has been manually reviewed. You browse free, message organisers, and pay them directly.",
    whoItsFor:
      "Corporate marketing teams, B2B brands, fintechs, telcos, professional services firms, and agencies buying sponsorship on behalf of clients.",
    responsibilities: [
      "Set your sponsorship profile — sectors, geographies, audience types, and budget range",
      "Browse and filter the marketplace for events that fit your brand goals",
      "Save shortlists and submit structured commitment forms (not just cold emails)",
      "Message organisers to clarify packages, deliverables, and activation details",
      "Pay organisers directly when a deal closes — IGE charges sponsors no platform fee",
    ],
    outcomes: [
      "Curated shortlist of vetted events instead of random inbound pitches",
      "Side-by-side comparison of tiers, audience quality, and ROI signals",
      "Direct organiser access with full conversation history",
      "Audit-ready sponsorship records for finance and compliance teams",
    ],
    notFor: "Brands looking for consumer festival activations without B2B audience alignment, or sponsors who need IGE to custody funds.",
    nav: [
      { icon: LayoutDashboard, label: "Dashboard", desc: "Overview of commitments, saves, and fresh marketplace listings" },
      { icon: Inbox, label: "My commitments", desc: "All submitted sponsorship interest forms and their status" },
      { icon: Bookmark, label: "Saved events", desc: "Your shortlist for internal review and comparison" },
      { icon: Compass, label: "Discover", desc: "New listings matched to your profile preferences" },
      { icon: BarChart3, label: "Analytics", desc: "Engagement trends across saved and committed events" },
    ],
    walkthrough: [
      "Sign up as a Brand / Sponsor and set your sectors, geographies, and budget.",
      "Browse the marketplace — every listing is manually vetted before going live.",
      "Save events to your shortlist and submit commitment forms.",
      "Message organisers directly to negotiate packages.",
      "Pay organisers directly; IGE charges no sponsor platform fee.",
    ],
    features: ["Marketplace filters", "Commitment forms", "Saved shortlists", "Organiser messaging", "Audit-ready deal records", "No sponsor fees"],
  },
  {
    id: "referral",
    title: "Referral Partner",
    tagline: "Introduce sponsors and earn commission",
    icon: Handshake,
    gradient: "from-emerald-600/90 to-teal-700/90",
    overview:
      "Referral partners monetise existing sponsor relationships by introducing brands to vetted IGE events. You generate trackable links, IGE attributes deals automatically, and you earn transparent commission when introductions convert to paid sponsorships.",
    whoItsFor:
      "Consultants, agency brokers, industry connectors, former sponsorship sales professionals, and networkers with genuine corporate sponsor relationships.",
    responsibilities: [
      "Complete your partner profile — network description, sector expertise, and payout currency",
      "Share unique referral links with sponsors or for specific events",
      "Disclose introductions honestly — self-referrals and spam are prohibited",
      "Monitor your commission pipeline and deal attribution dashboard",
      "Support sponsors through the commitment process when needed",
    ],
    outcomes: [
      "Up to 20% of IGE platform commission on every attributed closed deal",
      "End-to-end visibility from link click to payment received",
      "Monthly payouts in your preferred currency after settlement",
      "IGB Partner badge after your first successful conversion",
    ],
    notFor: "Cold outreach lists, affiliate spam, or partners without real sponsor relationships in target sectors.",
    nav: [
      { icon: LayoutDashboard, label: "Dashboard", desc: "Referral performance, active deals, and earnings summary" },
      { icon: Handshake, label: "My referrals", desc: "Generate and manage trackable referral links per event or sponsor" },
      { icon: TrendingUp, label: "Commission pipeline", desc: "Deals attributed to you with stage and payout status" },
      { icon: BarChart3, label: "Analytics", desc: "Conversion rates and earnings trends over time" },
    ],
    walkthrough: [
      "Sign up as a Referral Partner and describe your sponsor network.",
      "Generate unique referral links for events or sponsors.",
      "Deals introduced via your link are attributed automatically.",
      "Monitor commission pipeline — payouts run monthly after payment settles.",
      "Earn up to 20% of IGE's platform commission on closed deals.",
    ],
    features: ["Referral links", "Deal attribution", "Commission pipeline", "Monthly payouts", "Partner analytics", "IGB Partner badge"],
  },
  {
    id: "media",
    title: "Media Partner",
    tagline: "Cross-promote with quality vetted events",
    icon: Newspaper,
    gradient: "from-rose-600/90 to-pink-700/90",
    overview:
      "Media partners — publications, podcasts, newsletters, and broadcast outlets — use IGE to find vetted events worth covering or cross-promoting. Submit partnership requests, coordinate with organisers, and track outcomes from a dedicated workspace.",
    whoItsFor:
      "B2B media outlets, industry newsletters, podcast networks, event media partners, and content platforms seeking co-promotion with verified events.",
    responsibilities: [
      "Explore vetted events that align with your audience and editorial calendar",
      "Submit structured media partnership requests from event pages",
      "Coordinate coverage, interviews, or cross-promotion with organisers via messages",
      "Track request status and saved opportunities from your dashboard",
      "Work with the IGE partnerships team for bespoke onboarding when needed",
    ],
    outcomes: [
      "Access to pre-vetted events — no chasing unverified organiser claims",
      "Structured request workflow instead of ad-hoc DMs",
      "Saved shortlist for editorial planning",
      "Direct organiser messaging for logistics and content coordination",
    ],
    notFor: "Generic press release distribution or outlets that don't produce original audience-facing content.",
    nav: [
      { icon: LayoutDashboard, label: "Dashboard", desc: "Media partnership overview and recent activity" },
      { icon: Compass, label: "Explore", desc: "Browse events open to media partnerships" },
      { icon: Bookmark, label: "Saved", desc: "Events bookmarked for editorial or partnership review" },
      { icon: Send, label: "My requests", desc: "Submitted media partnership requests and their status" },
    ],
    walkthrough: [
      "Sign up as a Media Partner — our team tailors onboarding for your outlet.",
      "Explore vetted events that match your audience.",
      "Submit media partnership requests from event pages.",
      "Coordinate cross-promotion with organisers via messages.",
      "Track request status from your dashboard.",
    ],
    features: ["Event explore", "Partnership requests", "Saved events", "Messaging", "Request tracking", "Partnerships team support"],
  },
  {
    id: "admin",
    title: "IGE Admin & Super Admin",
    tagline: "Vet events, manage deals, and run the platform",
    icon: ShieldCheck,
    gradient: "from-amber-700/90 to-orange-800/90",
    overview:
      "IGE admins operate the platform — reviewing event submissions, managing organiser vetting, monitoring deals and revenue, and maintaining trust controls. Super admins have full access including fraud settings and commission rate management.",
    whoItsFor:
      "Inside Global Events operations team, vetting reviewers, finance staff, and platform owners evaluating the system end-to-end.",
    responsibilities: [
      "Review event vetting queue — verify identity, track record, audience, and pricing",
      "Approve, request revisions, or reject organiser submissions",
      "Monitor all platform submissions and organiser applications",
      "Track revenue, deals, referral commission, and payout status",
      "Manage fraud signals, commission rates, and platform controls (super admin)",
    ],
    outcomes: [
      "Only verified events reach the public marketplace",
      "Full visibility into deal flow and platform revenue",
      "Operational analytics across users, events, and conversions",
      "Fraud prevention and quality enforcement at scale",
    ],
    notFor: "External organisers or sponsors — admin accounts are for IGE staff only.",
    nav: [
      { icon: ShieldCheck, label: "Event queue", desc: "Review and approve organiser submissions with vetting notes" },
      { icon: Users, label: "Submissions", desc: "All platform intake, organiser applications, and document review" },
      { icon: DollarSign, label: "Revenue & deals", desc: "Commission tracking, invoices, and deal status across the platform" },
      { icon: SlidersHorizontal, label: "Fraud & rates", desc: "Platform controls, commission settings, and fraud flag management" },
      { icon: BarChart3, label: "Analytics", desc: "Platform-wide metrics — events, users, deals, and trends" },
    ],
    walkthrough: [
      "Sign in with an admin demo account to access the operations workspace.",
      "Review events in the vetting queue — approve, request revisions, or reject.",
      "Monitor submissions and organiser verification documents.",
      "Track revenue, deals, and referral commission across the platform.",
      "Super admins have full oversight including fraud controls and rate management.",
    ],
    features: ["Vetting queue", "Submission review", "Revenue dashboard", "Fraud controls", "Platform analytics", "Rate management"],
  },
];

function DemoSignInButton({ email }: { email: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/login", search: demoLoginSearch(email) })}
      className="relative z-10 mt-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-brand-soft hover:text-primary-deep transition-colors"
    >
      Sign in <ArrowRight className="h-3 w-3" />
    </button>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(label ? `${label} copied` : "Copied");
        setTimeout(() => setCopied(false), 2000);
      }}
      className="relative z-10 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function KnowledgeBasePage() {
  const [active, setActive] = useState("organiser");
  const workspace = WORKSPACES.find((w) => w.id === active)!;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-brand-gradient-diag text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Sparkles className="h-4 w-4" />
            Platform guide for owners &amp; evaluators
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            IGE Knowledge Base
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            Everything you need to understand IGE workspaces — dashboard walkthroughs, role features,
            and demo accounts to explore the platform hands-on.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-primary-deep shadow-soft hover:-translate-y-0.5 transition-transform"
            >
              Sign in to explore <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* Demo credentials */}
        <section className="rounded-2xl border border-border bg-card p-8 shadow-soft md:p-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">Demo accounts</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Use these test accounts to walk through every role. All share the same password.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-brand-soft px-4 py-2.5">
              <span className="text-sm font-medium text-muted-foreground">Password:</span>
              <code className="font-mono text-sm font-bold text-primary-deep">{DEMO_PASSWORD}</code>
              <CopyButton text={DEMO_PASSWORD} label="Password" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEMO_ACCOUNTS.map((a) => (
              <div
                key={a.email}
                className="group relative overflow-hidden rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/40 hover:shadow-soft"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${a.color} opacity-0 transition-opacity group-hover:opacity-5`} />
                <div className="relative z-10 flex items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${a.color} text-white`}>
                    <a.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground">{a.role}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="truncate font-mono text-xs text-muted-foreground">{a.email}</code>
                      <CopyButton text={a.email} label="Email" />
                    </div>
                    <DemoSignInButton email={a.email} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workspace explorer */}
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Dashboard walkthroughs</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Select a role to see its navigation, features, and step-by-step getting started guide.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {WORKSPACES.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setActive(w.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  active === w.id
                    ? "border-primary bg-brand-soft text-primary-deep shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <w.icon className="h-4 w-4" />
                {w.title}
              </button>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className={`bg-gradient-to-r ${workspace.gradient} px-8 py-10 text-white`}>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <workspace.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-bold">{workspace.title}</h3>
                  <p className="text-white/85">{workspace.tagline}</p>
                </div>
              </div>
              <p className="mt-6 max-w-3xl text-sm leading-relaxed text-white/90">{workspace.overview}</p>
            </div>

            <div className="grid gap-0 border-b border-border lg:grid-cols-2">
              <div className="border-b border-border p-8 lg:border-b-0 lg:border-r">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Who this role is for</h4>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{workspace.whoItsFor}</p>
                <h4 className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">What you do on IGE</h4>
                <ul className="mt-3 space-y-2">
                  {workspace.responsibilities.map((r) => (
                    <li key={r} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">What success looks like</h4>
                <ul className="mt-3 space-y-2">
                  {workspace.outcomes.map((o) => (
                    <li key={o} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {o}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">Not the right fit if…</p>
                  <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">{workspace.notFor}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-2">
              <div className="border-b border-border p-8 lg:border-b-0 lg:border-r">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Navigation</h4>
                <ul className="mt-4 space-y-4">
                  {workspace.nav.map((n) => (
                    <li key={n.label} className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                        <n.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-semibold text-foreground">{n.label}</div>
                        <div className="text-sm text-muted-foreground">{n.desc}</div>
                      </div>
                    </li>
                  ))}
                  <li className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                      <MessageSquare className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-semibold text-foreground">Messages</div>
                      <div className="text-sm text-muted-foreground">
                        Real-time chat with in-app and email notifications
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="p-8">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Getting started</h4>
                <ol className="mt-4 space-y-3">
                  {workspace.walkthrough.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-primary-deep">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap gap-2">
                  {workspace.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Role comparison at a glance */}
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Roles at a glance</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Quick comparison of what each role does on IGE and how they interact.
          </p>
          <div className="mt-8 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Primary job on IGE</th>
                  <th className="px-4 py-3 font-semibold">Pays fees?</th>
                  <th className="px-4 py-3 font-semibold">Demo account</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Event Organiser", "Lists events, closes sponsor deals", "Commission on closed deals only", "organiser@ige.test"],
                  ["Brand / Sponsor", "Discovers and sponsors vetted events", "No platform fee", "sponsor@ige.test"],
                  ["Referral Partner", "Introduces sponsors, earns commission", "N/A — earns commission", "partner@ige.test"],
                  ["Media Partner", "Cross-promotes with vetted events", "N/A", "media@ige.test"],
                  ["IGE Admin", "Vets events, runs platform ops", "Staff only", "admin@ige.test"],
                  ["Super Admin", "Full platform oversight", "Staff only", "super@ige.test"],
                ].map(([role, job, fees, email]) => (
                  <tr key={role} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{role}</td>
                    <td className="px-4 py-3 text-muted-foreground">{job}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fees}</td>
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs">{email}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            All demo accounts use password <code className="font-mono font-semibold">{DEMO_PASSWORD}</code>
          </p>
        </section>

        {/* Platform-wide features */}
        <section className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Unified signup wizard",
              desc: "Role → Account → Profile in one tailored flow. Welcome emails sent automatically based on role.",
            },
            {
              title: "Real-time messaging",
              desc: "In-app toast notifications and email alerts when someone sends you a message.",
            },
            {
              title: "Vetted marketplace",
              desc: "Every event passes manual review. Sponsors browse with confidence; organisers get qualified leads.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-2xl border border-primary/20 bg-brand-soft/40 p-8 text-center md:p-12">
          <h2 className="font-display text-2xl font-bold">Ready to explore?</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Pick a demo account above, sign in with the shared password, and walk through the dashboard for that role.
          </p>
          <Link
            to="/login"
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            Go to sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
