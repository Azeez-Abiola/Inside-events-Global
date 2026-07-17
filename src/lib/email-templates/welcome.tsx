import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailBrandHeader } from "@/lib/email-templates/email-brand-header";
import { SITE_NAME } from "@/lib/email/config";

type RoleKey =
  | "organiser"
  | "sponsor"
  | "referral_partner"
  | "media_partner"
  | "abw_admin"
  | "super_admin";

interface Props {
  role: RoleKey;
  roleLabel: string;
  name?: string;
  siteUrl: string;
  dashboardUrl: string;
  messagesUrl: string;
  marketplaceUrl: string;
}

const ROLE_COPY: Record<RoleKey, { headline: string; bullets: string[] }> = {
  organiser: {
    headline: "Your organiser workspace is ready",
    bullets: [
      "Create and submit event listings through our guided flow",
      "Track vetting status and sponsor pipeline from your dashboard",
      "Message sponsors directly when commitments come in",
    ],
  },
  sponsor: {
    headline: "Your sponsor workspace is ready",
    bullets: [
      "Browse vetted B2B events on the marketplace",
      "Save shortlists and submit sponsorship commitments",
      "Message organisers to close deals faster",
    ],
  },
  referral_partner: {
    headline: "Your referral partner workspace is ready",
    bullets: [
      "Generate trackable referral links for sponsors and events",
      "Monitor deals and commission pipeline in real time",
      "Get paid when introduced deals reach payment received",
    ],
  },
  media_partner: {
    headline: "Welcome to the IGE media partner programme",
    bullets: [
      "Explore vetted events for cross-promotion opportunities",
      "Submit media partnership requests from your dashboard",
      "Our partnerships team will reach out to tailor your onboarding",
    ],
  },
  abw_admin: {
    headline: "Your IGE admin workspace is ready",
    bullets: [
      "Review event vetting queue and organiser submissions",
      "Monitor revenue, deals, and platform analytics",
      "Manage fraud controls and commission rates",
    ],
  },
  super_admin: {
    headline: "Your super admin workspace is ready",
    bullets: [
      "Full platform oversight across vetting, deals, and revenue",
      "Access admin analytics and operational controls",
      "Support organisers, sponsors, and partners at scale",
    ],
  },
};

function WelcomeEmail({
  role,
  roleLabel,
  name,
  siteUrl,
  dashboardUrl,
  messagesUrl,
  marketplaceUrl,
}: Props) {
  const copy = ROLE_COPY[role] ?? ROLE_COPY.sponsor;
  const firstName = name?.trim().split(/\s+/)[0];
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Welcome to {SITE_NAME} — thanks for joining as a {roleLabel}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
            <Heading style={h1}>{copy.headline}</Heading>
            <Text style={lead}>
              {firstName ? `Hi ${firstName},` : "Hi there,"} thanks for joining{" "}
              <strong>{SITE_NAME}</strong> as a <strong>{roleLabel}</strong>. Your account is
              set up — here&apos;s what you can do next:
            </Text>
          </Section>
          <Section style={card}>
            {copy.bullets.map((b) => (
              <Text key={b} style={bullet}>
                ✓ {b}
              </Text>
            ))}
          </Section>
          <Section style={ctaRow}>
            <Button style={button} href={dashboardUrl}>
              Open your dashboard
            </Button>
          </Section>
          <Text style={text}>
            {role === "sponsor" || role === "organiser" ? (
              <>
                Explore the{" "}
                <Link href={marketplaceUrl} style={link}>
                  marketplace
                </Link>{" "}
                or check{" "}
                <Link href={messagesUrl} style={link}>
                  messages
                </Link>{" "}
                for new conversations.
              </>
            ) : (
              <>
                Visit{" "}
                <Link href={siteUrl} style={link}>
                  {siteUrl.replace(/^https?:\/\//, "")}
                </Link>{" "}
                anytime to pick up where you left off.
              </>
            )}
          </Text>
          <Text style={footer}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: WelcomeEmail,
  subject: (data: { roleLabel?: string; name?: string }) =>
    data.name
      ? `Welcome to IGE, ${data.name.split(/\s+/)[0]} — your ${data.roleLabel ?? "workspace"} is ready`
      : `Welcome to IGE — your ${data.roleLabel ?? "workspace"} is ready`,
  displayName: "Welcome (role-based)",
  previewData: {
    role: "sponsor" as RoleKey,
    roleLabel: "Brand / Sponsor",
    name: "Jane Doe",
    siteUrl: "https://www.insideglobalevents.com",
    dashboardUrl: "https://www.insideglobalevents.com/dashboard",
    messagesUrl: "https://www.insideglobalevents.com/messages",
    marketplaceUrl: "https://www.insideglobalevents.com/marketplace",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#f4f0fa", fontFamily: "Inter, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "24px 16px", maxWidth: "560px" };
const hero = {
  background: "linear-gradient(135deg, #5b2d8e 0%, #7c3aed 55%, #a855f7 100%)",
  borderRadius: "12px 12px 0 0",
  padding: "24px 24px 28px",
};
const h1 = { margin: "0 0 12px", fontSize: "24px", fontWeight: 700, color: "#ffffff", lineHeight: 1.3 };
const lead = { margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.92)", lineHeight: 1.6 };
const card = {
  backgroundColor: "#ffffff",
  padding: "24px",
  borderLeft: "1px solid #e4e4e7",
  borderRight: "1px solid #e4e4e7",
};
const bullet = { margin: "0 0 10px", fontSize: "14px", color: "#3f3f46", lineHeight: 1.5 };
const ctaRow = {
  backgroundColor: "#ffffff",
  padding: "8px 24px 24px",
  borderRadius: "0 0 12px 12px",
  border: "1px solid #e4e4e7",
  borderTop: "none",
};
const button = {
  backgroundColor: "#5b2d8e",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  borderRadius: "8px",
  padding: "12px 24px",
  textDecoration: "none",
};
const text = { fontSize: "13px", color: "#71717a", lineHeight: 1.6, margin: "20px 0 0" };
const link = { color: "#5b2d8e", textDecoration: "underline" };
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "24px 0 0" };
