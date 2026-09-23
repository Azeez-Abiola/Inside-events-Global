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

interface Props {
  name?: string;
  supportEmail?: string;
  loginUrl?: string;
  siteUrl?: string;
}

function AccountRestoredEmail({
  name,
  supportEmail = "hi@insideglobalevents.com",
  loginUrl = "https://www.insideglobalevents.com/login",
  siteUrl = "https://www.insideglobalevents.com",
}: Props) {
  const firstName = name?.trim().split(/\s+/)[0];
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your IGE account has been restored</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
            <Heading style={h1}>Your account is active again</Heading>
            <Text style={lead}>
              {firstName ? `Hi ${firstName},` : "Hi there,"} your <strong>{SITE_NAME}</strong>{" "}
              account has been reactivated. You can sign in and pick up right where you left off.
            </Text>
          </Section>
          <Section style={card}>
            <Text style={text}>
              Everything on your account is exactly as you left it — your listings, deals and
              messages are all still there. Your password hasn&apos;t changed, so sign in the way
              you normally would.
            </Text>
            <Text style={text}>
              If you have any questions about what happened, reach us at{" "}
              <Link href={`mailto:${supportEmail}`} style={link}>
                {supportEmail}
              </Link>
              .
            </Text>
          </Section>
          <Section style={ctaRow}>
            <Button style={button} href={loginUrl}>
              Sign in to IGE
            </Button>
          </Section>
          <Text style={footer}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: AccountRestoredEmail,
  subject: () => "Your IGE account has been restored",
  displayName: "Account restored",
  previewData: {
    name: "Jane Doe",
    supportEmail: "hi@insideglobalevents.com",
    loginUrl: "https://www.insideglobalevents.com/login",
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
const h1 = {
  margin: "0 0 12px",
  fontSize: "24px",
  fontWeight: 700,
  color: "#ffffff",
  lineHeight: 1.3,
};
const lead = { margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.92)", lineHeight: 1.6 };
const card = {
  backgroundColor: "#ffffff",
  padding: "24px",
  borderLeft: "1px solid #e4e4e7",
  borderRight: "1px solid #e4e4e7",
};
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: 1.6, margin: "0 0 12px" };
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
const link = { color: "#5b2d8e", textDecoration: "underline" };
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "24px 0 0" };
