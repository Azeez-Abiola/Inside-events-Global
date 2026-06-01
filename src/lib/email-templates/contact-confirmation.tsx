import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Inside Global Events'

interface Props {
  name?: string
  subject?: string
}

const ContactConfirmationEmail = ({ name, subject }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your message — IGE will be in touch shortly.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{name ? `Thanks, ${name}.` : 'Thanks for reaching out.'}</Heading>
        <Text style={text}>
          We've received your message{subject ? ` regarding "${subject}"` : ''} and the {SITE_NAME} team
          will get back to you within one business day.
        </Text>
        <Text style={text}>
          If your enquiry is urgent, reply to this email or call +234 903 091 5964.
        </Text>
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'We received your message',
  displayName: 'Contact confirmation',
  previewData: { name: 'Jane', subject: 'Sponsorship enquiry' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0a0a0a', margin: '0 0 18px' }
const text = { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#71717a', margin: '28px 0 0' }
