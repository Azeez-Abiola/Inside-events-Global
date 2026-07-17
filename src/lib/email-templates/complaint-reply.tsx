import * as React from "react";
import {
  Body,
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

interface Props {
  name?: string;
  originalMessage?: string;
  reply?: string;
  supportEmail?: string;
  siteUrl?: string;
}

function ComplaintReplyEmail({
  name,
  originalMessage,
  reply,
  supportEmail = "hi@insideglobalevents.com",
  siteUrl = "https://www.insideglobalevents.com",
}: Props) {
  const firstName = name?.trim().split(/\s+/)[0];
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>IGE support has responded to your account enquiry</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
            <Heading style={h1}>Response from IGE support</Heading>
            <Text style={lead}>
              {firstName ? `Hi ${firstName},` : "Hi there,"} thank you for contacting us about your account.
              Here is our response:
            </Text>
          </Section>
          <Section style={card}>
            <Text style={replyBox}>{reply ?? ""}</Text>
            {originalMessage ? (
              <>
                <Text style={label}>Your original message</Text>
                <Text style={quote}>{originalMessage}</Text>
              </>
            ) : null}
            <Text style={text}>
              If you have further questions, reply to this email or contact us at{" "}
              <Link href={`mailto:${supportEmail}`} style={link}>
                {supportEmail}
              </Link>
              .
            </Text>
          </Section>
          <Text style={footer}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: ComplaintReplyEmail,
  subject: () => "IGE support — response to your account enquiry",
  displayName: "Complaint reply (to user)",
  previewData: {
    name: "Jane Doe",
    originalMessage: "Why was my account disabled?",
    reply:
      "Thanks for reaching out. Your account was deactivated due to incomplete vetting documentation. Please reply with your latest event prospectus and we can review reactivation.",
    supportEmail: "hi@insideglobalevents.com",
    siteUrl: "https://www.insideglobalevents.com",
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
  borderRadius: "0 0 12px 12px",
  border: "1px solid #e4e4e7",
  borderTop: "none",
};
const replyBox = {
  fontSize: "14px",
  color: "#18181b",
  lineHeight: 1.6,
  margin: "0 0 20px",
  padding: "14px 16px",
  backgroundColor: "#f4f0fa",
  borderRadius: "8px",
  whiteSpace: "pre-wrap" as const,
};
const label = { fontSize: "12px", fontWeight: 600, color: "#71717a", margin: "0 0 6px", textTransform: "uppercase" as const, letterSpacing: "0.04em" };
const quote = {
  fontSize: "13px",
  color: "#71717a",
  lineHeight: 1.5,
  margin: "0 0 16px",
  paddingLeft: "12px",
  borderLeft: "3px solid #e4e4e7",
  whiteSpace: "pre-wrap" as const,
};
const text = { fontSize: "13px", color: "#71717a", lineHeight: 1.6, margin: 0 };
const link = { color: "#5b2d8e", textDecoration: "underline" };
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "24px 0 0" };
