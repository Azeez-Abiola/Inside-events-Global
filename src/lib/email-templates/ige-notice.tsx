import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailBrandHeader } from "@/lib/email-templates/email-brand-header";

/**
 * A plain IGE notice: heading, a few lines, one button. Used for the TAB 18
 * §18.5 match notifications (Match Approved, Meeting Booked, Meeting Not Yet
 * Booked) so each does not need its own near-identical template.
 */
interface Props {
  subject: string;
  heading: string;
  lines: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  siteUrl?: string;
}

function IgeNoticeEmail({
  heading,
  lines,
  ctaLabel,
  ctaUrl,
  siteUrl = "https://www.insideglobalevents.com",
}: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{lines[0] ?? heading}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
            <Heading style={h1}>{heading}</Heading>
          </Section>
          <Section style={card}>
            {lines.map((l, i) => (
              <Text key={i} style={line}>
                {l}
              </Text>
            ))}
          </Section>
          {ctaLabel && ctaUrl && (
            <Section style={ctaRow}>
              <Button style={button} href={ctaUrl}>
                {ctaLabel}
              </Button>
            </Section>
          )}
          <Text style={footer}>
            You&apos;re receiving this because you have an active IGE account. Manage notifications
            from your dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: IgeNoticeEmail,
  subject: (data: { subject?: string }) => data.subject ?? "An update from Inside Global Events",
  displayName: "IGE notice (match notifications)",
  previewData: {
    subject: "Admin has approved a match for you",
    heading: "Admin has approved a match for you",
    lines: [
      "Hi Ada, a Fintech brand sponsor budgeting $25K–$100K has been approved as a match for you by our team.",
      "Here is why: Sector: Fintech · Event type: Conference.",
      "Use the link below to book a short introductory call at a time that works for you.",
    ],
    ctaLabel: "Book Your Introductory Meeting",
    ctaUrl: "https://www.insideglobalevents.com/dashboard/matches",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#f4f0fa", fontFamily: "Inter, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "24px 16px", maxWidth: "560px" };
const hero = {
  background: "linear-gradient(135deg, #5b2d8e 0%, #7c3aed 100%)",
  borderRadius: "12px 12px 0 0",
  padding: "24px",
};
const h1 = { margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: "#fff" };
const line = { margin: "0 0 10px", fontSize: "15px", color: "#3f3f46", lineHeight: 1.6 };
const card = {
  backgroundColor: "#fff",
  padding: "20px 24px",
  borderLeft: "1px solid #e4e4e7",
  borderRight: "1px solid #e4e4e7",
};
const ctaRow = {
  backgroundColor: "#fff",
  padding: "8px 24px 24px",
  borderRadius: "0 0 12px 12px",
  border: "1px solid #e4e4e7",
  borderTop: "none",
};
const button = {
  backgroundColor: "#5b2d8e",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 600,
  borderRadius: "8px",
  padding: "12px 24px",
  textDecoration: "none",
};
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "20px 0 0" };
