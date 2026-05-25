
CREATE TABLE IF NOT EXISTS public.commission_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  igb_partner_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  exclusive_partner_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  min_payout_usd NUMERIC(12,2) NOT NULL DEFAULT 100.00,
  payout_schedule TEXT NOT NULL DEFAULT 'monthly',
  cookie_window_days INTEGER NOT NULL DEFAULT 90,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  rate NUMERIC(18,8) NOT NULL,
  source TEXT NOT NULL DEFAULT 'openexchangerates',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (base_currency, quote_currency, fetched_at)
);

CREATE TABLE IF NOT EXISTS public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_partner_id UUID NOT NULL,
  event_id UUID NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  conversions_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commitment_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  sponsor_id UUID NOT NULL,
  tier_id UUID,
  referral_link_id UUID,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company_name TEXT NOT NULL,
  budget_indicated NUMERIC(14,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  organiser_id UUID NOT NULL,
  sponsor_id UUID NOT NULL,
  tier_id UUID,
  referral_partner_id UUID,
  referral_link_id UUID,
  commitment_form_id UUID,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_usd NUMERIC(14,2),
  commission_rate NUMERIC(5,2),
  commission_amount_usd NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'pending',
  contract_url TEXT,
  signed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payout_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID,
  event_id UUID,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reported_by UUID,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_commission_config_updated ON public.commission_config;
CREATE TRIGGER trg_commission_config_updated BEFORE UPDATE ON public.commission_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_referral_links_updated ON public.referral_links;
CREATE TRIGGER trg_referral_links_updated BEFORE UPDATE ON public.referral_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_commitment_forms_updated ON public.commitment_forms;
CREATE TRIGGER trg_commitment_forms_updated BEFORE UPDATE ON public.commitment_forms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_deals_updated ON public.deals;
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_fraud_flags_updated ON public.fraud_flags;
CREATE TRIGGER trg_fraud_flags_updated BEFORE UPDATE ON public.fraud_flags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_organiser ON public.events(organiser_id);
CREATE INDEX IF NOT EXISTS idx_deals_event ON public.deals(event_id);
CREATE INDEX IF NOT EXISTS idx_deals_sponsor ON public.deals(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_deals_referral ON public.deals(referral_partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_partner ON public.referral_links(referral_partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_event ON public.referral_links(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commitment_forms_event ON public.commitment_forms(event_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON public.fraud_flags(status);
CREATE INDEX IF NOT EXISTS idx_messages_deal ON public.messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON public.exchange_rates(base_currency, quote_currency, fetched_at DESC);

ALTER TABLE public.commission_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitment_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read commission config" ON public.commission_config;
CREATE POLICY "public read commission config" ON public.commission_config FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admins manage commission config" ON public.commission_config;
CREATE POLICY "admins manage commission config" ON public.commission_config FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "anyone read exchange rates" ON public.exchange_rates;
CREATE POLICY "anyone read exchange rates" ON public.exchange_rates FOR SELECT USING (true);
DROP POLICY IF EXISTS "admins manage exchange rates" ON public.exchange_rates;
CREATE POLICY "admins manage exchange rates" ON public.exchange_rates FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "partner manage own links" ON public.referral_links;
CREATE POLICY "partner manage own links" ON public.referral_links FOR ALL TO authenticated
  USING (auth.uid() = referral_partner_id) WITH CHECK (auth.uid() = referral_partner_id AND public.has_role(auth.uid(), 'referral_partner'));
DROP POLICY IF EXISTS "admins manage referral links" ON public.referral_links;
CREATE POLICY "admins manage referral links" ON public.referral_links FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "organiser view links on own events" ON public.referral_links;
CREATE POLICY "organiser view links on own events" ON public.referral_links FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = referral_links.event_id AND e.organiser_id = auth.uid()));

DROP POLICY IF EXISTS "sponsor insert own commitment" ON public.commitment_forms;
CREATE POLICY "sponsor insert own commitment" ON public.commitment_forms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sponsor_id AND public.has_role(auth.uid(), 'sponsor'));
DROP POLICY IF EXISTS "sponsor view own commitments" ON public.commitment_forms;
CREATE POLICY "sponsor view own commitments" ON public.commitment_forms FOR SELECT TO authenticated
  USING (auth.uid() = sponsor_id);
DROP POLICY IF EXISTS "organiser view commitments on own events" ON public.commitment_forms;
CREATE POLICY "organiser view commitments on own events" ON public.commitment_forms FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = commitment_forms.event_id AND e.organiser_id = auth.uid()));
DROP POLICY IF EXISTS "admins manage commitments" ON public.commitment_forms;
CREATE POLICY "admins manage commitments" ON public.commitment_forms FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "sponsor view own deals" ON public.deals;
CREATE POLICY "sponsor view own deals" ON public.deals FOR SELECT TO authenticated USING (auth.uid() = sponsor_id);
DROP POLICY IF EXISTS "organiser view own deals" ON public.deals;
CREATE POLICY "organiser view own deals" ON public.deals FOR SELECT TO authenticated USING (auth.uid() = organiser_id);
DROP POLICY IF EXISTS "referral view own deals" ON public.deals;
CREATE POLICY "referral view own deals" ON public.deals FOR SELECT TO authenticated USING (auth.uid() = referral_partner_id);
DROP POLICY IF EXISTS "admins manage deals" ON public.deals;
CREATE POLICY "admins manage deals" ON public.deals FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "participants view messages" ON public.messages;
CREATE POLICY "participants view messages" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
DROP POLICY IF EXISTS "sender send messages" ON public.messages;
CREATE POLICY "sender send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "recipient mark read" ON public.messages;
CREATE POLICY "recipient mark read" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "admins manage messages" ON public.messages;
CREATE POLICY "admins manage messages" ON public.messages FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "users view own notifications" ON public.notifications;
CREATE POLICY "users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users update own notifications" ON public.notifications;
CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "admins manage notifications" ON public.notifications;
CREATE POLICY "admins manage notifications" ON public.notifications FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "users report fraud" ON public.fraud_flags;
CREATE POLICY "users report fraud" ON public.fraud_flags FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
DROP POLICY IF EXISTS "reporter view own flags" ON public.fraud_flags;
CREATE POLICY "reporter view own flags" ON public.fraud_flags FOR SELECT TO authenticated USING (auth.uid() = reported_by);
DROP POLICY IF EXISTS "admins manage fraud flags" ON public.fraud_flags;
CREATE POLICY "admins manage fraud flags" ON public.fraud_flags FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.commission_config (standard_rate, igb_partner_rate, exclusive_partner_rate)
SELECT 10.00, 15.00, 20.00
WHERE NOT EXISTS (SELECT 1 FROM public.commission_config);
