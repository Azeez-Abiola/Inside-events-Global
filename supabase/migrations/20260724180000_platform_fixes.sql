-- Featured events (admin toggles from vetting queue)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_featured_live
  ON public.events (is_featured, start_date)
  WHERE is_featured = true AND status IN ('approved', 'listed');

-- Market budgets: base table may never have been applied on this project
CREATE TABLE IF NOT EXISTS public.market_budgets (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_name              TEXT NOT NULL,
  region                   TEXT NOT NULL DEFAULT '',
  budget_name              TEXT NOT NULL DEFAULT '',
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

DROP POLICY IF EXISTS "sponsor manage own budgets" ON public.market_budgets;
CREATE POLICY "sponsor manage own budgets" ON public.market_budgets
  FOR ALL TO authenticated
  USING (auth.uid() = sponsor_user_id)
  WITH CHECK (auth.uid() = sponsor_user_id);

DROP POLICY IF EXISTS "admins view budgets" ON public.market_budgets;
CREATE POLICY "admins view budgets" ON public.market_budgets
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_market_budgets_updated ON public.market_budgets;
CREATE TRIGGER trg_market_budgets_updated BEFORE UPDATE ON public.market_budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_market_budgets_sponsor ON public.market_budgets (sponsor_user_id);

-- Upgrade older market_budgets tables (created before region / budget_name)
ALTER TABLE public.market_budgets
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT '';

ALTER TABLE public.market_budgets
  ADD COLUMN IF NOT EXISTS budget_name TEXT;

UPDATE public.market_budgets
SET budget_name = market_name
WHERE budget_name IS NULL OR budget_name = '';

ALTER TABLE public.market_budgets
  ALTER COLUMN budget_name SET DEFAULT '';

ALTER TABLE public.market_budgets
  ALTER COLUMN budget_name SET NOT NULL;

COMMENT ON COLUMN public.events.is_featured IS 'Shown in featured sections when event is approved or listed';
COMMENT ON COLUMN public.market_budgets.region IS 'Geographic market e.g. Nigeria, UK';
COMMENT ON COLUMN public.market_budgets.budget_name IS 'Budget line name e.g. Q3 EMEA spend';
