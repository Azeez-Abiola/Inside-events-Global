-- =====================================================================
-- Deliverable Matrix & Contract Compliance (TAB 4 §4.1 Module 5)
--
-- "Sponsoring organisations at every scale lose renewal revenue when there is
--  no systematic record of what was promised against what was delivered."
-- Per deal: an itemised matrix with proof of delivery, a category-exclusivity
-- check across the event's other deals, and an approval workflow for creative
-- with a turnaround window that escalates when missed.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.deliverable_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  asset_type        TEXT NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  placement_channel TEXT,
  due_date          DATE,
  -- Which side is responsible for fulfilment.
  owner_side        TEXT NOT NULL DEFAULT 'organiser' CHECK (owner_side IN ('organiser', 'sponsor')),
  owner_name        TEXT,
  status            TEXT NOT NULL DEFAULT 'promised'
                      CHECK (status IN ('promised', 'in_progress', 'delivered', 'changed', 'missed')),
  -- Required before a line can be marked Delivered.
  proof_url         TEXT,
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT delivered_needs_proof CHECK (status <> 'delivered' OR (proof_url IS NOT NULL AND proof_url <> ''))
);

CREATE INDEX IF NOT EXISTS idx_deliverable_items_deal ON public.deliverable_items(deal_id, due_date);

CREATE TABLE IF NOT EXISTS public.exclusivity_flags (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  deal_id             UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  declared_category   TEXT NOT NULL,
  conflicting_deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  flagged_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolution_status   TEXT NOT NULL DEFAULT 'open' CHECK (resolution_status IN ('open', 'resolved', 'dismissed')),
  resolution_note     TEXT,
  resolved_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (deal_id, conflicting_deal_id)
);

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  item_id           UUID REFERENCES public.deliverable_items(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  content_url       TEXT NOT NULL,
  requested_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- The approver is the other side of the deal.
  approver_side     TEXT NOT NULL CHECK (approver_side IN ('organiser', 'sponsor')),
  -- Default 5 business days (§Module 5).
  turnaround_due_at TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'changes_requested', 'escalated')),
  response_note     TEXT,
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_deal ON public.approval_requests(deal_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_due ON public.approval_requests(status, turnaround_due_at);

-- Server functions check deal membership; RLS is the backstop.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['deliverable_items','exclusivity_flags','approval_requests'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "parties read %1$s" ON public.%1$I', t);
    EXECUTE format($f$
      CREATE POLICY "parties read %1$s" ON public.%1$I
        FOR SELECT TO authenticated
        USING (
          public.is_admin(auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.deals d
            WHERE d.id = deal_id AND (d.organiser_id = auth.uid() OR d.sponsor_user_id = auth.uid())
          )
        )
    $f$, t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;
