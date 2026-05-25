
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
