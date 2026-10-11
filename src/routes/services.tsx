import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Mail } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

/**
 * IGE Services (TAB 1 §1.11A, v6.3). Every way IGE and AlexBoyo World earn
 * money, presented as a service to ask about. No prices or fee ranges are
 * shown anywhere (TAB 11).
 */
export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "IGE Services — Inside Global Events" },
      {
        name: "description",
        content:
          "Sponsorship matching, ABW Consulting for strategy, planning, execution and management, Co-Creation, ROI reporting, media coverage and masterclasses. Request a meeting.",
      },
    ],
  }),
  component: ServicesPage,
});

const HI_EMAIL = "hi@insideglobalevents.com";

const SERVICES = [
  {
    id: "Sponsorship matching and deal support",
    body: "IGE matches events and productions with sponsors and partners and sets up the meetings. Commission only on a sponsorship IGE sourced, once paid.",
  },
  {
    id: "ABW Consulting: strategy",
    body: "Sponsorship and partnership strategy, market entry strategy, brand partnership positioning.",
  },
  {
    id: "ABW Consulting: planning",
    body: "Event and sponsorship planning, sponsorship decks and proposals, packaging and pricing sponsorship tiers, budget planning.",
  },
  {
    id: "ABW Consulting: execution",
    body: "Sponsor sourcing and outreach, negotiation and closing, activation planning and delivery, on-site partnership management.",
  },
  {
    id: "ABW Consulting: management",
    body: "Ongoing partnership and sponsor relationship management, a fractional partnerships team, reporting and renewals.",
  },
  {
    id: "Co-Creation",
    body: "Brand-Readiness Audit, supported event repackaging, and Full Managed Service co-production.",
  },
  {
    id: "ROI measurement and reporting",
    body: "Investment Reports, Business Cases and post-event evaluation built on global sponsorship measurement standards.",
  },
  {
    id: "Media and documentary coverage",
    body: "IGE media team coverage, content packages and documentary segments.",
  },
  {
    id: "Webinars and masterclasses",
    body: "Events as Growth Engines webinars and masterclasses, free and paid.",
  },
  {
    id: "Intelligence Reports",
    body: "Market intelligence and benchmark reports for brands and agencies.",
  },
  {
    id: "Premium features (from May 2027)",
    body: "Selected advanced platform features, announced before any charge applies.",
  },
];

const ENGAGEMENTS = ["Monthly retainer", "One-off fee", "Annual fee", "Not sure yet"];

const input =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring";

function ServicesPage() {
  const [picked, setPicked] = useState<string[]>([]);
  const [f, setF] = useState({
    name: "",
    email: "",
    linkedin: "",
    phone: "",
    company: "",
    engagement: "Not sure yet",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!picked.length) return toast.error("Tick at least one service you are interested in.");
    setBusy(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "ige_services",
          name: f.name,
          email: f.email,
          company: f.company,
          phone: f.phone,
          linkedin_url: f.linkedin,
          services: picked,
          engagement: f.engagement,
          subject:
            `Meeting request: ${picked.slice(0, 2).join(", ")}${picked.length > 2 ? "…" : ""}`.slice(
              0,
              150,
            ),
          message: f.message,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Could not send your request.");
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary-deep">
          IGE Services
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
          How we can work with you
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          IGE is free to use until May 2027. These are the services IGE and AlexBoyo World offer on
          top. Tick what interests you and request a meeting — scope and fees are agreed with you
          directly.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
          <ul className="grid gap-3 sm:grid-cols-2">
            {SERVICES.map((s) => {
              const on = picked.includes(s.id);
              return (
                <li key={s.id}>
                  <label
                    className={`flex h-full cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${on ? "border-primary bg-brand-soft" : "border-border bg-card hover:border-primary/40"}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setPicked(on ? picked.filter((x) => x !== s.id) : [...picked, s.id])
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-foreground">{s.id}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{s.body}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
            {done ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-secondary" />
                <p className="mt-3 font-semibold">Request received</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The IGE team will be in touch to set up a meeting.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <h2 className="font-display text-xl font-bold">Request a meeting</h2>
                <p className="text-xs text-muted-foreground">
                  {picked.length} service{picked.length === 1 ? "" : "s"} ticked
                </p>
                <input
                  required
                  placeholder="Full name"
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                  className={input}
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  className={input}
                />
                <input
                  type="url"
                  placeholder="LinkedIn profile URL"
                  value={f.linkedin}
                  onChange={(e) => setF({ ...f, linkedin: e.target.value })}
                  className={input}
                />
                <input
                  type="tel"
                  placeholder="Phone (WhatsApp preferred)"
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                  className={input}
                />
                <input
                  placeholder="Organisation"
                  value={f.company}
                  onChange={(e) => setF({ ...f, company: e.target.value })}
                  className={input}
                />
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Preferred engagement</span>
                  <select
                    value={f.engagement}
                    onChange={(e) => setF({ ...f, engagement: e.target.value })}
                    className={input}
                  >
                    {ENGAGEMENTS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <textarea
                  rows={3}
                  placeholder="Anything we should know"
                  value={f.message}
                  onChange={(e) => setF({ ...f, message: e.target.value })}
                  className={input}
                />
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-brand-gradient text-white"
                >
                  {busy ? "Sending…" : "Request a meeting"}
                </Button>
              </form>
            )}
            <a
              href={`mailto:${HI_EMAIL}?subject=IGE%20Services`}
              className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Mail className="h-4 w-4" /> To see more, email IGE
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
