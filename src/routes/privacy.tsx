import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - Inside Global Events 2026" },
      { name: "description", content: "How IGE collects, uses, and protects your data under NDPR and GDPR." },
      { property: "og:title", content: "Privacy Policy - Inside Global Events 2026" },
      { property: "og:description", content: "How IGE collects, uses, and protects your data." },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
      <h1 className="mt-6 text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

      <section className="prose mt-8 space-y-6 text-sm leading-relaxed">
        <p>
          Inside Global Events 2026 ("IGE", "we") is a sponsorship marketplace platform. This policy
          explains how we collect and use personal information when you use insideglobalevents.com.
          We comply with the Nigeria Data Protection Regulation (NDPR) and the EU General Data
          Protection Regulation (GDPR).
        </p>

        <h2 className="text-xl font-semibold">What we collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Account data: name, email, employer, role.</li>
          <li>Event and deal data you submit through the platform.</li>
          <li>Referral attribution: click metadata and conversion records.</li>
          <li>Technical logs: IP address, browser, device - used for security only.</li>
        </ul>
        <p>We never store card numbers or bank details. All payments are tokenised by Stripe or Paystack.</p>

        <h2 className="text-xl font-semibold">How we use it</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Operate the marketplace: list events, route deals, calculate commission.</li>
          <li>Authenticate users and protect accounts from abuse.</li>
          <li>Send transactional notifications related to your deals and referrals.</li>
        </ul>

        <h2 className="text-xl font-semibold">Your rights</h2>
        <p>
          You can request access, correction, or deletion of your personal data at any time.
          Use <strong>Account → Delete account</strong> in your dashboard, or email{" "}
          <a href="mailto:Hi@insideglobalevents.com" className="text-primary hover:underline">
            Hi@insideglobalevents.com
          </a>
          . We anonymise PII on request while retaining deal and referral records for accounting
          (12-month minimum retention).
        </p>

        <h2 className="text-xl font-semibold">Cookies</h2>
        <p>
          We use essential cookies for sign-in and session security. Analytics cookies only fire
          after you accept the cookie banner.
        </p>

        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          Inside Global Events 2026 ·{" "}
          <a href="mailto:Hi@insideglobalevents.com" className="text-primary hover:underline">
            Hi@insideglobalevents.com
          </a>
        </p>
      </section>
    </div>
  );
}
