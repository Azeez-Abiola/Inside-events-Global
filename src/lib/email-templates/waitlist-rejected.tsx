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
  name: string;
  audienceLabel: string;
  note: string;
  siteUrl?: string;
}

const WaitlistRejectedEmail = ({
  name,
  audienceLabel,
  note,
  siteUrl = "https://www.insideglobalevents.com",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Update on your IGE waitlist application</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>Waitlist application update</Heading>
        <Text style={text}>Hi {name || "there"},</Text>
        <Text style={text}>
          Thank you for your interest in joining IGE as a <strong>{audienceLabel}</strong>. After reviewing your
          application, we are unable to approve it at this time.
        </Text>
        <Text style={noteBox}>
          <strong>Reviewer note:</strong>
          <br />
          {note}
        </Text>
        <Text style={footer}>
          If you have questions, reply to this email and our team will get back to you.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: WaitlistRejectedEmail,
  subject: "Update on your IGE waitlist application",
  displayName: "Waitlist rejected",
  previewData: {
    name: "Jane",
    audienceLabel: "Event organiser",
    note: "We need more detail on past event attendance and sponsorship tiers before we can proceed.",
    siteUrl: "https://www.insideglobalevents.com",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#f4f0fa", fontFamily: "Inter, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "32px 28px", maxWidth: "560px" };
const h1 = { fontSize: "22px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" };
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", margin: "0 0 16px" };
const noteBox = {
  fontSize: "14px",
  color: "#27272a",
  lineHeight: "1.6",
  margin: "0 0 20px",
  padding: "14px 16px",
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  border: "1px solid #fecaca",
};
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "24px 0 0" };
