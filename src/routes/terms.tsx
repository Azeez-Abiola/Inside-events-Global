import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Inside Global Events" },
      { name: "description", content: "Terms governing use of the IGE sponsorship marketplace." },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
      <h1 className="mt-6 text-4xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed">
        <p>
          By using Inside Global Events you agree to these terms. IGE is a sponsorship
          marketplace operated by AlexBoyo World.
        </p>

        <h2 className="text-xl font-semibold">Listings &amp; vetting</h2>
        <p>
          Organisers submit events for review. IGE may approve, request revisions, or reject
          any listing at its discretion. Approval does not constitute an endorsement of the
          event organiser.
        </p>

        <h2 className="text-xl font-semibold">Commission</h2>
        <p>
          When a deal reaches <em>payment received</em>, IGE charges a platform commission on
          the deal value. Referral partner commission is paid out of the IGE commission and is
          never an additional charge to the organiser. Current rates are published in the
          admin commission configuration and may change with notice.
        </p>

        <h2 className="text-xl font-semibold">Payments</h2>
        <p>
          Organisers connect their own Stripe or Paystack account (bring-your-own-key). IGE
          does not hold sponsor funds. Disputes and refunds are handled directly between
          organiser and sponsor through the payment provider.
        </p>

        <h2 className="text-xl font-semibold">Acceptable use</h2>
        <p>
          No fraudulent referrals, no self-referrals using affiliated entities, no scraping,
          no spam. Violations result in account suspension and forfeiture of pending commission.
        </p>

        <h2 className="text-xl font-semibold">Liability</h2>
        <p>
          The platform is provided "as is". IGE is not liable for losses arising from event
          cancellations, sponsor non-performance, or third-party payment provider outages.
        </p>

        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          AlexBoyo World ·{" "}
          <a href="mailto:partner@alexboyoworld.com" className="text-primary hover:underline">
            partner@alexboyoworld.com
          </a>
        </p>
      </section>
    </div>
  );
}
