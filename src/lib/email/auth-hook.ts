import * as React from 'react'
import { render } from '@react-email/components'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SignupEmail } from '@/lib/email-templates/signup'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/reauthentication'
import { getPublicSiteUrl, getResendFromAddress, SITE_NAME } from '@/lib/email/config'
import { SIGNUP_ROLES } from '@/lib/signup-roles'
import { normalizeAuthRedirectUrl } from '@/lib/site-url'

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Your IGE verification code',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

export interface SupabaseAuthEmailData {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
  site_url: string
  token_new: string
  token_hash_new: string
  old_email?: string
}

export interface SupabaseAuthHookUser {
  email: string
  new_email?: string
  user_metadata?: { role?: string }
}

function signupRoleLabel(user: SupabaseAuthHookUser): string | undefined {
  const role = user.user_metadata?.role
  if (!role) return undefined
  return SIGNUP_ROLES.find((r) => r.key === role)?.title
}

export function buildAuthConfirmationUrl(
  supabaseUrl: string,
  emailData: Pick<SupabaseAuthEmailData, 'token_hash' | 'email_action_type' | 'redirect_to'>
): string {
  const redirectTo = normalizeAuthRedirectUrl(emailData.redirect_to)
  const params = new URLSearchParams({
    token: emailData.token_hash,
    type: emailData.email_action_type,
    redirect_to: redirectTo,
  })
  return `${supabaseUrl.replace(/\/$/, '')}/auth/v1/verify?${params.toString()}`
}

function usesConfirmationLink(actionType: string): boolean {
  return ['invite', 'magiclink', 'recovery', 'email_change', 'email'].includes(
    actionType
  )
}

export async function enqueueAuthEmailFromHook(
  supabase: SupabaseClient,
  user: SupabaseAuthHookUser,
  emailData: SupabaseAuthEmailData,
  opts?: { recipientEmail?: string; confirmationUrl?: string; token?: string }
) {
  const emailType = emailData.email_action_type
  const EmailTemplate = EMAIL_TEMPLATES[emailType]
  if (!EmailTemplate) {
    throw new Error(`Unsupported auth email type: ${emailType}`)
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  if (!supabaseUrl) throw new Error('SUPABASE_URL is not configured')

  const recipient = opts?.recipientEmail || user.email
  const siteUrl = getPublicSiteUrl()
  const confirmationUrl =
    opts?.confirmationUrl ||
    (usesConfirmationLink(emailType)
      ? buildAuthConfirmationUrl(supabaseUrl, emailData)
      : '')

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl,
    recipient,
    confirmationUrl,
    token: opts?.token || emailData.token,
    roleLabel: emailType === 'signup' ? signupRoleLabel(user) : undefined,
    email: recipient,
    oldEmail: emailData.old_email || user.email,
    newEmail: user.new_email || recipient,
  }

  const element = React.createElement(EmailTemplate, templateProps)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const messageId = crypto.randomUUID()

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: emailType,
    recipient_email: recipient,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'auth_emails',
    payload: {
      run_id: messageId,
      message_id: messageId,
      to: recipient,
      from: getResendFromAddress(),
      subject: EMAIL_SUBJECTS[emailType] || 'Notification',
      html,
      text,
      purpose: 'transactional',
      label: emailType,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: emailType,
      recipient_email: recipient,
      status: 'failed',
      error_message: enqueueError.message,
    })
    throw new Error(`Failed to enqueue auth email: ${enqueueError.message}`)
  }

  return { messageId, emailType, recipient }
}

/** Handle secure email change (two separate confirmation emails). */
export async function enqueueEmailChangeEmails(
  supabase: SupabaseClient,
  user: SupabaseAuthHookUser,
  emailData: SupabaseAuthEmailData
) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  if (!supabaseUrl) throw new Error('SUPABASE_URL is not configured')

  const hasSecureChange =
    Boolean(emailData.token_hash_new) &&
    Boolean(user.new_email) &&
    user.new_email !== user.email

  if (!hasSecureChange) {
    return [await enqueueAuthEmailFromHook(supabase, user, emailData)]
  }

  const currentUrl = buildAuthConfirmationUrl(supabaseUrl, {
    token_hash: emailData.token_hash_new,
    email_action_type: emailData.email_action_type,
    redirect_to: emailData.redirect_to,
  })

  const newUrl = buildAuthConfirmationUrl(supabaseUrl, {
    token_hash: emailData.token_hash,
    email_action_type: emailData.email_action_type,
    redirect_to: emailData.redirect_to,
  })

  const current = await enqueueAuthEmailFromHook(supabase, user, emailData, {
    recipientEmail: user.email,
    confirmationUrl: currentUrl,
    token: emailData.token,
  })

  const next = await enqueueAuthEmailFromHook(supabase, user, emailData, {
    recipientEmail: user.new_email!,
    confirmationUrl: newUrl,
    token: emailData.token_new,
  })

  return [current, next]
}

export function redactEmail(email: string | null | undefined): string {
  if (!email) return '***'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '***'
  return `${localPart[0]}***@${domain}`
}
