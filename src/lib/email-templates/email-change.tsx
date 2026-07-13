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
  Text,
} from '@react-email/components'
import { EmailBrandHeader } from '@/lib/email-templates/email-brand-header'

interface EmailChangeEmailProps {
  siteName: string
  siteUrl: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  siteUrl,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your email address for {siteName} from{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          If you didn't request this change, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#f4f0fa', fontFamily: 'Inter, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#0a0a0a',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#3f3f46',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: '#5b2d8e', textDecoration: 'underline' }
const button = {
  backgroundColor: '#5b2d8e',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#a1a1aa', margin: '30px 0 0' }
