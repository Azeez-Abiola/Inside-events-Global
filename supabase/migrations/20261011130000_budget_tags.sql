-- =====================================================================
-- Marketing Budget sector tagging (TAB 4 §4.1 Module 1) — Section B
--
-- "Sector Tagging: budget tagged to sectors and event types the brand wants
--  to sponsor. Drives the daily feed (Module 3)."
-- =====================================================================

ALTER TABLE public.market_budgets
  ADD COLUMN IF NOT EXISTS sector_tags     TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS event_type_tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_market_budgets_sector_tags
  ON public.market_budgets USING GIN (sector_tags);
