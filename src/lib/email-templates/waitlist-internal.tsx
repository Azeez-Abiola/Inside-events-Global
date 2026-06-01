import * as React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  audience?: string
  name?: string
  email?: string
  company?: string
  role?: string
  country?: string
  phone?: string
  notes?: string
}

const WaitlistInternalEmail = ({ audience, name, email, company, role, country, phone, notes }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New waitlist signup{name ? ` — ${name}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New waitlist signup</Heading>
        <Text style={kv}><b>Audience:</b> {audience ?? '—'}</Text>
        <Text style={kv}><b>Name:</b> {name ?? '—'}</Text>
        <Text style={kv}><b>Email:</b> {email ?? '—'}</Text>
        <Text style={kv}><b>Company:</b> {company ?? '—'}</Text>
        <Text style={kv}><b>Role:</b> {role ?? '—'}</Text>
        <Text style={kv}><b>Country:</b> {country ?? '—'}</Text>
        <Text style={kv}><b>Phone:</b> {phone ?? '—'}</Text>
        {notes ? (<><Hr style={hr} /><Text style={body}>{notes}</Text></>) : null}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistInternalEmail,
  subject: (d: Record<string, any>) => `Waitlist: ${d.audience ?? 'signup'} — ${d.name ?? d.email ?? ''}`,
  displayName: 'Waitlist — internal',
  previewData: { audience: 'organiser', name: 'Jane', email: 'jane@brand.com', company: 'Acme', role: 'Founder', country: 'Nigeria' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '20px', fontWeight: 700, color: '#0a0a0a', margin: '0 0 18px' }
const kv = { fontSize: '14px', color: '#27272a', margin: '0 0 6px' }
const body = { fontSize: '14px', color: '#3f3f46', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e4e4e7', margin: '16px 0' }
