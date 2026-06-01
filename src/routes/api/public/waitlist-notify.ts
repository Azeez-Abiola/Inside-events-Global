import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { sendTransactionalEmailServer } from '@/lib/email/server-send'

const HI_EMAIL = 'hi@insideglobalevents.com'

const Schema = z.object({
  audience: z.string().max(80),
  name: z.string().max(200),
  email: z.string().email().max(320),
  company: z.string().max(200).optional().nullable(),
  role: z.string().max(200).optional().nullable(),
  country: z.string().max(200).optional().nullable(),
  phone: z.string().max(80).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const Route = createFileRoute('/api/public/waitlist-notify')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try { body = await request.json() } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = Schema.safeParse(body)
        if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })
        const d = parsed.data
        try {
          await sendTransactionalEmailServer({
            templateName: 'waitlist-internal',
            recipientEmail: HI_EMAIL,
            idempotencyKey: `waitlist-${d.email}-${Date.now()}`,
            templateData: d,
          })
        } catch (e) {
          console.error('waitlist email failed', e)
          return Response.json({ success: false }, { status: 200 })
        }
        return Response.json({ success: true })
      },
    },
  },
})
