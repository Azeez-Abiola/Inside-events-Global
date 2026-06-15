-- IGE full schema setup — generated from supabase/migrations (run once in Supabase SQL Editor)

-- ============================================================
-- 20260525205952_2a1a735e-540b-4ecd-bf40-db63c6d6c519.sql
-- ============================================================

-- ============================================================
-- IGE FOUNDATION SCHEMA (Sprints 1–2)
-- ============================================================

-- Roles enum + table (avoids RLS recursion / privilege escalation)
CREATE TYPE public.app_role AS ENUM (
  'organiser', 'sponsor', 'referral_partner',
  'media_partner', 'abw_admin', 'super_admin'
);

CREATE TABLE public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('abw_admin','super_admin')
  )
$$;

CREATE POLICY "users view own roles"      ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view all roles"     ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins manage roles"       ON public.user_roles FOR ALL    TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT,
  email_domain      TEXT,
  linkedin_url      TEXT,
  linkedin_id       TEXT UNIQUE,
  google_id         TEXT UNIQUE,
  linkedin_employer TEXT,
  profile_complete  INTEGER NOT NULL DEFAULT 0 CHECK (profile_complete BETWEEN 0 AND 100),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_suspended      BOOLEAN NOT NULL DEFAULT FALSE,
  suspension_reason TEXT,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own profile"  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Auto-create profile + assign role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_role_text TEXT;
BEGIN
  INSERT INTO public.profiles (id, email, email_domain)
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 2)
  );

  v_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'sponsor');
  IF v_role_text IN ('organiser','sponsor','referral_partner','media_partner') THEN
    v_role := v_role_text::public.app_role;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'sponsor');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ORGANISER PROFILES
-- ============================================================
CREATE TABLE public.organiser_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  org_name           TEXT NOT NULL,
  logo_url           TEXT,
  bio                TEXT,
  website            TEXT,
  event_history      TEXT,
  past_sponsor_logos JSONB NOT NULL DEFAULT '[]',
  track_record       TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organiser_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view organiser display info (for event listings)
CREATE POLICY "public view organiser profiles" ON public.organiser_profiles FOR SELECT USING (true);
CREATE POLICY "organiser manage own profile"   ON public.organiser_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins manage organiser profiles" ON public.organiser_profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_org_profiles_updated BEFORE UPDATE ON public.organiser_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SPONSOR PROFILES (budget is PRIVATE — never publicly readable)
-- ============================================================
CREATE TABLE public.sponsor_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name          TEXT NOT NULL,
  industry            TEXT,
  company_size        TEXT,
  hq_country          TEXT,
  hq_city             TEXT,
  sponsorship_sectors JSONB NOT NULL DEFAULT '[]',
  target_geographies  JSONB NOT NULL DEFAULT '[]',
  audience_types      JSONB NOT NULL DEFAULT '[]',
  budget_range_min    NUMERIC,
  budget_range_max    NUMERIC,
  preferred_currency  TEXT NOT NULL DEFAULT 'USD',
  past_sponsorships   JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor view own profile"   ON public.sponsor_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sponsor manage own profile" ON public.sponsor_profiles FOR ALL    TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins view sponsor profiles" ON public.sponsor_profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins update sponsor profiles" ON public.sponsor_profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_sponsor_profiles_updated BEFORE UPDATE ON public.sponsor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- REFERRAL PARTNER PROFILES
-- ============================================================
CREATE TABLE public.referral_partner_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL,
  professional_title   TEXT,
  sector_expertise     JSONB NOT NULL DEFAULT '[]',
  professional_bg      TEXT,
  sponsor_network_desc TEXT,
  payout_currency      TEXT NOT NULL DEFAULT 'NGN' CHECK (payout_currency IN ('NGN','USD','GBP','EUR')),
  total_earned_usd     NUMERIC NOT NULL DEFAULT 0,
  deals_closed         INTEGER NOT NULL DEFAULT 0,
  commission_tier      TEXT NOT NULL DEFAULT 'standard' CHECK (commission_tier IN ('standard','premium')),
  igb_partner_badge    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral view own profile"   ON public.referral_partner_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "referral manage own profile" ON public.referral_partner_profiles FOR ALL    TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins view referral profiles" ON public.referral_partner_profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins update referral profiles" ON public.referral_partner_profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_ref_profiles_updated BEFORE UPDATE ON public.referral_partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- EVENTS (9-step submission + vetting workflow)
-- ============================================================
CREATE TABLE public.events (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug                     TEXT UNIQUE,
  -- Step 1: Basics
  name                     TEXT NOT NULL,
  event_type               TEXT,
  format                   TEXT CHECK (format IN ('in-person','virtual','hybrid')),
  start_date               DATE,
  end_date                 DATE,
  city                     TEXT,
  country                  TEXT,
  venue                    TEXT,
  website                  TEXT,
  -- Step 2: Organiser contact snapshot
  organiser_contact_name   TEXT,
  organiser_contact_role   TEXT,
  organiser_contact_email  TEXT,
  organiser_contact_phone  TEXT,
  years_running_event      INTEGER,
  past_editions            INTEGER,
  -- Step 3: Audience
  attendance_size          INTEGER,
  primary_audience         JSONB NOT NULL DEFAULT '[]',
  audience_seniority       TEXT,
  decision_makers_pct      INTEGER CHECK (decision_makers_pct BETWEEN 0 AND 100),
  geographic_mix           JSONB NOT NULL DEFAULT '[]',
  -- Step 4: Sector & theme
  primary_sector           TEXT,
  secondary_sector         TEXT,
  event_theme              TEXT,
  -- Step 5: Sponsorship summary (tiers in event_sponsorship_tiers)
  min_sponsorship_spend    NUMERIC,
  currency                 TEXT NOT NULL DEFAULT 'NGN',
  -- Step 6: Brand & media value
  exposure_channels        JSONB NOT NULL DEFAULT '[]',
  speaking_opps            BOOLEAN NOT NULL DEFAULT FALSE,
  speaking_slots           INTEGER,
  lead_capture             BOOLEAN NOT NULL DEFAULT FALSE,
  media_partners           JSONB NOT NULL DEFAULT '[]',
  post_event_report        BOOLEAN NOT NULL DEFAULT FALSE,
  -- Step 7: Documents
  sponsorship_deck_url     TEXT,
  banner_image_url         TEXT,
  floor_plan_url           TEXT,
  -- Step 8: Commercial terms
  sponsorship_deadline     DATE,
  payment_terms            TEXT,
  abw_management_requested BOOLEAN NOT NULL DEFAULT FALSE,
  -- Step 9: Consent
  consent_given            BOOLEAN NOT NULL DEFAULT FALSE,
  consent_given_at         TIMESTAMPTZ,
  -- Auto-save draft state
  form_data_draft          JSONB,
  form_step_completed      INTEGER NOT NULL DEFAULT 0 CHECK (form_step_completed BETWEEN 0 AND 9),
  -- Vetting
  status                   TEXT NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft','submitted','under_review','revision_requested','approved','listed','rejected','closed','archived')),
  ige_vetted               BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notes              TEXT,
  revision_notes           TEXT,
  rejection_reason         TEXT,
  submitted_at             TIMESTAMPTZ,
  reviewed_at              TIMESTAMPTZ,
  reviewed_by              UUID REFERENCES auth.users(id),
  -- Stats
  views_count              INTEGER NOT NULL DEFAULT 0,
  saves_count              INTEGER NOT NULL DEFAULT 0,
  inquiries_count          INTEGER NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_organiser ON public.events(organiser_id);
CREATE INDEX idx_events_status    ON public.events(status);
CREATE INDEX idx_events_slug      ON public.events(slug);
CREATE INDEX idx_events_country_city ON public.events(country, city);
CREATE INDEX idx_events_start_date ON public.events(start_date);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public view live events" ON public.events
  FOR SELECT USING (status IN ('approved','listed'));

CREATE POLICY "organiser view own events" ON public.events
  FOR SELECT TO authenticated USING (auth.uid() = organiser_id);

CREATE POLICY "organiser insert own events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = organiser_id AND public.has_role(auth.uid(), 'organiser'));

CREATE POLICY "organiser update own drafts" ON public.events
  FOR UPDATE TO authenticated
  USING (auth.uid() = organiser_id AND status IN ('draft','submitted','revision_requested'))
  WITH CHECK (auth.uid() = organiser_id);

CREATE POLICY "organiser delete own drafts" ON public.events
  FOR DELETE TO authenticated USING (auth.uid() = organiser_id AND status = 'draft');

CREATE POLICY "admins view all events"   ON public.events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins update any event"  ON public.events FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- EVENT SPONSORSHIP TIERS (up to 6 per event)
-- ============================================================
CREATE TABLE public.event_sponsorship_tiers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tier_name       TEXT NOT NULL,
  price           NUMERIC NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'NGN' CHECK (currency IN ('NGN','USD','GBP','EUR')),
  price_usd       NUMERIC,  -- locked at submission time using cached FX rate
  assets          TEXT,
  slot_count      INTEGER NOT NULL DEFAULT 1,
  is_exclusive    BOOLEAN NOT NULL DEFAULT FALSE,
  custom_options  TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tiers_event ON public.event_sponsorship_tiers(event_id);

ALTER TABLE public.event_sponsorship_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public view tiers of live events" ON public.event_sponsorship_tiers
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_sponsorship_tiers.event_id AND e.status IN ('approved','listed')
  ));

CREATE POLICY "organiser manage own tiers" ON public.event_sponsorship_tiers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organiser_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organiser_id = auth.uid()));

CREATE POLICY "admins manage all tiers" ON public.event_sponsorship_tiers
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_tiers_updated BEFORE UPDATE ON public.event_sponsorship_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 20260525210008_7f097f61-1d2b-4078-9800-fcba1f7d6639.sql
-- ============================================================

-- Add search_path to set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- handle_new_user is trigger-only; nobody should call it directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role / is_admin: revoke from anon (only authenticated need to evaluate via RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon;

-- ============================================================
-- 20260525213439_797a118c-19a7-4780-8184-cc124d48f81e.sql
-- ============================================================
-- Attach handle_new_user trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ============================================================
-- 20260525213452_832e8d7d-73ef-4cde-8916-9db419d7fd4a.sql
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
-- ============================================================
-- 20260525214234_4f3bcb77-b741-4e72-9f64-d92dc670ae86.sql
-- ============================================================

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

-- ============================================================
-- 20260525214857_05437ad1-82f2-422f-aecf-aaad5d7b8311.sql
-- ============================================================

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

-- ============================================================
-- 20260525215708_323deea5-58b7-43d3-85a9-b40bd619081a.sql
-- ============================================================

-- Storage bucket for event assets (logos, banners, decks)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-assets', 'event-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies: owners write/update/delete in their own folder; everyone reads
DROP POLICY IF EXISTS "event-assets public read" ON storage.objects;
CREATE POLICY "event-assets public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'event-assets');

DROP POLICY IF EXISTS "event-assets owner write" ON storage.objects;
CREATE POLICY "event-assets owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "event-assets owner update" ON storage.objects;
CREATE POLICY "event-assets owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "event-assets owner delete" ON storage.objects;
CREATE POLICY "event-assets owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Slug helper
CREATE OR REPLACE FUNCTION public.generate_event_slug(p_name TEXT, p_city TEXT)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_base TEXT;
  v_candidate TEXT;
  v_n INT := 1;
BEGIN
  v_base := lower(regexp_replace(
    coalesce(p_name,'event') || '-' || coalesce(p_city,'') || '-' || to_char(now(),'YYYY'),
    '[^a-zA-Z0-9]+', '-', 'g'
  ));
  v_base := trim(both '-' from v_base);
  v_candidate := v_base;
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = v_candidate) LOOP
    v_n := v_n + 1;
    v_candidate := v_base || '-' || v_n;
  END LOOP;
  RETURN v_candidate;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.generate_event_slug(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 20260525223523_68e9cf06-41dc-4054-9220-eab8806fbad0.sql
-- ============================================================
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cal_booking_url text;
-- ============================================================
-- 20260530165600_ac47e299-fee4-4342-bd75-bfab5faa6d2d.sql
-- ============================================================
CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audience TEXT NOT NULL CHECK (audience IN ('organiser','sponsor','referral_partner')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  role_title TEXT,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.waitlist_signups TO anon, authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can join waitlist"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "admins view waitlist"
ON public.waitlist_signups
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE INDEX idx_waitlist_signups_audience ON public.waitlist_signups(audience);
CREATE UNIQUE INDEX idx_waitlist_signups_email_audience ON public.waitlist_signups(lower(email), audience);
-- ============================================================
-- 20260531062156_5ce83f08-a6c6-4fff-b713-89205e4a2ca6.sql
-- ============================================================

-- 1. Allow events without an organiser account (curated events)
ALTER TABLE public.events ALTER COLUMN organiser_id DROP NOT NULL;

-- 2. Sponsorship interest table (sponsor-clicked notifications)
CREATE TABLE public.sponsorship_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  event_name TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  role_title TEXT,
  phone TEXT,
  tier_interest TEXT,
  message TEXT,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.sponsorship_interests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.sponsorship_interests TO authenticated;
GRANT ALL ON public.sponsorship_interests TO service_role;

ALTER TABLE public.sponsorship_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can express sponsor interest"
  ON public.sponsorship_interests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admins view sponsor interest"
  ON public.sponsorship_interests FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "admins update sponsor interest"
  ON public.sponsorship_interests FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3. Insert the Itsekiri Homecoming 2026 event
INSERT INTO public.events (
  id, organiser_id, slug, name, event_type, format,
  start_date, end_date, city, country, venue, website,
  organiser_contact_name, organiser_contact_role, organiser_contact_email,
  attendance_size, primary_audience, audience_seniority, decision_makers_pct,
  geographic_mix, primary_sector, event_theme,
  min_sponsorship_spend, currency, exposure_channels,
  speaking_opps, lead_capture, media_partners, post_event_report,
  sponsorship_deck_url, banner_image_url,
  status, ige_vetted, vetted_at, consent_given, consent_given_at,
  form_step_completed
) VALUES (
  gen_random_uuid(),
  NULL,
  'itsekiri-global-homecoming-2026-warri',
  'Itsekiri Global Homecoming 2026',
  'Cultural Festival',
  'in-person',
  '2026-08-16',
  '2026-08-23',
  'Warri',
  'Nigeria',
  'Warri Kingdom, Delta State',
  'https://itsekiriglobalhomecoming.com',
  'Alero Boyo',
  'Sponsorship Lead',
  'hi@insideglobalevents.com',
  20000,
  '["Diaspora professionals", "HNIs & Corporate", "Women entrepreneurs", "Youth & Students", "Community leaders"]'::jsonb,
  'C-suite & senior leaders',
  60,
  '["Nigeria", "United Kingdom", "United States", "Canada", "Europe", "Australia"]'::jsonb,
  'Culture & Heritage',
  'Reconnecting Heritage, Rebuilding Home — 5th Coronation Anniversary of His Majesty Ogiame Atuwatse III, Olu of Warri.',
  5000000,
  'NGN',
  '["TV broadcast", "National radio", "Social media (1B reach)", "Website", "Print media", "YouTube livestream"]'::jsonb,
  true, true,
  '["National broadcast partners", "Delta State radio", "Major Nigerian dailies"]'::jsonb,
  true,
  '/decks/itsekiri-homecoming-2026.pdf',
  '/events/itsekiri-homecoming-2026-banner.jpg',
  'listed',
  true,
  now(),
  true,
  now(),
  9
);

-- 4. Sponsorship tiers from the deck
WITH ev AS (SELECT id FROM public.events WHERE slug = 'itsekiri-global-homecoming-2026-warri')
INSERT INTO public.event_sponsorship_tiers (event_id, tier_name, price, currency, slots_total, slots_remaining, assets, display_order)
SELECT ev.id, t.tier_name, t.price, 'NGN', t.slots, t.slots, t.assets::jsonb, t.ord FROM ev, (VALUES
  ('Royal Patron', 150000000, 1, 1, '["Title sponsor naming rights", "Exclusive digital content partnership", "Anchor CSR sponsor", "Full activation zone + 8-course menu naming"]'),
  ('Sovereign',     75000000, 2, 2, '["Official co-presenter on all major collateral", "Dedicated branded activation zone", "Branded social content series", "Named co-sponsor of CSR / Children Education / Tech Hub"]'),
  ('Platinum',      40000000, 3, 3, '["Title sponsor of a signature experience (Regatta / Gala / Conference)", "VIP passes", "Premium seats at the Queen''s Business Conference", "Branded activation space at the main venue"]'),
  ('Gold',          20000000, 4, 5, '["Activity sponsor (Football / Bike Race / Tech Hub)", "4 VIP day passes", "Logo on banners & selected event materials", "Quarter-page programme advert"]'),
  ('Silver',        10000000, 5, 8, '["Sub-activity / workshop naming rights", "2 VIP day passes", "Social media brand mention", "Listed in event programme"]'),
  ('Associate',      5000000, 6, 10,'["Associate partner listing", "1 general day pass", "Social media shout-out"]')
) AS t(tier_name, price, ord, slots, assets);

-- ============================================================
-- 20260601064715_fed013ed-67ff-49c9-9cea-1c63c1b418f0.sql
-- ============================================================
-- Extend waitlist_signups for full intake forms
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS consent_given boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_audience ON public.waitlist_signups(audience);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_status ON public.waitlist_signups(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON public.waitlist_signups(created_at DESC);
-- ============================================================
-- 20260601153335_email_infra.sql
-- ============================================================
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no longer grants public-schema access to service_role by default;
-- emit the grant explicitly so edge functions can reach the table via PostgREST.
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT ALL ON public.suppressed_emails TO service_role;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');

-- ============================================================
-- 20260601153347_email_infra.sql
-- ============================================================
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no longer grants public-schema access to service_role by default;
-- emit the grant explicitly so edge functions can reach the table via PostgREST.
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT ALL ON public.suppressed_emails TO service_role;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');

-- ============================================================
-- 20260601154246_email_infra.sql
-- ============================================================
-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no longer grants public-schema access to service_role by default;
-- emit the grant explicitly so edge functions can reach the table via PostgREST.
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read send log"
    ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert send log"
    ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update send log"
    ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage send state"
    ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT ALL ON public.suppressed_emails TO service_role;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read suppressed emails"
    ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert suppressed emails"
    ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can read tokens"
    ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can insert tokens"
    ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can mark tokens as used"
    ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');

-- ============================================================
-- 20260601155432_a004bdb1-bdef-40cf-bd50-3082786a04b7.sql
-- ============================================================
-- 1) Hide organiser contact PII and internal fields from anon (and from authenticated where appropriate).
-- Column-level REVOKE blocks direct REST/PostgREST access to these columns;
-- our public marketplace server functions use the service role and remain unaffected.
REVOKE SELECT (
  organiser_contact_email,
  organiser_contact_phone,
  organiser_contact_name,
  organiser_contact_role,
  vetting_notes,
  rejection_reason,
  form_data_draft
) ON public.events FROM anon;

-- Also hide vetting/rejection/draft notes from arbitrary authenticated users
-- (organisers still see them because RLS row matches and grants apply at table level).
REVOKE SELECT (vetting_notes, rejection_reason) ON public.events FROM authenticated;
GRANT SELECT (vetting_notes, rejection_reason) ON public.events TO authenticated;
-- Re-grant to authenticated so organisers (matched by RLS) can read them; anon stays revoked.

-- 2) organiser_profiles: hide internal fields from anonymous visitors.
REVOKE SELECT (event_history, track_record, past_sponsor_logos) ON public.organiser_profiles FROM anon;

-- 3) Storage: remove broad public listing of event-assets.
-- Public download URLs (/storage/v1/object/public/...) bypass RLS, so this does not
-- break the deck download flow. It only stops anon from enumerating bucket contents.
DROP POLICY IF EXISTS "event-assets public read" ON storage.objects;

-- Authenticated users can still list/read assets (needed for organiser dashboards & sponsors).
CREATE POLICY "event-assets authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'event-assets');

-- 4) Lock down email-queue SECURITY DEFINER helpers; only the service role
-- (used by the process-email-queue server route) should invoke them.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- 5) Pin an explicit search_path on the email helpers so schema resolution
-- can't be hijacked by a malicious search_path on the caller's session.
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
-- ============================================================
-- 20260601155501_9301a1a4-c659-41e1-b1bf-6c7e494b04a3.sql
-- ============================================================
-- waitlist_signups: replace WITH CHECK (true) with explicit validation
DROP POLICY IF EXISTS "anyone can join waitlist" ON public.waitlist_signups;
CREATE POLICY "anyone can join waitlist"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  full_name IS NOT NULL AND length(full_name) BETWEEN 1 AND 200
  AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 320
  AND audience IS NOT NULL AND length(audience) BETWEEN 1 AND 80
  AND consent_given = true
);

-- sponsorship_interests: same treatment
DROP POLICY IF EXISTS "anyone can express sponsor interest" ON public.sponsorship_interests;
CREATE POLICY "anyone can express sponsor interest"
ON public.sponsorship_interests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  full_name IS NOT NULL AND length(full_name) BETWEEN 1 AND 200
  AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 320
);
-- ============================================================
-- 20260601160925_f80e4ca6-5068-4362-8233-d1a18a483927.sql
-- ============================================================
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins view contact submissions"
  ON public.contact_submissions FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "admins update contact submissions"
  ON public.contact_submissions FOR UPDATE TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions (created_at DESC);
