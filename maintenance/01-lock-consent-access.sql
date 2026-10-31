-- Temporary containment for the confirmed public consent_forms exposure.
-- Stops intake saving and browser queue/history access in the current app.
-- Does not delete customer records. Does not restrict database administrators
-- or service-role backend access. Does not secure existing Storage URLs.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'consent_forms'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.consent_forms', existing_policy.policyname);
  END LOOP;
END $$;

REVOKE ALL PRIVILEGES ON TABLE public.consent_forms
  FROM PUBLIC, anon, authenticated;
COMMIT;

-- Expected: true for row_security_enabled and 0 for remaining_policies.
SELECT c.relrowsecurity AS row_security_enabled,
       (SELECT count(*) FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'consent_forms') AS remaining_policies
FROM pg_class c
WHERE c.oid = 'public.consent_forms'::regclass;
