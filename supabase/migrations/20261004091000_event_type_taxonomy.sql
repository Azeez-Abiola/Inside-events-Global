-- =====================================================================
-- Map legacy event types onto the 37-type taxonomy (v6.4, Appendix B)
--
-- `events.event_type` is free TEXT, so nothing breaks structurally when the
-- dropdown changes — but a listing holding "Fashion Week" would stop matching
-- any filter and would show blank in the editor. This maps every legacy value
-- IGE can map with confidence, and deliberately leaves the ambiguous ones
-- alone rather than guessing on a live listing.
-- =====================================================================

-- Unambiguous renames: same event, new name in the taxonomy.
UPDATE public.events SET event_type = 'Summit'                      WHERE event_type IN ('Business Summit', 'Conference / Summit / Business Forum');
UPDATE public.events SET event_type = 'Music or Entertainment Event' WHERE event_type IN ('Music', 'Music Festival / Concert');
UPDATE public.events SET event_type = 'Fashion Event'                WHERE event_type IN ('Fashion Week', 'Fashion Show / Showcase');
UPDATE public.events SET event_type = 'Diaspora Event'               WHERE event_type IN ('Diaspora Gathering', 'Diaspora / Community Gathering');
UPDATE public.events SET event_type = 'Award Ceremony'               WHERE event_type IN ('Awards', 'Industry Awards');
UPDATE public.events SET event_type = 'Gala Night'                   WHERE event_type IN ('Gala', 'Gala Dinner / Fundraiser', 'Charity / Non-Profit Gala');
UPDATE public.events SET event_type = 'Industry Expo'                WHERE event_type IN ('Trade Fair', 'Trade Show / Expo');
UPDATE public.events SET event_type = 'Corporate Networking Mixer'   WHERE event_type = 'Networking Mixer';
UPDATE public.events SET event_type = 'Startup Pitch Event'          WHERE event_type = 'Hackathon / Pitch Competition';
UPDATE public.events SET event_type = 'Workshop'                     WHERE event_type = 'Workshop / Masterclass';
UPDATE public.events SET event_type = 'Executive Roundtable'         WHERE event_type = 'Roundtable / Boardroom';
UPDATE public.events SET event_type = 'Investor Demo Day'            WHERE event_type = 'Investor / VC Day';
UPDATE public.events SET event_type = 'Brand Activation Event'       WHERE event_type = 'Brand Activation';
UPDATE public.events SET event_type = 'Pop-up Event'                 WHERE event_type = 'Pop-up Experience';
UPDATE public.events SET event_type = 'Government or Policy Event'   WHERE event_type = 'Government / Public Sector Forum';

-- Sector-flavoured legacy values: the taxonomy classifies by format, and every
-- one of these was a conference in practice. The sector itself is already
-- captured on the listing, so nothing is lost.
UPDATE public.events SET event_type = 'Conference'
WHERE event_type IN (
  'Tech', 'Tech Conference', 'Fintech / Banking Summit', 'Energy / Power Summit',
  'Health & Wellness Summit', 'Education / EdTech Forum', 'Telecoms / ICT Forum',
  'Media / Creator Conference'
);

UPDATE public.events SET event_type = 'Industry Expo'
WHERE event_type IN ('Real Estate / PropTech Expo', 'Travel & Tourism Expo');

UPDATE public.events SET event_type = 'Community Meetup'
WHERE event_type IN ('Food', 'Food & Beverage Event', 'Religious / Faith-Based Event');

UPDATE public.events SET event_type = 'Brand Activation Event'
WHERE event_type IN ('Agriculture / AgriTech Event', 'Automotive / Mobility Event', 'Beauty / Lifestyle Event');

UPDATE public.events SET event_type = 'Cultural Festival' WHERE event_type = 'Film Festival / Premiere';

-- Left alone on purpose: 'Sports', 'Sports Tournament' and 'Real-time Sports
-- Viewing' have no honest home in the 37 — the taxonomy has no sports type.
-- 'Other' stays 'Other'. Report what is left so Admin can reclassify by hand
-- instead of the migration inventing an answer.
DO $$
DECLARE unmapped RECORD;
BEGIN
  FOR unmapped IN
    SELECT event_type, count(*) AS n
    FROM public.events
    WHERE event_type IS NOT NULL
      AND event_type NOT IN (
        'Conference','Summit','Trade Mission','Business Forum','Industry Expo','Exhibition',
        'Product Launch','Brand Activation Event','Corporate Networking Mixer','Executive Roundtable',
        'Private Dinner','Investor Demo Day','Startup Pitch Event','Founder Meetup','Community Meetup',
        'Cultural Festival','Music or Entertainment Event','Fashion Event','Art Exhibition',
        'Award Ceremony','Gala Night','Workshop','Masterclass','Training Programme','Bootcamp',
        'Retreat','Roadshow','Pop-up Event','University or Campus Event','CSR or Impact Event',
        'Government or Policy Event','Diaspora Event','Market Entry Event','Launch Tour',
        'Hybrid Event','Virtual Event','Webinar Series'
      )
    GROUP BY event_type ORDER BY n DESC
  LOOP
    RAISE NOTICE 'Unmapped event_type "%" on % listing(s) — reclassify in Admin.', unmapped.event_type, unmapped.n;
  END LOOP;
END $$;
