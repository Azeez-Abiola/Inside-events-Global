import * as React from 'react'
import { Img, Section, Text } from '@react-email/components'
import { SITE_NAME } from '@/lib/email/config'

const LOGO_PATH = '/insideglobalevents.jpg'

export function getEmailLogoUrl(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, '')}${LOGO_PATH}`
}

interface EmailBrandHeaderProps {
  siteUrl: string
  /** Shown below logo on light backgrounds */
  tagline?: string
  /** Use on purple hero sections — inverts to white text, no card behind logo */
  variant?: 'hero' | 'light'
}

export function EmailBrandHeader({
  siteUrl,
  tagline,
  variant = 'light',
}: EmailBrandHeaderProps) {
  const logoUrl = getEmailLogoUrl(siteUrl)
  const onHero = variant === 'hero'

  return (
    <Section style={{ margin: onHero ? '0 0 16px' : '0 0 20px', textAlign: 'center' as const }}>
      <Img
        src={logoUrl}
        alt={SITE_NAME}
        width={onHero ? 140 : 160}
        height="auto"
        style={{
          margin: '0 auto',
          display: 'block',
          borderRadius: '8px',
          ...(onHero
            ? { backgroundColor: 'rgba(255,255,255,0.95)', padding: '8px 12px' }
            : {}),
        }}
      />
      {tagline ? (
        <Text
          style={{
            margin: '12px 0 0',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: onHero ? 'rgba(255,255,255,0.85)' : '#71717a',
          }}
        >
          {tagline}
        </Text>
      ) : null}
    </Section>
  )
}
