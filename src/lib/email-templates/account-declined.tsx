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
import { IGE_SUPPORT_EMAIL } from "@/lib/support-email";

interface Props {
  name?: string;
  reason?: string;
  supportEmail?: string;
  siteUrl?: string;
}

function AccountDeclinedEmail({
  name,
  reason,
  supportEmail = IGE_SUPPORT_EMAIL,
  siteUrl = "https://www.insideglobalevents.com",
}: Props) {
  const firstName = name?.trim().split(/\s+/)[0];
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Update on your IGE account application</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
            <Heading style={h1}>Application update</Heading>
            <Text style={lead}>
              {firstName ? `Hi ${firstName},` : "Hi there,"} thank you for your interest in{" "}
              <strong>{SITE_NAME}</strong>. After reviewing your signup, we are unable to approve
              your account at this time.
            </Text>
          </Section>
          <Section style={card}>
            <Text style={text}>
              <strong>Reviewer note:</strong>
            </Text>
            <Text style={reasonBox}>{reason ?? "Our team needs more information before we can proceed."}</Text>
            <Text style={text}>
              If you have questions, contact us at{" "}
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
  component: AccountDeclinedEmail,
  subject: () => "Update on your IGE account application",
  displayName: "Account declined",
  previewData: {
    name: "Jane Doe",
    reason: "We need more detail on your organisation and past event sponsorships before we can proceed.",
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
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: 1.6, margin: "0 0 12px" };
const reasonBox = {
  fontSize: "14px",
  color: "#18181b",
  lineHeight: 1.6,
  margin: "0 0 16px",
  padding: "12px 14px",
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  border: "1px solid #fecaca",
};
const link = { color: "#5b2d8e", textDecoration: "underline" };
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "24px 0 0" };
