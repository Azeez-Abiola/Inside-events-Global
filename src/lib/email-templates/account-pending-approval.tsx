import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailBrandHeader } from "@/lib/email-templates/email-brand-header";
import { IGE_SUPPORT_EMAIL } from "@/lib/support-email";

interface Props {
  name?: string;
  siteUrl?: string;
}

const AccountPendingApprovalEmail = ({ name, siteUrl = "https://www.insideglobalevents.com" }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your IGE account is pending approval</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>Thanks for signing up{name ? `, ${name}` : ""}</Heading>
        <Text style={text}>
          Your profile is complete. An IGE admin will review your account shortly — you'll receive an
          email when your dashboard access is approved.
        </Text>
        <Text style={text}>
          Questions? Contact us at {IGE_SUPPORT_EMAIL}.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: AccountPendingApprovalEmail,
  subject: () => "Your IGE account is pending approval",
  displayName: "Account pending approval",
  previewData: { name: "Jane" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container = { padding: "32px 28px", maxWidth: "560px" };
const h1 = { fontSize: "22px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" };
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", margin: "0 0 16px" };
