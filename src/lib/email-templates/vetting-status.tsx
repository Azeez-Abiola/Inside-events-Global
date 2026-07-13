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
  eventName: string;
  statusLabel: string;
  note?: string;
  dashboardUrl: string;
  siteUrl?: string;
}

const VettingStatusEmail = ({ eventName, statusLabel, note, dashboardUrl, siteUrl = "https://www.insideglobalevents.com" }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your event "{eventName}" — {statusLabel}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>Event vetting update</Heading>
        <Text style={text}>
          Your listing <strong>{eventName}</strong> has been updated to: <strong>{statusLabel}</strong>.
        </Text>
        {note ? (
          <Text style={noteBox}>
            <strong>Reviewer note:</strong>
            <br />
            {note}
          </Text>
        ) : null}
        <Text style={text}>Sign in to your organiser dashboard to view details and take next steps.</Text>
        <Button style={button} href={dashboardUrl}>
          Open dashboard
        </Button>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: VettingStatusEmail,
  subject: (d: Record<string, unknown>) =>
    `IGE vetting: ${d.eventName ?? "Your event"} — ${d.statusLabel ?? "update"}`,
  displayName: "Vetting status",
  previewData: {
    eventName: "Africa Tech Summit 2026",
    statusLabel: "Approved",
    note: "Great track record — listing will go live shortly.",
    dashboardUrl: "https://www.insideglobalevents.com/dashboard",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container = { padding: "32px 28px", maxWidth: "560px" };
const h1 = { fontSize: "22px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" };
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", margin: "0 0 16px" };
const noteBox = {
  fontSize: "14px",
  color: "#27272a",
  lineHeight: "1.6",
  margin: "0 0 20px",
  padding: "14px 16px",
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
};
const button = {
  backgroundColor: "#5b21b6",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none",
};
