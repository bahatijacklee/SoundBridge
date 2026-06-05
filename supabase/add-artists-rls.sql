ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'artists'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.artists', policy_name);
  END LOOP;
END $$;

CREATE POLICY "Anyone can read artists"
  ON public.artists
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage artists"
  ON public.artists
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
