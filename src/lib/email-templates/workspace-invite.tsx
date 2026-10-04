import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailBrandHeader } from "@/lib/email-templates/email-brand-header";
import { SITE_NAME } from "@/lib/email/config";

interface Props {
  workspaceName?: string;
  inviterName?: string;
  roleLabel?: string;
  roleDescription?: string;
  /** True when the person already has an IGE account — no sign-up needed. */
  hasAccount?: boolean;
  actionUrl?: string;
  siteUrl?: string;
}

/**
 * Invited onto a workspace team (TAB 4 §4.3).
 *
 * Says what the seat actually lets them do, because the roles are not
 * self-explanatory — Manager in particular is read-only oversight, and
 * someone arriving expecting edit rights would otherwise be confused.
 */
function WorkspaceInviteEmail({
  workspaceName,
  inviterName,
  roleLabel,
  roleDescription,
  hasAccount,
  actionUrl = "https://www.insideglobalevents.com/login",
  siteUrl = "https://www.insideglobalevents.com",
}: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {inviterName ? `${inviterName} added you to ` : "You've been added to "}
        {workspaceName ?? "a workspace"} on {SITE_NAME}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
            <Heading style={h1}>You&apos;re on the team</Heading>
            <Text style={lead}>
              {inviterName ? <strong>{inviterName}</strong> : "Someone"} added you to{" "}
              <strong>{workspaceName ?? "their workspace"}</strong> on {SITE_NAME}.
            </Text>
          </Section>
          <Section style={card}>
            <Text style={text}>
              <strong>Your seat:</strong> {roleLabel ?? "Team member"}
            </Text>
            {roleDescription ? <Text style={hint}>{roleDescription}</Text> : null}
            <Text style={{ ...text, marginTop: "16px" }}>
              {hasAccount
                ? "Sign in and you'll find the workspace in your account menu — use the workspace switcher to move between it and your own."
                : "Create your account with this email address and the workspace will be waiting for you."}
            </Text>
          </Section>
          <Section style={ctaRow}>
            <Button style={button} href={actionUrl}>
              {hasAccount ? "Sign in" : "Create my account"}
            </Button>
          </Section>
          <Text style={footer}>
            Not expecting this? Ignore this email, or tell us at{" "}
            <Link href="mailto:hi@insideglobalevents.com" style={link}>
              hi@insideglobalevents.com
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: WorkspaceInviteEmail,
  subject: (data: Record<string, unknown>) =>
    data?.workspaceName
      ? `You've been added to ${String(data.workspaceName)} on IGE`
      : "You've been added to a team on IGE",
  displayName: "Workspace team invite",
  previewData: {
    workspaceName: "AlexBoyo World",
    inviterName: "Alero Boyo",
    roleLabel: "Manager",
    roleDescription:
      "Read-only oversight. Sees everything the team does and the weekly Team Activity report, but cannot edit anything or manage seats.",
    hasAccount: false,
    actionUrl: "https://www.insideglobalevents.com/signup",
    siteUrl: "https://www.insideglobalevents.com",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#f4f0fa", fontFamily: "Lato, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "24px 16px", maxWidth: "560px" };
const hero = {
  background: "linear-gradient(135deg, #6b3fa0 0%, #2e8171 55%, #0e8a62 100%)",
  borderRadius: "12px 12px 0 0",
  padding: "24px 24px 28px",
};
const h1 = {
  margin: "0 0 12px",
  fontSize: "24px",
  fontWeight: 700,
  color: "#ffffff",
  lineHeight: 1.3,
};
const lead = { margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.92)", lineHeight: 1.6 };
const card = {
  backgroundColor: "#ffffff",
  padding: "24px",
  borderLeft: "1px solid #e4e4e7",
  borderRight: "1px solid #e4e4e7",
};
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: 1.6, margin: "0 0 10px" };
const hint = { fontSize: "13px", color: "#71717a", lineHeight: 1.6, margin: 0 };
const ctaRow = {
  backgroundColor: "#ffffff",
  padding: "8px 24px 24px",
  borderRadius: "0 0 12px 12px",
  border: "1px solid #e4e4e7",
  borderTop: "none",
};
const button = {
  backgroundColor: "#6b3fa0",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  borderRadius: "8px",
  padding: "12px 24px",
  textDecoration: "none",
};
const link = { color: "#6b3fa0", textDecoration: "underline" };
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "24px 0 0" };
