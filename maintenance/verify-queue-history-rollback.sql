-- Synthetic fixtures only. The outer transaction MUST end in ROLLBACK.
BEGIN;
DO $verify$
DECLARE
  first_id uuid;
  second_id uuid;
  staff_id uuid;
  entry_time timestamptz;
BEGIN
  SELECT user_id INTO STRICT staff_id FROM pink_elephant_private.history_admins LIMIT 1;
  PERFORM set_config('request.jwt.claim.sub', staff_id::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', staff_id, 'role', 'authenticated')::text, true);
  INSERT INTO public.consent_forms(form_data, service_category, form_type)
    VALUES ('{"name":"ROLLBACK ONLY QUEUE TEST","type":"tattoo","isArchived":false,"signature":"TEST-NOT-A-SIGNATURE"}', 'tattoo', 'tattoo') RETURNING id INTO first_id;
  INSERT INTO public.consent_forms(form_data, service_category, form_type)
    VALUES ('{"name":"ROLLBACK ONLY WAITING TEST","type":"tattoo","isArchived":false}', 'tattoo', 'tattoo') RETURNING id INTO second_id;
  BEGIN
    PERFORM public.pe_clear_queue(ARRAY[first_id]);
    RAISE EXCEPTION 'TEST FAILED: waiting visit was cleared';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'Only selected completed live visits%' THEN RAISE; END IF;
  END;
  PERFORM public.pe_complete_visit(first_id);
  BEGIN
    PERFORM public.pe_clear_queue(ARRAY[first_id, second_id]);
    RAISE EXCEPTION 'TEST FAILED: mixed selection was cleared';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'Only selected completed live visits%' THEN RAISE; END IF;
  END;
  IF EXISTS(SELECT 1 FROM public.consent_forms WHERE id = first_id AND form_data->>'isArchived' = 'true') THEN
    RAISE EXCEPTION 'TEST FAILED: partial queue clear';
  END IF;
  PERFORM public.pe_clear_queue(ARRAY[first_id]);
  IF NOT EXISTS (SELECT 1 FROM public.consent_forms WHERE id = first_id
    AND form_data->>'isArchived' = 'true'
    AND form_data->>'signature' = 'TEST-NOT-A-SIGNATURE'
    AND form_data->>'procedureStatus' = 'completed') THEN
    RAISE EXCEPTION 'TEST FAILED: clear lost history or signature';
  END IF;
  SELECT record_last_entry_at INTO entry_time FROM public.consent_forms WHERE id = first_id;
  PERFORM public.pe_manage_history(ARRAY[first_id], 'archive');
  IF NOT EXISTS (SELECT 1 FROM public.consent_forms WHERE id = first_id
    AND history_hidden_at IS NOT NULL AND record_last_entry_at = entry_time) THEN
    RAISE EXCEPTION 'TEST FAILED: archive or retention timestamp';
  END IF;
  PERFORM public.pe_manage_history(ARRAY[first_id], 'restore');
  IF NOT EXISTS (SELECT 1 FROM public.consent_forms WHERE id = first_id AND history_hidden_at IS NULL) THEN
    RAISE EXCEPTION 'TEST FAILED: restore';
  END IF;
  BEGIN
    PERFORM public.pe_manage_history(ARRAY[first_id], 'delete');
    RAISE EXCEPTION 'TEST FAILED: fresh record deleted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE 'Deletion blocked:%' THEN RAISE; END IF;
  END;
END $verify$;
SELECT 'PASS: waiting and mixed selections blocked; completed clear preserved signature; archive/restore passed; retention blocked deletion; fixtures rolled back' AS verification;
ROLLBACK;
