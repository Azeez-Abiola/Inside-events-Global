-- =====================================================================
-- Partnerships Pro and Creative Hub roles (TAB 2 §2.2, TAB 3 §3.6.5–3.6.6)
--
-- v6.2 rebuilt both as full roles with their own onboarding schemas and
-- dashboards. The app_role enum still carried only the original four public
-- roles, so neither could be assigned — the onboarding wizard had nowhere to
-- write the role to.
--
-- ADD VALUE is safe inside a migration transaction on PG12+ so long as the new
-- value is not also *used* in the same transaction, which is why the seeding
-- and backfill (if any) belong in a later migration, not this one.
-- =====================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partnerships_pro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'creative_hub';
