import { Webhook } from 'standardwebhooks'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import {
  enqueueAuthEmailFromHook,
  enqueueEmailChangeEmails,
  redactEmail,
  type SupabaseAuthEmailData,
  type SupabaseAuthHookUser,
} from '@/lib/email/auth-hook'

function getHookSecret(): string | null {
  const raw =
    process.env.SEND_EMAIL_HOOK_SECRET ||
    process.env.SUPABASE_AUTH_HOOK_SECRET
  if (!raw) return null
  return raw.replace(/^v1,whsec_/, '')
}

export const Route = createFileRoute('/api/auth/send-email-hook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const hookSecret = getHookSecret()
        if (!hookSecret) {
          console.error('SEND_EMAIL_HOOK_SECRET is not configured')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !supabaseServiceKey) {
          console.error('Missing Supabase environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const payloadText = await request.text()
        const headers = Object.fromEntries(request.headers.entries())

        let user: SupabaseAuthHookUser
        let email_data: SupabaseAuthEmailData

        try {
          const wh = new Webhook(hookSecret)
          const verified = wh.verify(payloadText, headers) as {
            user: SupabaseAuthHookUser
            email_data: SupabaseAuthEmailData
          }
          user = verified.user
          email_data = verified.email_data
        } catch (error) {
          console.error('Auth hook verification failed', { error })
          return Response.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const emailType = email_data.email_action_type
        console.log('Auth send-email hook', {
          emailType,
          email_redacted: redactEmail(user.email),
        })

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        try {
          if (emailType === 'email_change') {
            await enqueueEmailChangeEmails(supabase, user, email_data)
          } else if (emailType === 'reauthentication') {
            await enqueueAuthEmailFromHook(supabase, user, email_data, {
              token: email_data.token,
            })
          } else {
            await enqueueAuthEmailFromHook(supabase, user, email_data)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.error('Failed to enqueue auth email', { emailType, error: message })
          return Response.json({ error: message }, { status: 500 })
        }

        return Response.json({ success: true, queued: true })
      },
    },
  },
})
