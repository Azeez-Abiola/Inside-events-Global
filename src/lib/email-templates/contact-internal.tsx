import * as React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailBrandHeader } from '@/lib/email-templates/email-brand-header'

interface Props {
  name?: string
  email?: string
  company?: string
  subject?: string
  message?: string
  siteUrl?: string
}

const ContactInternalEmail = ({ name, email, company, subject, message, siteUrl = 'https://www.insideglobalevents.com' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form submission{name ? ` from ${name}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrandHeader siteUrl={siteUrl} />
        <Heading style={h1}>New contact submission</Heading>
        <Text style={kv}><b>Name:</b> {name ?? '—'}</Text>
        <Text style={kv}><b>Email:</b> {email ?? '—'}</Text>
        <Text style={kv}><b>Company:</b> {company ?? '—'}</Text>
        <Text style={kv}><b>Subject:</b> {subject ?? '—'}</Text>
        <Hr style={hr} />
        <Text style={body}>{message ?? '(no message)'}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactInternalEmail,
  subject: (d: Record<string, any>) => `Contact form: ${d.subject ?? 'New message'}`,
  displayName: 'Contact form — internal',
  previewData: { name: 'Jane Doe', email: 'jane@brand.com', company: 'Acme', subject: 'Sponsorship enquiry', message: 'Hi, we\'d love to learn more about your events.', siteUrl: 'https://www.insideglobalevents.com' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f4f0fa', fontFamily: 'Inter, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '20px', fontWeight: 700, color: '#0a0a0a', margin: '0 0 18px' }
const kv = { fontSize: '14px', color: '#27272a', margin: '0 0 6px' }
const body = { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e4e4e7', margin: '16px 0' }
