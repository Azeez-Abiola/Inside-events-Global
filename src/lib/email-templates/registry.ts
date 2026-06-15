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
import { template as welcome } from './welcome'
import { template as newMessage } from './new-message'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': contactConfirmation,
  'contact-internal': contactInternal,
  'waitlist-internal': waitlistInternal,
  welcome,
  'new-message': newMessage,
}
