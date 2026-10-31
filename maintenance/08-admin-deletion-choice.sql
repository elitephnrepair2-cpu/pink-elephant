-- Admin-directed deletion; legal holds remain enforced. Does not delete any records on installation.
BEGIN;
CREATE OR REPLACE FUNCTION public.pe_manage_history(p_ids uuid[], p_action text)
RETURNS TABLE(id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE target_count integer;
BEGIN
  IF NOT coalesce(public.pe_is_history_admin(), false) THEN
    RAISE EXCEPTION 'History administrator required' USING ERRCODE = '42501';
  END IF;
  IF coalesce(cardinality(p_ids), 0) = 0 OR cardinality(p_ids) > 200
    OR p_action IS NULL OR p_action NOT IN ('archive', 'restore', 'delete') THEN
    RAISE EXCEPTION 'Invalid history request';
  END IF;
  PERFORM 1 FROM public.consent_forms f WHERE f.id = ANY(p_ids) FOR UPDATE;
  SELECT count(*) INTO target_count FROM public.consent_forms f
    WHERE f.id = ANY(p_ids) AND f.form_data->>'isArchived' = 'true';
  IF target_count <> (SELECT count(DISTINCT x) FROM unnest(p_ids) x) THEN
    RAISE EXCEPTION 'Select saved history entries only';
  END IF;
  IF p_action = 'delete' THEN
    IF EXISTS (SELECT 1 FROM public.consent_forms f WHERE f.id = ANY(p_ids)
      AND f.legal_hold) THEN
      RAISE EXCEPTION 'Deletion blocked: a selected record is on legal hold';
    END IF;
    -- Linked private documents remain retained. This deletes history records,
    -- not backups or stored attachments; do not describe it as full data erasure.
    RETURN QUERY DELETE FROM public.consent_forms f WHERE f.id = ANY(p_ids) RETURNING f.id;
  ELSE
    RETURN QUERY UPDATE public.consent_forms f
      SET history_hidden_at = CASE WHEN p_action = 'archive' THEN now() ELSE NULL END
      WHERE f.id = ANY(p_ids) RETURNING f.id;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.pe_manage_history(uuid[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pe_manage_history(uuid[], text) TO authenticated;
COMMIT;
