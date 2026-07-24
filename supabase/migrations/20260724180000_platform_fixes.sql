-- Featured events (admin toggles from vetting queue)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_featured_live
  ON public.events (is_featured, start_date)
  WHERE is_featured = true AND status IN ('approved', 'listed');

-- Sponsor budget: separate region + budget name
ALTER TABLE public.market_budgets
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT '';

ALTER TABLE public.market_budgets
  ADD COLUMN IF NOT EXISTS budget_name TEXT;

UPDATE public.market_budgets
SET budget_name = market_name
WHERE budget_name IS NULL;

ALTER TABLE public.market_budgets
  ALTER COLUMN budget_name SET NOT NULL;

COMMENT ON COLUMN public.events.is_featured IS 'Shown in featured sections when event is approved or listed';
COMMENT ON COLUMN public.market_budgets.region IS 'Geographic market e.g. Nigeria, UK';
COMMENT ON COLUMN public.market_budgets.budget_name IS 'Budget line name e.g. Q3 EMEA spend';
