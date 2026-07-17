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
  email?: string;
  temporaryPassword?: string;
  loginUrl?: string;
  siteUrl?: string;
}

function AdminInviteEmail({
  name,
  email,
  temporaryPassword,
  loginUrl = "https://www.insideglobalevents.com/login",
  siteUrl = "https://www.insideglobalevents.com",
}: Props) {
  const firstName = name?.trim().split(/\s+/)[0];
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your IGE admin workspace access</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
            <Heading style={h1}>Admin access granted</Heading>
            <Text style={lead}>
              {firstName ? `Hi ${firstName},` : "Hi there,"} you&apos;ve been invited to help manage{" "}
              <strong>{SITE_NAME}</strong> as a platform administrator.
            </Text>
          </Section>
          <Section style={card}>
            <Text style={text}>
              <strong>Email:</strong> {email}
            </Text>
            <Text style={text}>
              <strong>Temporary password:</strong>
            </Text>
            <Text style={passwordBox}>{temporaryPassword}</Text>
            <Text style={hint}>
              Sign in and change your password from your profile after your first login. Sub-admin access
              is limited to operational tasks — sensitive controls remain with the super admin.
            </Text>
          </Section>
          <Section style={ctaRow}>
            <Button style={button} href={loginUrl}>
              Sign in to admin dashboard
            </Button>
          </Section>
          <Text style={footer}>
            If you did not expect this invitation, contact{" "}
            <Link href="mailto:hi@insideglobalevents.com" style={link}>
              hi@insideglobalevents.com
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: AdminInviteEmail,
  subject: () => "Your IGE admin account is ready",
  displayName: "Admin invite",
  previewData: {
    name: "Jane Doe",
    email: "jane@insideglobalevents.com",
    temporaryPassword: "Xk9!mNp2qRs4vW",
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
const h1 = { margin: "0 0 12px", fontSize: "24px", fontWeight: 700, color: "#ffffff", lineHeight: 1.3 };
const lead = { margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.92)", lineHeight: 1.6 };
const card = {
  backgroundColor: "#ffffff",
  padding: "24px",
  borderLeft: "1px solid #e4e4e7",
  borderRight: "1px solid #e4e4e7",
};
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: 1.6, margin: "0 0 10px" };
const passwordBox = {
  fontFamily: "monospace",
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "#5b2d8e",
  backgroundColor: "#f4f0fa",
  padding: "12px 16px",
  borderRadius: "8px",
  margin: "0 0 16px",
};
const hint = { fontSize: "13px", color: "#71717a", lineHeight: 1.6, margin: 0 };
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
