-- Profile display fields + media partner profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE TABLE IF NOT EXISTS public.media_partner_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  outlet_name     TEXT NOT NULL DEFAULT '',
  outlet_type     TEXT,
  beat_sectors    JSONB NOT NULL DEFAULT '[]',
  portfolio_url   TEXT,
  bio             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_partner_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media view own profile" ON public.media_partner_profiles;
CREATE POLICY "media view own profile" ON public.media_partner_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "media manage own profile" ON public.media_partner_profiles;
CREATE POLICY "media manage own profile" ON public.media_partner_profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins view media profiles" ON public.media_partner_profiles;
CREATE POLICY "admins view media profiles" ON public.media_partner_profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admins update media profiles" ON public.media_partner_profiles;
CREATE POLICY "admins update media profiles" ON public.media_partner_profiles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_media_partner_profiles_updated ON public.media_partner_profiles;
CREATE TRIGGER trg_media_partner_profiles_updated BEFORE UPDATE ON public.media_partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
