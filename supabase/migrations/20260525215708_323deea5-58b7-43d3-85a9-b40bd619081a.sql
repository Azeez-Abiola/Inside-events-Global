
-- Storage bucket for event assets (logos, banners, decks)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-assets', 'event-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies: owners write/update/delete in their own folder; everyone reads
DROP POLICY IF EXISTS "event-assets public read" ON storage.objects;
CREATE POLICY "event-assets public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'event-assets');

DROP POLICY IF EXISTS "event-assets owner write" ON storage.objects;
CREATE POLICY "event-assets owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "event-assets owner update" ON storage.objects;
CREATE POLICY "event-assets owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "event-assets owner delete" ON storage.objects;
CREATE POLICY "event-assets owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Slug helper
CREATE OR REPLACE FUNCTION public.generate_event_slug(p_name TEXT, p_city TEXT)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_base TEXT;
  v_candidate TEXT;
  v_n INT := 1;
BEGIN
  v_base := lower(regexp_replace(
    coalesce(p_name,'event') || '-' || coalesce(p_city,'') || '-' || to_char(now(),'YYYY'),
    '[^a-zA-Z0-9]+', '-', 'g'
  ));
  v_base := trim(both '-' from v_base);
  v_candidate := v_base;
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = v_candidate) LOOP
    v_n := v_n + 1;
    v_candidate := v_base || '-' || v_n;
  END LOOP;
  RETURN v_candidate;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.generate_event_slug(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
