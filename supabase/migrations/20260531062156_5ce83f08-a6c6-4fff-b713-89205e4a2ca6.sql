
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
