import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap")({
  head: () => ({
    meta: [
      { title: "QA Sitemap — IGE" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SitemapPage,
});

type RouteLink = {
  path: string;
  label: string;
  note?: string;
  params?: Record<string, string>;
};

type Section = { title: string; routes: RouteLink[] };

const sections: Section[] = [
  {
    title: "Public",
    routes: [
      { path: "/", label: "Home" },
      { path: "/welcome", label: "Welcome / Featured events" },
      { path: "/about", label: "About" },
      { path: "/how-it-works", label: "How it works" },
      { path: "/marketplace", label: "Marketplace" },
      { path: "/sponsors", label: "Sponsors" },
      { path: "/organisers", label: "Organisers" },
      { path: "/partners", label: "Partners" },
      { path: "/pricing", label: "Pricing" },
      { path: "/trust-vetting", label: "Trust & Vetting" },
      { path: "/faq", label: "FAQ" },
      { path: "/contact", label: "Contact" },
      { path: "/waitlist", label: "Waitlist" },
      { path: "/privacy", label: "Privacy" },
      { path: "/terms", label: "Terms" },
      { path: "/unsubscribe", label: "Unsubscribe" },
    ],
  },
  {
    title: "Auth",
    routes: [
      { path: "/login", label: "Login" },
      { path: "/signup", label: "Signup" },
      { path: "/forgot-password", label: "Forgot password" },
      { path: "/reset-password", label: "Reset password" },
      { path: "/onboarding", label: "Onboarding" },
      { path: "/onboarding/profile", label: "Onboarding · profile" },
    ],
  },
  {
    title: "Authenticated app",
    routes: [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/events", label: "My events" },
      { path: "/events/$id", label: "Event detail", params: { id: "demo" }, note: "uses :id = demo" },
      { path: "/pipeline", label: "Pipeline" },
      { path: "/deals", label: "Deals" },
      { path: "/referrals", label: "Referrals" },
      { path: "/messages", label: "Messages" },
      { path: "/settings", label: "Settings" },
    ],
  },
  {
    title: "Admin",
    routes: [
      { path: "/admin/vetting", label: "Vetting queue" },
      { path: "/admin/revenue", label: "Revenue" },
      { path: "/admin/submissions", label: "Submissions" },
    ],
  },
  {
    title: "Dynamic / utility",
    routes: [
      { path: "/events/$slug", label: "Public event page", params: { slug: "itsekiri-homecoming-2026" } },
      { path: "/r/$code", label: "Referral redirect", params: { code: "demo" } },
      { path: "/sitemap.xml", label: "sitemap.xml (SEO)", note: "external link" },
      { path: "/robots.txt", label: "robots.txt", note: "external link" },
    ],
  },
];

function SitemapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">QA Sitemap</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Internal navigator — every route in the app, grouped for testing. Not indexed.
          </p>
        </header>

        <div className="grid gap-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h2>
              <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                {section.routes.map((r) => (
                  <li key={r.path} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-medium">{r.label}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {r.path}
                        {r.note ? ` — ${r.note}` : ""}
                      </div>
                    </div>
                    {r.path.startsWith("/sitemap.xml") || r.path.startsWith("/robots.txt") ? (
                      <a
                        href={r.path}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                      >
                        Open ↗
                      </a>
                    ) : (
                      <Link
                        to={r.path as never}
                        params={r.params as never}
                        className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                      >
                        Open →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Tip: authenticated routes redirect to /login if you're signed out.
        </p>
      </div>
    </div>
  );
}
