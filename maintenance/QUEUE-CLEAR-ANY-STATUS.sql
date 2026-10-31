-- Preserve customer records and procedure status; remove only the active-queue flag.
BEGIN;
CREATE OR REPLACE FUNCTION public.pe_clear_queue(p_ids uuid[])
RETURNS TABLE(id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE target_count integer;
BEGIN
  IF NOT coalesce(public.pink_elephant_is_staff(), false) THEN
    RAISE EXCEPTION 'Approved staff required' USING ERRCODE = '42501';
  END IF;
  IF coalesce(cardinality(p_ids), 0) = 0 OR cardinality(p_ids) > 200 THEN
    RAISE EXCEPTION 'Select between 1 and 200 active visits';
  END IF;
  PERFORM 1 FROM public.consent_forms f WHERE f.id = ANY(p_ids) FOR UPDATE;
  SELECT count(*) INTO target_count FROM public.consent_forms f
  WHERE f.id = ANY(p_ids) AND coalesce(f.form_data->>'isArchived', 'false') <> 'true';
  IF target_count <> (SELECT count(DISTINCT x) FROM unnest(p_ids) x) THEN
    RAISE EXCEPTION 'Only selected live visits can be cleared. Refresh and try again.';
  END IF;
  RETURN QUERY UPDATE public.consent_forms f
    SET form_data = jsonb_set(f.form_data, '{isArchived}', 'true'::jsonb)
    WHERE f.id = ANY(p_ids) RETURNING f.id;
END $$;

REVOKE ALL ON FUNCTION public.pe_clear_queue(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pe_clear_queue(uuid[]) TO authenticated;
COMMIT;
