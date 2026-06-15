import * as React from 'react'

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
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={hero}>
          <Text style={eyebrow}>Inside Global Events 2026</Text>
          <Heading style={h1}>Confirm your email</Heading>
          <Text style={lead}>
            Thanks for signing up for <strong>{siteName}</strong>. One click and you&apos;re in.
          </Text>
        </Section>
        <Section style={card}>
          <Text style={text}>
            Please confirm{' '}
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>{' '}
            to finish creating your account and complete your tailored profile setup.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Verify email &amp; continue
          </Button>
        </Section>
        <Text style={footer}>
          If you didn&apos;t create an account on{' '}
          <Link href={siteUrl} style={link}>
            {siteUrl.replace(/^https?:\/\//, '')}
          </Link>
          , you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#f4f0fa', fontFamily: 'Inter, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '24px 16px', maxWidth: '560px' }
const hero = {
  background: 'linear-gradient(135deg, #5b2d8e 0%, #7c3aed 100%)',
  borderRadius: '12px 12px 0 0',
  padding: '28px 24px',
}
const eyebrow = {
  margin: '0 0 8px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,0.85)',
}
const h1 = { margin: '0 0 12px', fontSize: '24px', fontWeight: 700, color: '#ffffff' }
const lead = { margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.6 }
const card = {
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #e4e4e7',
  borderTop: 'none',
}
const text = { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#5b2d8e', textDecoration: 'underline' }
const button = {
  backgroundColor: '#5b2d8e',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#a1a1aa', margin: '24px 0 0', lineHeight: 1.5 }
