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

interface Props {
  eventName: string;
  companyName: string;
  contactName?: string;
  isOrganiser?: boolean;
  siteUrl?: string;
}

const CommitmentReceivedEmail = ({
  eventName,
  companyName,
  contactName,
  isOrganiser = false,
  siteUrl = "https://www.insideglobalevents.com",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {isOrganiser
        ? `New sponsor interest in ${eventName}`
        : `Your sponsorship interest in ${eventName}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>
          {isOrganiser ? "New sponsor commitment" : "Commitment received"}
        </Heading>
        {isOrganiser ? (
          <Text style={text}>
            <strong>{companyName}</strong>
            {contactName ? ` (${contactName})` : ""} submitted a sponsorship commitment form for{" "}
            <strong>{eventName}</strong>. IGE will verify the inquiry and update your pipeline.
          </Text>
        ) : (
          <Text style={text}>
            Thanks{contactName ? `, ${contactName}` : ""} — we received your sponsorship commitment for{" "}
            <strong>{eventName}</strong> on behalf of <strong>{companyName}</strong>. The IGE team will
            review your submission and connect you with the organiser within 48 hours.
          </Text>
        )}
        <Text style={text}>
          Sign in to your IGE dashboard to track status and messages.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: CommitmentReceivedEmail,
  subject: (d: Record<string, unknown>) =>
    d.isOrganiser
      ? `New sponsor interest — ${d.eventName ?? "your event"}`
      : `Commitment received — ${d.eventName ?? "IGE event"}`,
  displayName: "Commitment received",
  previewData: {
    eventName: "Africa Tech Summit 2026",
    companyName: "Acme Corp",
    contactName: "Jane Doe",
    isOrganiser: false,
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container = { padding: "32px 28px", maxWidth: "560px" };
const h1 = { fontSize: "22px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" };
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", margin: "0 0 16px" };
