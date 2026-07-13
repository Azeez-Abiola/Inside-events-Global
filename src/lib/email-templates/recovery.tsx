import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import { EmailBrandHeader } from '@/lib/email-templates/email-brand-header'

interface RecoveryEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Click
          the button below to choose a new password.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset Password
        </Button>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const button = {
  backgroundColor: '#5b2d8e',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#a1a1aa', margin: '30px 0 0' }
