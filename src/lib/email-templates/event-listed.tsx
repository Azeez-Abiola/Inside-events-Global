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
  eventLocation?: string;
  eventDate?: string;
  eventUrl: string;
  siteUrl?: string;
}

const EventListedEmail = ({
  eventName,
  eventLocation,
  eventDate,
  eventUrl,
  siteUrl = "https://www.insideglobalevents.com",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New on IGE: {eventName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>New vetted event on IGE</Heading>
        <Text style={text}>
          <strong>{eventName}</strong> is now live on the Inside Global Events marketplace.
        </Text>
        {eventLocation ? <Text style={text}>Location: {eventLocation}</Text> : null}
        {eventDate ? <Text style={text}>Date: {eventDate}</Text> : null}
        <Text style={text}>Browse the listing and explore sponsorship opportunities on IGE.</Text>
        <Button style={button} href={eventUrl}>
          View event
        </Button>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: EventListedEmail,
  subject: (d: Record<string, unknown>) => `New event on IGE: ${d.eventName ?? "Vetted listing"}`,
  displayName: "Event listed",
  previewData: {
    eventName: "Africa Tech Summit 2026",
    eventLocation: "Lagos, Nigeria",
    eventDate: "15 September 2026",
    eventUrl: "https://www.insideglobalevents.com/events/africa-tech-summit-2026",
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
