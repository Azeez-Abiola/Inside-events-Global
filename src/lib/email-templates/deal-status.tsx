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
  eventName: string;
  statusLabel: string;
  previousStatus?: string | null;
  note?: string;
  dashboardUrl: string;
  siteUrl?: string;
}

const DealStatusEmail = ({ name, eventName, statusLabel, previousStatus, note, dashboardUrl, siteUrl = "https://www.insideglobalevents.com" }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Deal update: {eventName} — {statusLabel}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>Deal status update</Heading>
        <Text style={text}>Hi {name},</Text>
        <Text style={text}>
          Your sponsorship deal for <strong>{eventName}</strong> has moved to:{" "}
          <strong>{statusLabel}</strong>
          {previousStatus ? ` (from ${previousStatus})` : ""}.
        </Text>
        {note ? (
          <Text style={noteBox}>
            <strong>Note from IGE:</strong>
            <br />
            {note}
          </Text>
        ) : null}
        <Button style={button} href={dashboardUrl}>
          View deal pipeline
        </Button>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: DealStatusEmail,
  subject: (d: Record<string, unknown>) =>
    `Deal update: ${d.eventName ?? "Your event"} — ${d.statusLabel ?? "status change"}`,
  displayName: "Deal status",
  previewData: {
    name: "Jane",
    eventName: "Africa Tech Summit 2026",
    statusLabel: "Contract signed",
    previousStatus: "Negotiation",
    dashboardUrl: "https://www.insideglobalevents.com/dashboard/pipeline",
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
