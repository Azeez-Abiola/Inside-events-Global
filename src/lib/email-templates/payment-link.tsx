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
  eventName: string;
  amount: string;
  paymentUrl: string;
  dashboardUrl: string;
}

const PaymentLinkEmail = ({ eventName, amount, paymentUrl, dashboardUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payment link for {eventName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Complete your sponsorship payment</Heading>
        <Text style={text}>
          Your payment link for <strong>{eventName}</strong> is ready.
        </Text>
        <Text style={text}>
          Amount due: <strong>{amount}</strong>
        </Text>
        <Button style={button} href={paymentUrl}>
          Pay now
        </Button>
        <Text style={text}>
          You can also view this deal in your{" "}
          <a href={dashboardUrl} style={link}>
            IGE dashboard
          </a>
          .
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: PaymentLinkEmail,
  subject: (d: Record<string, unknown>) => `Payment link — ${d.eventName ?? "IGE sponsorship"}`,
  displayName: "Payment link",
  previewData: {
    eventName: "Africa Tech Summit 2026",
    amount: "USD 25,000",
    paymentUrl: "https://checkout.stripe.com/example",
    dashboardUrl: "https://www.insideglobalevents.com/dashboard/pipeline",
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
const link = { color: "#6B3FA0", textDecoration: "underline" };
