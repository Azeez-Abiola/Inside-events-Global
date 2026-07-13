import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { EmailBrandHeader } from '@/lib/email-templates/email-brand-header'

interface ReauthenticationEmailProps {
  token: string
  siteUrl?: string
}

export const ReauthenticationEmail = ({ token, siteUrl = 'https://www.insideglobalevents.com' }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={hero}>
          <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
          <Heading style={h1}>Confirm reauthentication</Heading>
          <Text style={lead}>Use the code below to confirm your identity:</Text>
        </Section>
        <Section style={card}>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>
            This code will expire shortly. If you didn't request this, you can
            safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#f4f0fa', fontFamily: 'Inter, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '24px 16px', maxWidth: '560px' }
const hero = {
  background: 'linear-gradient(135deg, #5b2d8e 0%, #7c3aed 100%)',
  borderRadius: '12px 12px 0 0',
  padding: '24px 24px 20px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#ffffff',
  margin: '0 0 8px',
}
const lead = { margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }
const card = {
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #e4e4e7',
  borderTop: 'none',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '0.35em',
  color: '#5b2d8e',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}
const footer = { fontSize: '12px', color: '#71717a', margin: 0, lineHeight: 1.5 }
