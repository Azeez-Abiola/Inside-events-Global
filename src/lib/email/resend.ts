import { Resend } from 'resend'
import { getResendFromAddress } from '@/lib/email/config'

export interface QueuedEmailPayload {
  to: string
  from?: string
  subject: string
  html: string
  text?: string
  message_id?: string
  idempotency_key?: string
}

let client: Resend | null = null

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  if (!client) client = new Resend(apiKey)
  return client
}

export function isRateLimited(error: unknown): boolean {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return (error as { statusCode: number }).statusCode === 429
  }
  return error instanceof Error && error.message.includes('429')
}

export function isForbidden(error: unknown): boolean {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const code = (error as { statusCode: number }).statusCode
    return code === 403 || code === 401
  }
  return (
    error instanceof Error &&
    (error.message.includes('403') || error.message.includes('401'))
  )
}

export async function sendQueuedEmail(payload: QueuedEmailPayload): Promise<void> {
  const resend = getResendClient()
  const { data, error } = await resend.emails.send({
    from: payload.from || getResendFromAddress(),
    to: [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    headers: payload.message_id
      ? { 'X-Entity-Ref-ID': payload.message_id }
      : undefined,
  })

  if (error) {
    const err = new Error(error.message) as Error & { statusCode?: number }
    err.statusCode = (error as { statusCode?: number }).statusCode
    throw err
  }

  if (!data?.id) {
    throw new Error('Resend returned no message id')
  }
}
