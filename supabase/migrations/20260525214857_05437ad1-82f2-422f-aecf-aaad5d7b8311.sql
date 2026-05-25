
-- =============================================
-- EVENTS: rename columns + tighten constraints
-- =============================================
ALTER TABLE public.events RENAME COLUMN views_count TO view_count;
ALTER TABLE public.events RENAME COLUMN saves_count TO save_count;
ALTER TABLE public.events RENAME COLUMN inquiries_count TO inquiry_count;
ALTER TABLE public.events RENAME COLUMN reviewed_at TO vetted_at;
ALTER TABLE public.events RENAME COLUMN reviewed_by TO vetted_by;
ALTER TABLE public.events RENAME COLUMN admin_notes TO vetting_notes;
ALTER TABLE public.events DROP COLUMN IF EXISTS revision_notes;
ALTER TABLE public.events DROP COLUMN IF EXISTS submitted_at;

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check CHECK (status IN (
  'draft','submitted','under_review','revision_requested','approved','listed','closed','archived','rejected'
));
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_format_check;
ALTER TABLE public.events ADD CONSTRAINT events_format_check CHECK (format IN ('in-person','virtual','hybrid') OR format IS NULL);

-- Update RLS policy that referenced old status values (organiser update own drafts already covers draft/submitted/revision_requested)

-- =============================================
-- EVENT_SPONSORSHIP_TIERS: align column names + types
-- =============================================
ALTER TABLE public.event_sponsorship_tiers RENAME COLUMN slot_count TO slots_total;
ALTER TABLE public.event_sponsorship_tiers RENAME COLUMN sort_order TO display_order;
ALTER TABLE public.event_sponsorship_tiers ADD COLUMN IF NOT EXISTS slots_remaining INTEGER;
ALTER TABLE public.event_sponsorship_tiers ALTER COLUMN assets DROP DEFAULT;
ALTER TABLE public.event_sponsorship_tiers ALTER COLUMN assets TYPE JSONB USING CASE WHEN assets IS NULL OR assets = '' THEN '[]'::jsonb ELSE to_jsonb(assets) END;
ALTER TABLE public.event_sponsorship_tiers ALTER COLUMN assets SET DEFAULT '[]'::jsonb;

-- =============================================
-- DROP & REBUILD divergent empty tables
-- =============================================
DROP TABLE IF EXISTS public.commitment_forms CASCADE;
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.referral_links CASCADE;
DROP TABLE IF EXISTS public.fraud_flags CASCADE;
DROP TABLE IF EXISTS public.commission_config CASCADE;
DROP TABLE IF EXISTS public.exchange_rates CASCADE;

-- =============================================
-- REFERRAL LINKS (spec shape)
-- =============================================
CREATE TABLE public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_partner_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  vouch_link_id TEXT,
  vouch_link_url TEXT NOT NULL,
  short_code TEXT UNIQUE,
  click_count INTEGER NOT NULL DEFAULT 0,
  unique_click_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','expired')),
  expires_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referral_partner_id, event_id)
);
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partner manage own links" ON public.referral_links FOR ALL TO authenticated
  USING (auth.uid() = referral_partner_id) WITH CHECK (auth.uid() = referral_partner_id AND public.has_role(auth.uid(),'referral_partner'));
CREATE POLICY "admins manage referral links" ON public.referral_links FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "organiser view links on own events" ON public.referral_links FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = referral_links.event_id AND e.organiser_id = auth.uid()));

-- =============================================
-- REFERRAL_LINK_CLICKS
-- =============================================
CREATE TABLE public.referral_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES public.referral_links(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_link_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view clicks" ON public.referral_link_clicks FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "partner view own link clicks" ON public.referral_link_clicks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.referral_links rl WHERE rl.id = referral_link_clicks.referral_link_id AND rl.referral_partner_id = auth.uid()));
-- Clicks are inserted via server fn using admin client (public click endpoint); no client INSERT policy.

-- =============================================
-- COMMITMENT FORMS (spec shape)
-- =============================================
CREATE TABLE public.commitment_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_user_id UUID,
  referral_link_id UUID REFERENCES public.referral_links(id),
  referral_partner_id UUID,
  readiness_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  contact_name TEXT NOT NULL,
  contact_title TEXT,
  company_name TEXT NOT NULL,
  company_linkedin_url TEXT,
  brand_region TEXT,
  currency TEXT NOT NULL,
  partnership_type TEXT CHECK (partnership_type IN ('cash','in-kind','co-creation','jv')),
  budget_range_min NUMERIC,
  budget_range_max NUMERIC,
  expected_roi TEXT,
  proposed_start_date DATE,
  tier_id UUID REFERENCES public.event_sponsorship_tiers(id),
  custom_requirements TEXT,
  ngn_usd_rate_locked NUMERIC,
  gbp_usd_rate_locked NUMERIC,
  eur_usd_rate_locked NUMERIC,
  rate_locked_at TIMESTAMPTZ,
  fraud_flags JSONB NOT NULL DEFAULT '[]',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commitment_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sponsor insert own commitment" ON public.commitment_forms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sponsor_user_id AND public.has_role(auth.uid(),'sponsor'));
CREATE POLICY "sponsor view own commitments" ON public.commitment_forms FOR SELECT TO authenticated USING (auth.uid() = sponsor_user_id);
CREATE POLICY "organiser view commitments on own events" ON public.commitment_forms FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = commitment_forms.event_id AND e.organiser_id = auth.uid()));
CREATE POLICY "admins manage commitments" ON public.commitment_forms FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- DEALS (spec shape)
-- =============================================
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_form_id UUID NOT NULL REFERENCES public.commitment_forms(id),
  event_id UUID NOT NULL REFERENCES public.events(id),
  organiser_id UUID NOT NULL,
  sponsor_user_id UUID,
  referral_partner_id UUID,
  deal_value_native NUMERIC,
  deal_currency TEXT NOT NULL,
  deal_value_usd NUMERIC,
  abw_commission_rate NUMERIC NOT NULL DEFAULT 0.12,
  abw_commission_native NUMERIC,
  abw_commission_usd NUMERIC,
  referral_commission_rate NUMERIC NOT NULL DEFAULT 0.07,
  referral_commission_native NUMERIC,
  referral_commission_usd NUMERIC,
  organiser_payout_native NUMERIC,
  status TEXT NOT NULL DEFAULT 'inquiry_received' CHECK (status IN (
    'inquiry_received','qualification_call_scheduled','proposal_sent','negotiation',
    'contract_signed','payment_received','deal_closed','deal_lost'
  )),
  stripe_payment_intent_id TEXT,
  paystack_reference TEXT,
  paid_at TIMESTAMPTZ,
  referral_commission_paid BOOLEAN NOT NULL DEFAULT FALSE,
  referral_commission_paid_at TIMESTAMPTZ,
  abw_notes TEXT,
  assigned_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sponsor view own deals" ON public.deals FOR SELECT TO authenticated USING (auth.uid() = sponsor_user_id);
CREATE POLICY "organiser view own deals" ON public.deals FOR SELECT TO authenticated USING (auth.uid() = organiser_id);
CREATE POLICY "referral view own deals" ON public.deals FOR SELECT TO authenticated USING (auth.uid() = referral_partner_id);
CREATE POLICY "admins manage deals" ON public.deals FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- DEAL_STATUS_HISTORY
-- =============================================
CREATE TABLE public.deal_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID,
  note TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage deal history" ON public.deal_status_history FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "deal participants view history" ON public.deal_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_status_history.deal_id
    AND (auth.uid() = d.organiser_id OR auth.uid() = d.sponsor_user_id OR auth.uid() = d.referral_partner_id)));

-- =============================================
-- EXCHANGE RATES (spec shape: snapshot row)
-- =============================================
CREATE TABLE public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'USD',
  ngn_rate NUMERIC NOT NULL,
  gbp_rate NUMERIC NOT NULL,
  eur_rate NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'openexchangerates',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read exchange rates" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "admins manage exchange rates" ON public.exchange_rates FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- FRAUD FLAGS (spec shape)
-- =============================================
CREATE TABLE public.fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flagged_user_id UUID,
  flagged_by TEXT NOT NULL DEFAULT 'system',
  flag_type TEXT NOT NULL,
  description TEXT,
  related_deal_id UUID REFERENCES public.deals(id),
  related_referral_link_id UUID REFERENCES public.referral_links(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed','actioned')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage fraud flags" ON public.fraud_flags FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- COMMISSION CONFIG (spec shape: per event_type_category)
-- =============================================
CREATE TABLE public.commission_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_category TEXT NOT NULL,
  standard_rate NUMERIC NOT NULL,
  premium_rate NUMERIC NOT NULL,
  abw_platform_rate NUMERIC NOT NULL DEFAULT 0.12,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read commission config" ON public.commission_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage commission config" ON public.commission_config FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- EVENT_SAVES
-- =============================================
CREATE TABLE public.event_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
ALTER TABLE public.event_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user manage own saves" ON public.event_saves FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins view saves" ON public.event_saves FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- =============================================
-- NOTIFICATIONS: add data JSONB, drop link_url
-- =============================================
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.notifications DROP COLUMN IF EXISTS link_url;

-- =============================================
-- MESSAGES: add thread_id
-- =============================================
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS thread_id UUID;
UPDATE public.messages SET thread_id = gen_random_uuid() WHERE thread_id IS NULL;
ALTER TABLE public.messages ALTER COLUMN thread_id SET NOT NULL;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_events_country ON public.events(country);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_primary_sector ON public.events(primary_sector);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_search ON public.events USING gin(
  to_tsvector('english',
    coalesce(name,'') || ' ' || coalesce(city,'') || ' ' || coalesce(primary_sector,'') || ' ' || coalesce(event_theme,'')
  )
);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_referral_partner ON public.deals(referral_partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_partner ON public.referral_links(referral_partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_event ON public.referral_links(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commitment_forms_event ON public.commitment_forms(event_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON public.fraud_flags(status);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetched_at ON public.exchange_rates(fetched_at DESC);
