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

interface Props {
  name: string;
  eventName: string;
  amount: string;
  currency: string;
  dashboardUrl: string;
}

const CommissionPaidEmail = ({ name, eventName, amount, currency, dashboardUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your IGE referral commission has been paid</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Commission paid</Heading>
        <Text style={text}>Hi {name},</Text>
        <Text style={text}>
          Your referral commission for <strong>{eventName}</strong> has been marked as paid.
        </Text>
        <Text style={highlight}>
          {currency} {amount}
        </Text>
        <Button style={button} href={dashboardUrl}>
          View commission tracker
        </Button>
        <Text style={text}>
          Payouts are processed per your referral partner agreement. Contact IGE finance if you have questions.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: CommissionPaidEmail,
  subject: (d: Record<string, unknown>) => `Commission paid — ${d.eventName ?? "IGE referral deal"}`,
  displayName: "Commission paid",
  previewData: {
    name: "Jane",
    eventName: "Africa Tech Summit 2026",
    amount: "1,750",
    currency: "USD",
    dashboardUrl: "https://www.insideglobalevents.com/dashboard/commissions",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container = { padding: "32px 28px", maxWidth: "560px" };
const h1 = { fontSize: "22px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 20px" };
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", margin: "0 0 16px" };
const highlight = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#5b21b6",
  margin: "0 0 20px",
};
const button = {
  backgroundColor: "#5b21b6",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none",
};
