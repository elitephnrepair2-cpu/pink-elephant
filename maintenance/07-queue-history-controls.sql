-- Apply after 06-history-admin-access.sql. No customer rows are deleted by migration.
BEGIN;
ALTER TABLE public.consent_forms
  ADD COLUMN IF NOT EXISTS record_last_entry_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS legal_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS history_hidden_at timestamptz;

-- Existing records start a conservative retention window when this is installed:
-- their true last edit date is not available. Never infer it from creation date.
CREATE OR REPLACE FUNCTION public.pe_track_record_entry()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.record_last_entry_at := now();
    NEW.legal_hold := false;
    NEW.history_hidden_at := NULL;
  ELSE
    IF current_user IN ('authenticated', 'anon') AND
       (NEW.legal_hold IS DISTINCT FROM OLD.legal_hold OR
        NEW.history_hidden_at IS DISTINCT FROM OLD.history_hidden_at) THEN
      RAISE EXCEPTION 'Use the authorized history operation';
    END IF;
    NEW.record_last_entry_at := OLD.record_last_entry_at;
    IF NEW.form_data IS DISTINCT FROM OLD.form_data THEN
      NEW.record_last_entry_at := now();
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pe_track_record_entry ON public.consent_forms;
CREATE TRIGGER pe_track_record_entry BEFORE INSERT OR UPDATE ON public.consent_forms
FOR EACH ROW EXECUTE FUNCTION public.pe_track_record_entry();

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
      AND (f.legal_hold OR f.record_last_entry_at > now() - interval '2 years')) THEN
      RAISE EXCEPTION 'Deletion blocked: a selected record is under retention or legal hold';
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
REVOKE DELETE ON public.consent_forms FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.pe_complete_visit(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT coalesce(public.pink_elephant_is_staff(), false) THEN
    RAISE EXCEPTION 'Approved staff required' USING ERRCODE = '42501';
  END IF;
  UPDATE public.consent_forms f SET form_data =
    jsonb_set(jsonb_set(f.form_data, '{procedureStatus}', '"completed"'::jsonb),
      '{completedAt}', to_jsonb(now()))
    WHERE f.id = p_id AND coalesce(f.form_data->>'isArchived', 'false') <> 'true'
      AND coalesce(f.form_data->>'procedureStatus', '') <> 'completed';
  IF NOT FOUND THEN RAISE EXCEPTION 'Visit is no longer waiting for completion'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.pe_complete_visit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pe_complete_visit(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.pe_manage_history(uuid[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pe_manage_history(uuid[], text) TO authenticated;
REVOKE ALL ON FUNCTION public.pe_clear_queue(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pe_clear_queue(uuid[]) TO authenticated;
COMMIT;
