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
import { EmailBrandHeader } from '@/lib/email-templates/email-brand-header'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  token: string
  roleLabel?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  token,
  roleLabel,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={hero}>
          <EmailBrandHeader siteUrl={siteUrl} variant="hero" />
          <Heading style={h1}>Verify your email</Heading>
          <Text style={lead}>
            Thanks for signing up for <strong>{siteName}</strong>
            {roleLabel ? (
              <>
                {' '}
                as a <strong>{roleLabel}</strong>
              </>
            ) : null}
            . Enter this code on the signup page to continue.
          </Text>
        </Section>
        <Section style={card}>
          <Text style={text}>
            Your verification code for{' '}
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>
            :
          </Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={hint}>This code expires in 1 hour. Do not share it with anyone.</Text>
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
  padding: '24px 24px 28px',
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
const text = { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '0.35em',
  color: '#5b2d8e',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}
const hint = { fontSize: '12px', color: '#71717a', margin: 0, lineHeight: 1.5 }
const link = { color: '#5b2d8e', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#a1a1aa', margin: '24px 0 0', lineHeight: 1.5 }
