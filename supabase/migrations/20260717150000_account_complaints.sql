CREATE TABLE public.account_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.account_complaints TO authenticated;
GRANT ALL ON public.account_complaints TO service_role;

ALTER TABLE public.account_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own complaints"
  ON public.account_complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins view account complaints"
  ON public.account_complaints FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "admins update account complaints"
  ON public.account_complaints FOR UPDATE TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE INDEX idx_account_complaints_created_at ON public.account_complaints (created_at DESC);
CREATE INDEX idx_account_complaints_user_id ON public.account_complaints (user_id);
