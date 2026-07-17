ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dashboard_tours_completed JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profiles.dashboard_tours_completed IS
  'Per-role dashboard tour completion flags, e.g. {"sponsor": true, "organiser": true}';
