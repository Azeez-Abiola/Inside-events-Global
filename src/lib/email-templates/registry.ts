import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as contactConfirmation } from './contact-confirmation'
import { template as contactInternal } from './contact-internal'
import { template as waitlistInternal } from './waitlist-internal'
import { template as waitlistConfirmation } from './waitlist-confirmation'
import { template as waitlistInvite } from './waitlist-invite'
import { template as waitlistRejected } from './waitlist-rejected'
import { template as welcome } from './welcome'
import { template as newMessage } from './new-message'
import { template as paymentLink } from './payment-link'
import { template as commissionPaid } from './commission-paid'
import { template as dealStatus } from './deal-status'
import { template as vettingStatus } from './vetting-status'
import { template as newsletter } from './newsletter'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': contactConfirmation,
  'contact-internal': contactInternal,
  'waitlist-internal': waitlistInternal,
  'waitlist-confirmation': waitlistConfirmation,
  'waitlist-invite': waitlistInvite,
  'waitlist-rejected': waitlistRejected,
  welcome,
  'new-message': newMessage,
  'vetting-status': vettingStatus,
  'payment-link': paymentLink,
  'deal-status': dealStatus,
  'commission-paid': commissionPaid,
  newsletter,
}
