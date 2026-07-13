import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailBrandHeader } from '@/lib/email-templates/email-brand-header'
import { SITE_NAME } from '@/lib/email/config'
import { waitlistAudienceLabel, type WaitlistAudience } from '@/lib/waitlist-audiences'

interface Props {
  name?: string
  audience?: string
  audienceLabel?: string
  siteUrl?: string
}

const WAITLIST_COPY: Record<
  WaitlistAudience,
  { headline: string; intro: string; bullets: string[] }
> = {
  organiser: {
    headline: "You're on the organiser waitlist",
    intro:
      "We're building IGE for event teams who want vetted sponsors, less admin, and a clearer path from listing to signed deal.",
    bullets: [
      'Early access to list and submit events for vetting',
      'Sponsor pipeline tools when founding access opens',
      'Priority onboarding from the IGE team',
    ],
  },
  sponsor: {
    headline: "You're on the sponsor waitlist",
    intro:
      "IGE helps brands discover vetted B2B events and move from shortlist to signed sponsorship with more confidence.",
    bullets: [
      'Founding access to the vetted events marketplace',
      'Shortlist, commit, and message organisers in one workspace',
      'Early visibility on premium event opportunities',
    ],
  },
  referral_partner: {
    headline: "You're on the referral partner waitlist",
    intro:
      "We're onboarding partners who introduce sponsors to the right events and earn commission when deals close.",
    bullets: [
      'Trackable referral links when the platform opens',
      'Real-time deal and commission pipeline visibility',
      'Founding partner rates for early introducers',
    ],
  },
  media_partner: {
    headline: "You're on the media partner waitlist",
    intro:
      "IGE connects media partners with vetted events for cross-promotion, coverage, and co-marketing opportunities.",
    bullets: [
      'Priority review for media partnership requests',
      'Curated events aligned to your audience and beat',
      'Direct outreach from our partnerships team',
    ],
  },
}

function resolveCopy(audience?: string) {
  const key = audience as WaitlistAudience
  if (key && WAITLIST_COPY[key]) return WAITLIST_COPY[key]
  return {
    headline: "You're on the IGE waitlist",
    intro:
      "Thanks for your interest in Inside Global Events. We'll notify you when founding-member access opens.",
    bullets: [
      'Early access before public launch',
      'Role-tailored workspace onboarding',
      'Updates from the IGE team as we open access',
    ],
  }
}

const WaitlistConfirmationEmail = ({
  name,
  audience,
  audienceLabel,
  siteUrl = 'https://www.insideglobalevents.com',
}: Props) => {
  const label =
    audienceLabel ||
    (audience ? waitlistAudienceLabel(audience as WaitlistAudience) : 'IGE member')
  const copy = resolveCopy(audience)
  const firstName = name?.trim().split(/\s+/)[0]

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Thanks for joining the IGE waitlist as a {label}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
            <Heading style={h1}>{copy.headline}</Heading>
            <Text style={lead}>
              {firstName ? `Hi ${firstName},` : 'Hi there,'} thanks for joining the{' '}
              <strong>{SITE_NAME}</strong> founding waitlist as a <strong>{label}</strong>.
            </Text>
          </Section>
          <Section style={card}>
            <Text style={text}>{copy.intro}</Text>
            {copy.bullets.map((b) => (
              <Text key={b} style={bullet}>
                ✓ {b}
              </Text>
            ))}
          </Section>
          <Section style={footerCard}>
            <Text style={text}>
              We&apos;ll email you when your cohort is invited to create an account. In the meantime,
              visit{' '}
              <Link href={siteUrl} style={link}>
                {siteUrl.replace(/^https?:\/\//, '')}
              </Link>{' '}
              for updates.
            </Text>
            <Text style={footer}>— The {SITE_NAME} team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WaitlistConfirmationEmail,
  subject: (d: Record<string, unknown>) =>
    `You're on the IGE waitlist — ${d.audienceLabel ?? d.audience ?? 'founding access'}`,
  displayName: 'Waitlist confirmation',
  previewData: {
    name: 'Jane Doe',
    audience: 'sponsor',
    audienceLabel: 'Brand / sponsor',
    siteUrl: 'https://www.insideglobalevents.com',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#f4f0fa', fontFamily: 'Inter, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '24px 16px', maxWidth: '560px' }
const hero = {
  background: 'linear-gradient(135deg, #5b2d8e 0%, #7c3aed 100%)',
  borderRadius: '12px 12px 0 0',
  padding: '24px 24px 28px',
}
const h1 = { margin: '0 0 12px', fontSize: '24px', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }
const lead = { margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.6 }
const card = {
  backgroundColor: '#ffffff',
  padding: '24px',
  borderLeft: '1px solid #e4e4e7',
  borderRight: '1px solid #e4e4e7',
}
const footerCard = {
  backgroundColor: '#ffffff',
  padding: '8px 24px 24px',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #e4e4e7',
  borderTop: 'none',
}
const text = { fontSize: '14px', color: '#3f3f46', lineHeight: 1.6, margin: '0 0 14px' }
const bullet = { fontSize: '14px', color: '#3f3f46', lineHeight: 1.5, margin: '0 0 8px' }
const link = { color: '#5b2d8e', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#a1a1aa', margin: '16px 0 0' }
