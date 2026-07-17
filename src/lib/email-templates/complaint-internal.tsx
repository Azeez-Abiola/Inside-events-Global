import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailBrandHeader } from "@/lib/email-templates/email-brand-header";

interface Props {
  name?: string;
  email?: string;
  role?: string;
  roleLabel?: string;
  message?: string;
  siteUrl?: string;
}

const ROLE_LABELS: Record<string, string> = {
  organiser: "Event Organiser",
  sponsor: "Brand / Sponsor",
  referral_partner: "Referral Partner",
  media_partner: "Media Partner",
};

const ComplaintInternalEmail = ({
  name,
  email,
  role,
  roleLabel,
  message,
  siteUrl = "https://www.insideglobalevents.com",
}: Props) => {
  const label = roleLabel ?? (role ? ROLE_LABELS[role] : undefined) ?? role ?? "—";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Account complaint from {name ?? email ?? "a user"}</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailBrandHeader siteUrl={siteUrl} />
          <Heading style={h1}>New account complaint</Heading>
          <Text style={kv}>
            <b>Name:</b> {name ?? "—"}
          </Text>
          <Text style={kv}>
            <b>Email:</b> {email ?? "—"}
          </Text>
          <Text style={kv}>
            <b>Role:</b> {label}
          </Text>
          <Hr style={hr} />
          <Text style={body}>{message ?? "(no message)"}</Text>
          <Text style={hint}>
            Review in the admin dashboard under Contact → Complaints, or reply directly to{" "}
            <Link href={`mailto:${email}`} style={link}>
              {email}
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ComplaintInternalEmail,
  subject: (d: Record<string, unknown>) =>
    `Account complaint — ${d.name ?? d.email ?? "IGE user"}`,
  displayName: "Account complaint — internal",
  previewData: {
    name: "Jane Doe",
    email: "jane@brand.com",
    role: "organiser",
    roleLabel: "Event Organiser",
    message: "I believe my account was deactivated in error. I would like to appeal this decision.",
    siteUrl: "https://www.insideglobalevents.com",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#f4f0fa", fontFamily: "Inter, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "32px 28px", maxWidth: "560px" };
const h1 = { fontSize: "20px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 18px" };
const kv = { fontSize: "14px", color: "#27272a", margin: "0 0 6px" };
const body = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", whiteSpace: "pre-wrap" as const };
const hint = { fontSize: "13px", color: "#71717a", lineHeight: 1.5, marginTop: "16px" };
const hr = { borderColor: "#e4e4e7", margin: "16px 0" };
const link = { color: "#5b2d8e", textDecoration: "underline" };
