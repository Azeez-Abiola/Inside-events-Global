import { createFileRoute } from '@tanstack/react-router'

/** @deprecated Lovable email delivery removed — use /api/auth/send-email-hook with Resend. */
export const Route = createFileRoute('/lovable/email/auth/webhook')({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          {
            error:
              'This endpoint is deprecated. Configure Supabase Auth Send Email Hook to POST https://www.insideglobalevents.com/api/auth/send-email-hook',
          },
          { status: 410 }
        ),
    },
  },
})
