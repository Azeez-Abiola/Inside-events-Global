/**
 * Server-side helper for enqueuing transactional emails from trusted server routes
 * (webhooks, public form submissions). Bypasses the user-JWT check on
 * /lovable/email/transactional/send and writes directly via the service-role
 * Supabase client. NEVER import from client code.
 */
import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

import { getResendFromAddress, getPublicSiteUrl } from '@/lib/email/config'
import { TEMPLATE_CATEGORY, type NotificationCategory } from '@/lib/notification-prefs'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface ServerSendParams {
  templateName: string
  recipientEmail?: string
  idempotencyKey?: string
  templateData?: Record<string, any>
  /** Alert category, so the recipient's Notifications settings apply. */
  category?: NotificationCategory
}

export async function sendTransactionalEmailServer(params: ServerSendParams) {
  const { templateName, templateData = {} } = params
  const template = TEMPLATES[templateName]
  if (!template) throw new Error(`Template '${templateName}' not found`)

  const effectiveRecipient = template.to || params.recipientEmail
  if (!effectiveRecipient) throw new Error('recipientEmail required')

  const normalized = effectiveRecipient.toLowerCase()
  const messageId = crypto.randomUUID()
  const idempotencyKey = params.idempotencyKey || messageId

  // Suppression check
  const { data: suppressed } = await supabaseAdmin
    .from('suppressed_emails').select('id').eq('email', normalized).maybeSingle()
  if (suppressed) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId, template_name: templateName,
      recipient_email: effectiveRecipient, status: 'suppressed',
    })
    return { success: false, reason: 'suppressed' }
  }

  // Per-category email preference (Account Settings → Notifications).
  const category = params.category ?? TEMPLATE_CATEGORY[templateName]
  if (category && (await emailSwitchedOff(normalized, category))) {
    return { success: false, reason: 'preference' }
  }

  // Unsubscribe token (reuse or create)
  let unsubscribeToken: string
  const { data: existing } = await supabaseAdmin
    .from('email_unsubscribe_tokens').select('token, used_at').eq('email', normalized).maybeSingle()
  if (existing && !existing.used_at) {
    unsubscribeToken = existing.token
  } else {
    unsubscribeToken = generateToken()
    await supabaseAdmin.from('email_unsubscribe_tokens')
      .upsert({ token: unsubscribeToken, email: normalized }, { onConflict: 'email', ignoreDuplicates: true })
    const { data: stored } = await supabaseAdmin
      .from('email_unsubscribe_tokens').select('token').eq('email', normalized).maybeSingle()
    if (stored) unsubscribeToken = stored.token
  }

  const element = React.createElement(template.component as any, {
    siteUrl: getPublicSiteUrl(),
    ...templateData,
  })
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject = typeof template.subject === 'function' ? template.subject(templateData) : template.subject

  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId, template_name: templateName,
    recipient_email: effectiveRecipient, status: 'pending',
  })

  const { error } = await supabaseAdmin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: getResendFromAddress(),
      subject,
      html,
      text,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (error) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId, template_name: templateName,
      recipient_email: effectiveRecipient, status: 'failed',
      error_message: error.message,
    })
    throw new Error(`Failed to enqueue: ${error.message}`)
  }
  return { success: true, messageId }
}

async function emailSwitchedOff(email: string, category: NotificationCategory): Promise<boolean> {
  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').ilike('email', email).maybeSingle()
    if (!profile) return false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- notification_preferences postdates the generated types.
    const { data: pref } = await (supabaseAdmin as any)
      .from('notification_preferences').select('email').eq('user_id', profile.id).eq('category', category).maybeSingle()
    return pref?.email === false
  } catch {
    return false
  }
}
