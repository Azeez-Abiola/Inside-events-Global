-- Sponsorship contract artifact + PRD-aligned deal statuses
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS contract_url TEXT,
  ADD COLUMN IF NOT EXISTS contract_generated_at TIMESTAMPTZ;

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_status_check;
ALTER TABLE public.deals ADD CONSTRAINT deals_status_check CHECK (status IN (
  'inquiry_received',
  'qualification_call_scheduled',
  'proposal_sent',
  'negotiation',
  'contract_sent',
  'contract_signed',
  'payment_received',
  'deal_closed',
  'deal_lost',
  'cancelled'
));

UPDATE public.deals SET status = 'qualification_call_scheduled' WHERE status IN ('vetting', 'intro_made');
UPDATE public.deals SET status = 'negotiation' WHERE status IN ('in_negotiation', 'verbal_commitment');
UPDATE public.deals SET status = 'deal_lost' WHERE status = 'closed_lost';
