import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { EmailBrandHeader } from "@/lib/email-templates/email-brand-header";

type NewsletterLink = { label: string; url: string };

interface Props {
  subject: string;
  bodyHtml: string;
  thumbnailUrl?: string;
  links?: NewsletterLink[];
  recipientName?: string;
  siteUrl?: string;
}

function bodyToHtml(body: string) {
  if (body.includes("<") && body.includes(">")) return body;
  return body
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

const NewsletterEmail = ({
  subject,
  bodyHtml,
  thumbnailUrl,
  links = [],
  recipientName,
  siteUrl = "https://www.insideglobalevents.com",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} tagline="Inside Global Events" />
        <Heading style={h1}>{subject}</Heading>
        {recipientName ? (
          <Text style={text}>Hi {recipientName},</Text>
        ) : (
          <Text style={text}>Hi there,</Text>
        )}
        {thumbnailUrl ? (
          <Section style={{ margin: "0 0 20px" }}>
            <Img
              src={thumbnailUrl}
              alt=""
              width="504"
              style={{ width: "100%", maxWidth: "504px", borderRadius: "12px", display: "block" }}
            />
          </Section>
        ) : null}
        <div dangerouslySetInnerHTML={{ __html: bodyToHtml(bodyHtml) }} />
        {links.length > 0 ? (
          <Section style={{ margin: "24px 0 0" }}>
            {links.map((link) => (
              <Button key={link.url} href={link.url} style={{ ...button, marginBottom: "10px" }}>
                {link.label}
              </Button>
            ))}
          </Section>
        ) : null}
        <Text style={footer}>
          You&apos;re receiving this because you subscribed to IGE updates.{" "}
          <Link href={`${siteUrl}/unsubscribe`} style={footerLink}>
            Unsubscribe
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: NewsletterEmail,
  subject: (data: Record<string, unknown>) => String(data.subject ?? "IGE Newsletter"),
  displayName: "Newsletter",
  previewData: {
    subject: "Trending B2B events this month",
    recipientName: "Jane",
    thumbnailUrl: "https://www.insideglobalevents.com/insideglobalevents.jpg",
    bodyHtml: "Discover vetted sponsorship opportunities across Africa, Europe, and globally.\n\nNew listings are live on the IGE marketplace.",
    links: [{ label: "Browse marketplace", url: "https://www.insideglobalevents.com/marketplace" }],
    siteUrl: "https://www.insideglobalevents.com",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#f4f0fa", fontFamily: "Inter, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "32px 28px", maxWidth: "560px" };
const h1 = { fontSize: "22px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 16px" };
const text = { fontSize: "14px", color: "#3f3f46", lineHeight: "1.6", margin: "0 0 16px" };
const button = {
  backgroundColor: "#5b2d8e",
  color: "#ffffff",
  fontSize: "14px",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none",
  display: "inline-block",
};
const footer = { fontSize: "12px", color: "#a1a1aa", margin: "28px 0 0", lineHeight: "1.5" };
const footerLink = { color: "#5b2d8e", textDecoration: "underline" };
