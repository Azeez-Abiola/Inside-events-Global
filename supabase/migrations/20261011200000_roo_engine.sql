-- =====================================================================
-- Return on Objective engine, Business Case and Investment Report
-- (TAB 4 §4.1 Sponsorship Setup Flow, TAB 8 §8.2–8.6)
--
-- Every sponsorship is measured against the objectives the brand set for it,
-- weighted by spend (IEG's Return on Sponsorship approach, credited in TAB 8
-- §8.1). Weights lock once confirmed so the scorecard cannot be quietly
-- rewritten afterwards; only an admin override, logged, can change them.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.sector_packs (
  id                  TEXT PRIMARY KEY,
  pack_name           TEXT NOT NULL,
  default_objectives  TEXT[] NOT NULL,
  default_weights     SMALLINT[] NOT NULL,
  default_kpis        TEXT[] NOT NULL,
  pillar_emphasis     TEXT NOT NULL,
  -- Indicative benchmark range, always labelled "Industry reference" until
  -- IGE has enough of its own closed deals (TAB 8 §8.6).
  benchmark_note      TEXT,
  position            SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO public.sector_packs (id, pack_name, default_objectives, default_weights, default_kpis, pillar_emphasis, benchmark_note, position) VALUES
  ('fmcg', 'FMCG / consumer goods', ARRAY['Product trial','Awareness','Sales lift'], ARRAY[40,35,25]::SMALLINT[], ARRAY['Sampling units','Outlet reach','Brand recall','Sales lift','Share of voice'], 'Brand + business', 'Industry reference', 1),
  ('b2b_tech', 'B2B / tech / SaaS', ARRAY['Lead generation','Product trial','Awareness'], ARRAY[50,30,20]::SMALLINT[], ARRAY['MQLs / SQLs','Pipeline value','Cost per qualified lead','Demo requests'], 'Business', 'Industry reference', 2),
  ('financial', 'Financial services / insurance', ARRAY['Awareness','Relationship-building','Community / ESG positioning'], ARRAY[40,35,25]::SMALLINT[], ARRAY['Trust sentiment','Consideration shift','Share of voice'], 'Brand', 'Industry reference', 3),
  ('retail', 'Retail / e-commerce', ARRAY['Sales lift','Product trial','Awareness'], ARRAY[50,25,25]::SMALLINT[], ARRAY['Footfall','Redemption rate','Conversion rate','Basket size lift'], 'Business', 'Industry reference', 4),
  ('telecoms', 'Telecoms / consumer tech hardware', ARRAY['Sales lift','Lead generation','Awareness'], ARRAY[40,30,30]::SMALLINT[], ARRAY['New activations','App downloads','NPS shift','Qualified leads'], 'Business + brand', 'Industry reference', 5),
  ('agency', 'Agency-managed portfolio', ARRAY['Awareness','Lead generation','Relationship-building'], ARRAY[34,33,33]::SMALLINT[], ARRAY['Portfolio ROO roll-up','Comparative ROI Score','Category share of voice'], 'Money (portfolio efficiency)', 'Industry reference', 6)
ON CONFLICT (id) DO NOTHING;

-- One row per objective per deal.
CREATE TABLE IF NOT EXISTS public.objective_weights (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  objective_name    TEXT NOT NULL,
  spend_weight_pct  SMALLINT NOT NULL CHECK (spend_weight_pct BETWEEN 0 AND 100),
  pillar            TEXT NOT NULL CHECK (pillar IN ('money', 'brand', 'business')),
  kpi               TEXT,
  target_value      NUMERIC(16,2),
  achieved_value    NUMERIC(16,2),
  -- Marked rather than omitted when not automatically captured (TAB 8 §8.5).
  is_self_reported  BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (deal_id, objective_name)
);

CREATE TABLE IF NOT EXISTS public.sponsorship_setups (
  deal_id       UUID PRIMARY KEY REFERENCES public.deals(id) ON DELETE CASCADE,
  sector_pack_id TEXT REFERENCES public.sector_packs(id) ON DELETE SET NULL,
  locked_at     TIMESTAMPTZ,
  locked_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Admin override history, so a changed scorecard is always explainable.
  override_log  JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.investment_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  -- Value for money / brand / business inputs (TAB 8 §8.2).
  rights_fee      NUMERIC(16,2),
  fair_market_value NUMERIC(16,2),
  attendees_reached INTEGER,
  leads_captured  INTEGER,
  pipeline_value  NUMERIC(16,2),
  awareness_lift_pct NUMERIC(6,2),
  sentiment_note  TEXT,
  competitors_present TEXT,
  outlook_90_day  TEXT,
  renewal_recommended BOOLEAN,
  roi_score       SMALLINT CHECK (roi_score IS NULL OR roi_score BETWEEN 1 AND 100),
  generated_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['objective_weights','sponsorship_setups','investment_reports'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "parties read %1$s" ON public.%1$I', t);
    EXECUTE format($f$
      CREATE POLICY "parties read %1$s" ON public.%1$I
        FOR SELECT TO authenticated
        USING (
          public.is_admin(auth.uid())
          OR EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.organiser_id = auth.uid() OR d.sponsor_user_id = auth.uid()))
        )
    $f$, t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

ALTER TABLE public.sector_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone signed in reads packs" ON public.sector_packs;
CREATE POLICY "anyone signed in reads packs" ON public.sector_packs FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.sector_packs TO authenticated;
GRANT ALL ON public.sector_packs TO service_role;
