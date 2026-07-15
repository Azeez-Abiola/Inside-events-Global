import { getAuthRedirectUrl } from '@/lib/site-url'

export const SITE_NAME = 'Inside Global Events'
export const ROOT_DOMAIN = 'www.insideglobalevents.com'

/** Verified sender in Resend (must match a domain you've added in Resend). */
export function getResendFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    `${SITE_NAME} <noreply@insideglobalevents.com>`
  )
}

export function getPublicSiteUrl(): string {
  return getAuthRedirectUrl()
}
