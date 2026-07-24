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
  name?: string;
  dashboardUrl: string;
  siteUrl?: string;
}

const AccountApprovedEmail = ({
  name,
  dashboardUrl,
  siteUrl = "https://www.insideglobalevents.com",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your IGE account has been approved</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>You're approved{name ? `, ${name}` : ""}</Heading>
        <Text style={text}>
          Your IGE account has been approved. Sign in to access your dashboard, marketplace tools, and
          workspace features.
        </Text>
        <Button style={button} href={dashboardUrl}>
          Open dashboard
        </Button>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: AccountApprovedEmail,
  subject: () => "Your IGE account has been approved",
  displayName: "Account approved",
  previewData: {
    name: "Jane",
    dashboardUrl: "https://www.insideglobalevents.com/dashboard",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container = { padding: "32px 28px", maxWidth: "560px" };
const h1 = { fontSize: "22px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" };
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", margin: "0 0 16px" };
const button = {
  backgroundColor: "#5b21b6",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none",
};
