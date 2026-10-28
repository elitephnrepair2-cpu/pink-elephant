-- Requires the private staff list and pink_elephant_is_staff() helper already installed.
-- No permissions are granted to anonymous visitors.
BEGIN;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.consent_forms TO authenticated;

CREATE POLICY "Approved staff read consent forms"
ON public.consent_forms FOR SELECT TO authenticated
USING ((SELECT public.pink_elephant_is_staff()));

CREATE POLICY "Approved staff submit consent forms"
ON public.consent_forms FOR INSERT TO authenticated
WITH CHECK ((SELECT public.pink_elephant_is_staff()));

CREATE POLICY "Approved staff update consent forms"
ON public.consent_forms FOR UPDATE TO authenticated
USING ((SELECT public.pink_elephant_is_staff()))
WITH CHECK ((SELECT public.pink_elephant_is_staff()));

CREATE POLICY "Approved staff read signatures"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'signatures' AND (SELECT public.pink_elephant_is_staff()));

CREATE POLICY "Approved staff upload signatures"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'signatures' AND (SELECT public.pink_elephant_is_staff()));

CREATE POLICY "Approved staff update signatures"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'signatures' AND (SELECT public.pink_elephant_is_staff()))
WITH CHECK (bucket_id = 'signatures' AND (SELECT public.pink_elephant_is_staff()));
COMMIT;

SELECT policyname, roles, cmd FROM pg_policies
WHERE (schemaname = 'public' AND tablename = 'consent_forms')
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, policyname;
