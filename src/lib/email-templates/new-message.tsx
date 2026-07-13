import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailBrandHeader } from "@/lib/email-templates/email-brand-header";
import { SITE_NAME } from "@/lib/email/config";

interface Props {
  senderName: string;
  preview: string;
  threadUrl: string;
  siteUrl?: string;
}

function NewMessageEmail({ senderName, preview, threadUrl, siteUrl = "https://www.insideglobalevents.com" }: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New message from {senderName} on IGE</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
            <Heading style={h1}>New message</Heading>
            <Text style={lead}>
              <strong>{senderName}</strong> sent you a message on {SITE_NAME}.
            </Text>
          </Section>
          <Section style={card}>
            <Text style={quote}>&ldquo;{preview}&rdquo;</Text>
          </Section>
          <Section style={ctaRow}>
            <Button style={button} href={threadUrl}>
              Reply in IGE
            </Button>
          </Section>
          <Text style={footer}>
            You&apos;re receiving this because you have an active IGE account. Manage notifications
            from your dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: NewMessageEmail,
  subject: (data: { senderName?: string }) =>
    `New message from ${data.senderName ?? "someone"} on IGE`,
  displayName: "New chat message",
  previewData: {
    senderName: "Acme Events",
    preview: "Hi — we'd love to discuss a title sponsorship for your Q3 conference.",
    threadUrl: "https://www.insideglobalevents.com/messages?thread=00000000-0000-0000-0000-000000000001",
    siteUrl: "https://www.insideglobalevents.com",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#f4f0fa", fontFamily: "Inter, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "24px 16px", maxWidth: "560px" };
const hero = {
  background: "linear-gradient(135deg, #5b2d8e 0%, #7c3aed 100%)",
  borderRadius: "12px 12px 0 0",
  padding: "24px",
};
const h1 = { margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: "#fff" };
const lead = { margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.9)", lineHeight: 1.5 };
const card = {
  backgroundColor: "#fff",
  padding: "20px 24px",
  borderLeft: "1px solid #e4e4e7",
  borderRight: "1px solid #e4e4e7",
};
const quote = {
  margin: 0,
  fontSize: "15px",
  color: "#3f3f46",
  lineHeight: 1.6,
  fontStyle: "italic",
};
const ctaRow = {
  backgroundColor: "#fff",
  padding: "8px 24px 24px",
  borderRadius: "0 0 12px 12px",
  border: "1px solid #e4e4e7",
  borderTop: "none",
};
const button = {
  backgroundColor: "#5b2d8e",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 600,
  borderRadius: "8px",
  padding: "12px 24px",
  textDecoration: "none",
};
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "20px 0 0" };
