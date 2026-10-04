-- =====================================================================
-- Information tips glossary (TAB 3 §3.2, v6.3)
--
-- "every section title and every field label carries a small italic 'i' icon.
--  Hovering (desktop) or tapping (mobile) shows a short, plain-language
--  explanation of what the section or field means and why IGE asks for it.
--  Tip text is stored in a CMS-managed glossary so Admin can edit it without
--  a release."
--
-- Code ships a default glossary (src/lib/info-tips.ts). This table holds Admin
-- overrides only, so an empty or unreachable table degrades to the defaults
-- rather than leaving the platform with no tips at all.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.glossary_tips (
  tip_key     TEXT PRIMARY KEY,
  body        TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.glossary_tips IS
  'Admin overrides for the italic "i" information tips. Keys match INFO_TIPS in src/lib/info-tips.ts; a missing row falls back to the shipped default.';

ALTER TABLE public.glossary_tips ENABLE ROW LEVEL SECURITY;

-- Tips appear on public marketing surfaces as well as signed-in ones.
DROP POLICY IF EXISTS "anyone reads glossary tips" ON public.glossary_tips;
CREATE POLICY "anyone reads glossary tips" ON public.glossary_tips
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admins manage glossary tips" ON public.glossary_tips;
CREATE POLICY "admins manage glossary tips" ON public.glossary_tips
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
