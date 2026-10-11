-- =====================================================================
-- Vendors and Payments (TAB 4 §4.4.6, new in v6.3) — Section B
--
-- "The workspace layer also lets every user manage the vendors they work with
--  and track the money moving in and out of each event or project. IGE
--  records and tracks these payments; it does not move money for them."
--
-- Media Partner and Referral Partner accounts get Payments only — that split
-- is enforced in the server functions, not here, because it is a product rule
-- about roles rather than a data-access rule about workspaces.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.vendor_category AS ENUM (
    'venue', 'decor', 'sound', 'lighting', 'catering', 'printing',
    'logistics', 'security', 'media', 'talent', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_direction AS ENUM ('in', 'out');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Due and Overdue are also derived on read from due_on, so a payment nobody
-- touched still turns Overdue on the right day.
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('scheduled', 'due', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Vendor directory ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vendors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  category          public.vendor_category NOT NULL DEFAULT 'other',
  contact_person    TEXT,
  phone             TEXT,
  email             TEXT,
  -- A reference to where the bank or payment details live, never the account
  -- number itself (TAB 12 §12.5: no bank account numbers stored by IGE).
  payment_reference TEXT,
  rating            SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_workspace ON public.vendors(workspace_id, category);

-- ─── Quotes, invoices and contracts ──────────────────────────────────────────
-- "Upload quotes, invoices and contracts per vendor and per event; compare
--  quotes; mark the chosen vendor."

CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vendor_id    UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  event_id     UUID REFERENCES public.events(id) ON DELETE SET NULL,
  kind         TEXT NOT NULL DEFAULT 'quote' CHECK (kind IN ('quote', 'invoice', 'contract')),
  title        TEXT NOT NULL,
  file_url     TEXT,
  amount       NUMERIC(14,2),
  currency     TEXT NOT NULL DEFAULT 'NGN (₦)',
  -- Only meaningful on quotes: the one picked out of the comparison.
  is_chosen    BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor ON public.vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_event ON public.vendor_documents(event_id);

-- ─── Assignments ─────────────────────────────────────────────────────────────
-- "Link vendors to events, activations and tasks, with delivery dates on the
--  Event Calendar."

CREATE TABLE IF NOT EXISTS public.vendor_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  event_id      UUID REFERENCES public.events(id) ON DELETE CASCADE,
  activation_id UUID REFERENCES public.activations(id) ON DELETE CASCADE,
  deliverable   TEXT NOT NULL,
  delivery_on   DATE,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_assignments_vendor ON public.vendor_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_assignments_delivery
  ON public.vendor_assignments(workspace_id, delivery_on);

-- ─── Payments in and out ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspace_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  direction    public.payment_direction NOT NULL,
  event_id     UUID REFERENCES public.events(id) ON DELETE SET NULL,
  vendor_id    UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  -- Who paid or is paid when it is not a vendor: a sponsor, a partner, a client.
  counterparty TEXT,
  description  TEXT,
  amount       NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency     TEXT NOT NULL DEFAULT 'NGN (₦)',
  is_partial   BOOLEAN NOT NULL DEFAULT false,
  due_on       DATE,
  paid_on      DATE,
  status       public.payment_status NOT NULL DEFAULT 'scheduled',
  method       TEXT,
  receipt_url  TEXT,
  notes        TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_payments_workspace
  ON public.workspace_payments(workspace_id, direction, status);
CREATE INDEX IF NOT EXISTS idx_workspace_payments_due
  ON public.workspace_payments(workspace_id, due_on);
CREATE INDEX IF NOT EXISTS idx_workspace_payments_event ON public.workspace_payments(event_id);

-- ─── Planned budget per event ────────────────────────────────────────────────
-- The "planned budget" half of budget versus actual. One row per event per
-- workspace; committed, paid out and received in are summed from payments.

CREATE TABLE IF NOT EXISTS public.event_budgets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id       UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  planned_amount NUMERIC(14,2) NOT NULL CHECK (planned_amount >= 0),
  currency       TEXT NOT NULL DEFAULT 'NGN (₦)',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, event_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['vendors','vendor_documents','vendor_assignments','workspace_payments','event_budgets'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "members read %1$s" ON public.%1$I', t);
    EXECUTE format($f$
      CREATE POLICY "members read %1$s" ON public.%1$I
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id, auth.uid()) OR public.is_admin(auth.uid()))
    $f$, t);

    EXECUTE format('DROP POLICY IF EXISTS "editors write %1$s" ON public.%1$I', t);
    EXECUTE format($f$
      CREATE POLICY "editors write %1$s" ON public.%1$I
        FOR ALL TO authenticated
        USING (public.can_edit_workspace(workspace_id, auth.uid()))
        WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()))
    $f$, t);

    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;
