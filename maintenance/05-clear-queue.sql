-- Archive queue entries without deleting waivers or rewriting their contents.
BEGIN;
CREATE OR REPLACE FUNCTION public.pe_clear_queue(p_ids uuid[])
RETURNS TABLE(id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.pink_elephant_is_staff() THEN
    RAISE EXCEPTION 'Approved staff required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    UPDATE public.consent_forms AS f
    SET form_data = jsonb_set(f.form_data, '{isArchived}', 'true'::jsonb)
    WHERE f.id = ANY(p_ids)
      AND coalesce(f.form_data->>'isArchived', 'false') <> 'true'
    RETURNING f.id;
END;
$$;
REVOKE ALL ON FUNCTION public.pe_clear_queue(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pe_clear_queue(uuid[]) TO authenticated;
COMMIT;
