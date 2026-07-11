-- Payment link fields on deals (Stripe Checkout / Paystack)
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_provider TEXT CHECK (payment_link_provider IN ('stripe', 'paystack')),
  ADD COLUMN IF NOT EXISTS payment_link_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMPTZ;
