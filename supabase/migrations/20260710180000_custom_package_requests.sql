-- Custom sponsorship package requests (separate from standard commitment forms)
CREATE TABLE IF NOT EXISTS public.custom_package_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_title TEXT,
  company_name TEXT NOT NULL,
  company_linkedin_url TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  budget_range_min NUMERIC,
  budget_range_max NUMERIC,
  package_brief TEXT NOT NULL,
  deliverables_wanted TEXT,
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'converted', 'declined')),
  referral_link_id UUID REFERENCES public.referral_links(id) ON DELETE SET NULL,
  referral_partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_package_requests_event_idx ON public.custom_package_requests(event_id);
CREATE INDEX IF NOT EXISTS custom_package_requests_status_idx ON public.custom_package_requests(status);

ALTER TABLE public.custom_package_requests ENABLE ROW LEVEL SECURITY;
