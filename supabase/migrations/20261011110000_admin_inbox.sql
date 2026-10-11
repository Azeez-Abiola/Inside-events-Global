-- =====================================================================
-- Message IGE and the Admin Inbox (TAB 4 §4.4.4, TAB 6 §6.10) — Section B
--
-- "Users can send IGE Admin a message, a request or a question. Only Admin
--  receives it; users cannot see or message other users." (§4.4.4)
--
-- "Admin Inbox: one threaded inbox for every Message IGE conversation, Email
--  Admin form, Live Chat hand-off, co-creation interest, IGE Services meeting
--  request, ABW Consulting lead, PartnerUp Tribe join request and password
--  reset notification, assignable to an admin with a status and an SLA
--  timer." (§6.10)
--
-- So a thread is between one person (a user, or a visitor known only by name
-- and email) and the IGE team as a whole — never between two users. That is
-- what replaces the old user-to-user `messages` table (TAB 19 §19.1A).
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.inbox_status AS ENUM ('new', 'in_progress', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.admin_inbox_threads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Null for visitors who are not signed in (Email Admin form, IGE Services
  -- request, Tribe join form). contact_name/contact_email carry who they are.
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name      TEXT,
  contact_email     TEXT,
  -- message | request | question | email_admin | co_creation | ige_services |
  -- abw_consulting | tribe_join | password_reset | complaint | admin_access |
  -- system. Free text so a new source never needs a migration.
  source            TEXT NOT NULL DEFAULT 'message',
  subject           TEXT NOT NULL,
  status            public.inbox_status NOT NULL DEFAULT 'new',
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sla_due_at        TIMESTAMPTZ,
  -- Structured fields from forms (services ticked, engagement type, …).
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_message_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unread markers on each side, so the badge counts are cheap.
  unread_for_admin  BOOLEAN NOT NULL DEFAULT true,
  unread_for_user   BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inbox_threads_user ON public.admin_inbox_threads(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_threads_status ON public.admin_inbox_threads(status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_threads_source ON public.admin_inbox_threads(source);

CREATE TABLE IF NOT EXISTS public.admin_inbox_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES public.admin_inbox_threads(id) ON DELETE CASCADE,
  sender_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_admin BOOLEAN NOT NULL DEFAULT false,
  -- Admin-only notes on a thread; never shown to the user.
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_thread ON public.admin_inbox_messages(thread_id, created_at);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Server functions use the service role; these policies are the backstop for
-- any direct client read.

ALTER TABLE public.admin_inbox_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_inbox_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own or admin read threads" ON public.admin_inbox_threads;
CREATE POLICY "own or admin read threads" ON public.admin_inbox_threads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin write threads" ON public.admin_inbox_threads;
CREATE POLICY "admin write threads" ON public.admin_inbox_threads
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "own or admin read messages" ON public.admin_inbox_messages;
CREATE POLICY "own or admin read messages" ON public.admin_inbox_messages
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      NOT is_internal_note
      AND EXISTS (
        SELECT 1 FROM public.admin_inbox_threads t
        WHERE t.id = thread_id AND t.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "admin write messages" ON public.admin_inbox_messages;
CREATE POLICY "admin write messages" ON public.admin_inbox_messages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.admin_inbox_threads, public.admin_inbox_messages TO authenticated;
GRANT ALL ON public.admin_inbox_threads, public.admin_inbox_messages TO service_role;
