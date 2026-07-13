import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailBrandHeader } from "@/lib/email-templates/email-brand-header";

interface Props {
  name: string;
  audienceLabel: string;
  signupUrl: string;
  siteUrl?: string;
}

const WaitlistInviteEmail = ({ name, audienceLabel, signupUrl, siteUrl = "https://www.insideglobalevents.com" }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're invited — founding-member access to IGE</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>You're invited to IGE</Heading>
        <Text style={text}>
          Hi {name || "there"},
        </Text>
        <Text style={text}>
          Thanks for joining the IGE founding waitlist as a <strong>{audienceLabel}</strong>. We're opening early access
          for founding members — create your account to explore the platform before public launch.
        </Text>
        <Button style={button} href={signupUrl}>
          Create your account
        </Button>
        <Text style={footer}>
          If you didn't request this, you can ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: WaitlistInviteEmail,
  subject: "You're invited — IGE founding-member access",
  displayName: "Waitlist invite",
  previewData: {
    name: "Jane",
    audienceLabel: "Sponsor",
    signupUrl: "https://www.insideglobalevents.com/signup",
    siteUrl: "https://www.insideglobalevents.com",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#f4f0fa", fontFamily: "Inter, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "32px 28px", maxWidth: "560px" };
const h1 = { fontSize: "22px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" };
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", margin: "0 0 16px" };
const button = {
  backgroundColor: "#5b2d8e",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none",
};
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "24px 0 0" };
