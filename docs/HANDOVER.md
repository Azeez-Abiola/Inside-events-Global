# IGE — Handover Notes

Inside Global Events MVP. AlexBoyo World.

## Stack

- **Frontend / SSR**: TanStack Start v1 (React 19, Vite 7) deployed as Cloudflare Worker
- **Backend logic**: TanStack server functions (`createServerFn`) under `src/lib/*.functions.ts`
- **Public HTTP routes** (webhooks): `src/routes/api/public/*`
- **Database / Auth / Storage**: Lovable Cloud (Supabase) — project ref `behwdpsrczmqsyaysidv`
- **Payments**: BYOK Stripe + Paystack (organisers connect their own keys)
- **Referrals**: Internal short-link engine (`/r/$code`)
- **Calendar**: Cal.com embed on event pages (`cal_booking_url` per event)

## Repo layout

```
src/
  routes/               TanStack file-based routes
    _authenticated/     Protected routes (dashboard, deals, pipeline, admin, settings)
    api/public/         Webhook endpoints (Stripe, Paystack)
    events.$slug.tsx    Public event detail + commitment dialog
    r.$code.tsx         Referral redirect + click tracking
  lib/
    *.functions.ts      Server functions (events, deals, referrals, messaging, admin, account)
    event-taxonomy.ts   Event type / sector / currency enums
    currency.ts         Dual-currency formatting (native + USD)
  integrations/supabase/  Auto-generated clients (do not edit)
  components/             Shared UI (shadcn + custom)
supabase/migrations/      SQL migrations
```

## Environment

Runtime secrets (managed in Lovable Cloud → Connectors):

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYSTACK_SECRET_KEY` (also used for Paystack HMAC verification)
- `SUPABASE_*` (auto-provisioned)
- `LOVABLE_API_KEY` (AI Gateway)

Build-time client vars (auto in `.env`):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`

## Brand

Defined in `src/styles.css`. IGE Purple `#6B3FA0` / Deep Violet `#4A2A6B` / Emerald `#008050`,
Inter typography, rounded-xl surfaces, gradient on primary CTAs.

## Operational runbook

### Vet & approve an event
Sign in as an admin → **Admin → Vetting** → click an event → choose
"Approve" or "Request revision". Approval flips status to `approved` and
makes the event publicly listed on `/marketplace`.

### Move a deal through the pipeline
Organiser: **Pipeline** view, drag/select stage on each deal.
Admin override: **Admin → Revenue** has a deals table with status controls.
When stage → `payment_received`, commission is calculated automatically.

### Mark referral commission as paid
Admin: **Admin → Revenue → Partner payouts** → toggle "Paid" on the row.

### Review a fraud flag
Admin: **Admin → Vetting → Fraud flags** tab. Self-referral detection runs
automatically when a sponsor's employer or email domain matches the
referring partner's; flagged deals appear here.

### Update commission rates
Admin: **Admin → Revenue → Commission config** → edit rate per category.
Premium tier auto-applies when a partner has ≥ 3 closed deals.

### Suspend a user
Admin → Vetting → Users tab → toggle `is_suspended` on the profile.

### Update FX rates
Admin: **Admin → Revenue → Exchange rates** → click "Refresh" to seed from
the configured FX source, or edit a row manually.

### Right-to-erasure
User: **Account → Settings → Delete my account**. Anonymises PII; retains
deal/referral records for 12 months for accounting.

## Webhooks

Configure these URLs in the respective dashboards (use the stable
project URL `https://project--{project-id}.lovable.app`):

- Stripe: `/api/public/webhooks/stripe` — events: `checkout.session.completed`, `payment_intent.succeeded`
- Paystack: `/api/public/webhooks/paystack` — events: `charge.success`

Both verify signatures via HMAC before processing.

## Deploy

Push to `main` via Lovable; Cloudflare Worker deploys automatically.
Database migrations live in `supabase/migrations/` and apply automatically.

## Support

- Engineering / product: partner@alexboyoworld.com
- Brand: see `src/styles.css` for the locked palette and typography
