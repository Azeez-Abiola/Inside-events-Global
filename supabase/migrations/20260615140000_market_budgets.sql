-- ============================================================
-- MARKET BUDGETS — Sponsorship Command Center, Module 1 (PRD v3.4 §08.1)
-- A brand plans one budget per market it sponsors in. Committed / Paid /
-- Remaining are derived from the sponsor's deals at read time.
-- ============================================================
CREATE TABLE public.market_budgets (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_name              TEXT NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'USD',
  fiscal_year_start_month  SMALLINT NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  total_annual             NUMERIC NOT NULL DEFAULT 0 CHECK (total_annual >= 0),
  q1_allocation            NUMERIC NOT NULL DEFAULT 0 CHECK (q1_allocation >= 0),
  q2_allocation            NUMERIC NOT NULL DEFAULT 0 CHECK (q2_allocation >= 0),
  q3_allocation            NUMERIC NOT NULL DEFAULT 0 CHECK (q3_allocation >= 0),
  q4_allocation            NUMERIC NOT NULL DEFAULT 0 CHECK (q4_allocation >= 0),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sponsor_user_id, market_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_budgets TO authenticated;
GRANT ALL ON public.market_budgets TO service_role;

ALTER TABLE public.market_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor manage own budgets" ON public.market_budgets
  FOR ALL TO authenticated
  USING (auth.uid() = sponsor_user_id)
  WITH CHECK (auth.uid() = sponsor_user_id);

CREATE POLICY "admins view budgets" ON public.market_budgets
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_market_budgets_updated BEFORE UPDATE ON public.market_budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_market_budgets_sponsor ON public.market_budgets (sponsor_user_id);
