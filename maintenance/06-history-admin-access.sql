-- Prepared only; not applied to the live database.
-- This assigns history-management eligibility, NOT permission to delete records.
-- Deletion must also enforce retention and legal holds in a server operation.
-- Existing approved staff membership is required; this does not create accounts.
BEGIN;
CREATE TABLE IF NOT EXISTS pink_elephant_private.history_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pink_elephant_private.history_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pink_elephant_private.history_admins FROM PUBLIC, anon, authenticated;

DO $$
DECLARE matched_count integer;
BEGIN
  SELECT count(DISTINCT lower(u.email)) INTO matched_count
  FROM auth.users u
  JOIN pink_elephant_private.staff_members s ON s.user_id = u.id AND s.active
  WHERE lower(u.email) IN ('handydejohn@yahoo.com', 'info@pinkelephantparlor.com')
    AND u.email_confirmed_at IS NOT NULL;
  IF matched_count <> 2 THEN
    RAISE EXCEPTION 'Both named accounts must be confirmed, active approved staff before assigning history access';
  END IF;
  INSERT INTO pink_elephant_private.history_admins(user_id)
  SELECT u.id FROM auth.users u
  JOIN pink_elephant_private.staff_members s ON s.user_id = u.id AND s.active
  WHERE lower(u.email) IN ('handydejohn@yahoo.com', 'info@pinkelephantparlor.com')
    AND u.email_confirmed_at IS NOT NULL
  ON CONFLICT (user_id) DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.pe_is_history_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT coalesce(public.pink_elephant_is_staff(), false)
    AND EXISTS (
      SELECT 1 FROM pink_elephant_private.history_admins a
      WHERE a.user_id = (SELECT auth.uid())
    );
$$;
REVOKE ALL ON FUNCTION public.pe_is_history_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pe_is_history_admin() TO authenticated;
COMMIT;
