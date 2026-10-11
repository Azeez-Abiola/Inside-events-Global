import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendTransactionalEmailServer } from '@/lib/email/server-send'
import { openInboxThread } from '@/lib/admin-inbox.server'

const HI_EMAIL = 'hi@insideglobalevents.com'

// Every public form that asks IGE for something lands in the Admin Inbox
// (TAB 6 §6.10): the Contact/Email Admin form, the IGE Services "Request a
// meeting" form (TAB 1 §1.11A), the retainer link on role selection (TAB 2
// §2.2) and the Co-Creation request (TAB 7 §7.3).
const SOURCES = ['email_admin', 'ige_services', 'abw_consulting', 'co_creation'] as const

const Schema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    company: z.string().trim().max(150).optional().or(z.literal('')),
    subject: z.string().trim().min(1).max(150),
    message: z.string().trim().max(2000).optional().default(''),
    source: z.enum(SOURCES).optional().default('email_admin'),
    linkedin_url: z.string().trim().url().max(300).optional().or(z.literal('')),
    phone: z.string().trim().max(40).optional().or(z.literal('')),
    services: z.array(z.string().trim().max(120)).max(30).optional(),
    engagement: z.string().trim().max(60).optional().or(z.literal('')),
  })
  // A bare contact message needs substance; a services request is mostly ticks.
  .refine((d) => d.source !== 'email_admin' || d.message.length >= 10, {
    message: 'Message must be at least 10 characters',
    path: ['message'],
  })

export const Route = createFileRoute('/api/public/contact')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try { body = await request.json() } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = Schema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
        }
        const data = parsed.data
        const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || null

        const { data: row, error } = await supabaseAdmin
          .from('contact_submissions')
          .insert({
            name: data.name,
            email: data.email,
            company: data.company || null,
            subject: data.subject,
            message: data.message || `(${data.source.replace(/_/g, ' ')} request)`,
            ip_address: ip,
          })
          .select('id')
          .single()
        if (error) {
          console.error('contact insert failed', error)
          return Response.json({ error: 'Failed to save submission' }, { status: 500 })
        }

        await openInboxThread({
          source: data.source,
          subject: data.subject,
          body: data.message || 'No message — see the request details.',
          contactName: data.name,
          contactEmail: data.email,
          payload: {
            organisation: data.company || null,
            phone: data.phone || null,
            linkedin_url: data.linkedin_url || null,
            services: data.services ?? null,
            preferred_engagement: data.engagement || null,
          },
        }).catch(() => null)

        // Fire-and-forget: notify ops + confirm sender. Don't block on email failures.
        try {
          await Promise.all([
            sendTransactionalEmailServer({
              templateName: 'contact-internal',
              recipientEmail: HI_EMAIL,
              idempotencyKey: `contact-internal-${row.id}`,
              templateData: {
                name: data.name, email: data.email, company: data.company || '',
                subject: data.subject,
                message: [
                  data.message,
                  data.services?.length ? `Services: ${data.services.join(', ')}` : '',
                  data.engagement ? `Preferred engagement: ${data.engagement}` : '',
                  data.phone ? `Phone: ${data.phone}` : '',
                  data.linkedin_url ? `LinkedIn: ${data.linkedin_url}` : '',
                ].filter(Boolean).join('\n\n'),
              },
            }),
            sendTransactionalEmailServer({
              templateName: 'contact-confirmation',
              recipientEmail: data.email,
              idempotencyKey: `contact-confirm-${row.id}`,
              templateData: { name: data.name, subject: data.subject },
            }),
          ])
        } catch (e) {
          console.error('contact email enqueue failed', e)
        }

        return Response.json({ success: true })
      },
    },
  },
})
