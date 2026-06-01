import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendTransactionalEmailServer } from '@/lib/email/server-send'

const HI_EMAIL = 'hi@insideglobalevents.com'

const Schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(150).optional().or(z.literal('')),
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(10).max(2000),
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
            message: data.message,
            ip_address: ip,
          })
          .select('id')
          .single()
        if (error) {
          console.error('contact insert failed', error)
          return Response.json({ error: 'Failed to save submission' }, { status: 500 })
        }

        // Fire-and-forget: notify ops + confirm sender. Don't block on email failures.
        try {
          await Promise.all([
            sendTransactionalEmailServer({
              templateName: 'contact-internal',
              recipientEmail: HI_EMAIL,
              idempotencyKey: `contact-internal-${row.id}`,
              templateData: {
                name: data.name, email: data.email, company: data.company || '',
                subject: data.subject, message: data.message,
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
