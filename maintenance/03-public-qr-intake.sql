-- Protected draft/approval workflow. Run after 02-staff-access.sql.
-- No anonymous table access is restored.
BEGIN;
CREATE TABLE pink_elephant_private.qr_intake_sessions (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL CHECK (length(token_hash) = 64),
  ip_hash text NOT NULL,
  form_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading','awaiting_id_check','approved','completed')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  consent_form_id uuid REFERENCES public.consent_forms(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '4 hours'
);
CREATE INDEX ON pink_elephant_private.qr_intake_sessions(ip_hash, created_at);
ALTER TABLE pink_elephant_private.qr_intake_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pink_elephant_private.qr_intake_sessions FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.pe_qr_create(p_id uuid, p_hash text, p_ip_hash text, p_form jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE existing pink_elephant_private.qr_intake_sessions;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));
  SELECT * INTO existing FROM pink_elephant_private.qr_intake_sessions WHERE id = p_id;
  IF FOUND THEN
    IF existing.token_hash <> p_hash OR existing.expires_at <= now()
      OR existing.form_data->>'_submissionDigest' IS DISTINCT FROM p_form->>'_submissionDigest'
      THEN RAISE EXCEPTION 'Invalid session'; END IF;
    RETURN jsonb_build_object('status', existing.status);
  END IF;
  IF (SELECT count(*) FROM pink_elephant_private.qr_intake_sessions
      WHERE ip_hash = p_ip_hash AND created_at > now() - interval '15 minutes') >= 10 THEN
    RAISE EXCEPTION 'Too many submissions. Ask the front desk for help.';
  END IF;
  INSERT INTO pink_elephant_private.qr_intake_sessions(id,token_hash,ip_hash,form_data)
  VALUES (p_id,p_hash,p_ip_hash,p_form);
  RETURN jsonb_build_object('status','uploading');
END $$;

CREATE FUNCTION public.pe_qr_session(p_id uuid, p_hash text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT to_jsonb(s) - 'token_hash' - 'ip_hash'
  FROM pink_elephant_private.qr_intake_sessions s
  WHERE id = p_id AND token_hash = p_hash AND expires_at > now();
$$;

CREATE FUNCTION public.pe_qr_ready(p_id uuid, p_hash text, p_paths jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE pink_elephant_private.qr_intake_sessions
  SET form_data = form_data || p_paths, status = 'awaiting_id_check'
  WHERE id = p_id AND token_hash = p_hash AND status = 'uploading' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Session is not ready for uploads'; END IF;
END $$;

CREATE FUNCTION public.pe_qr_pending()
RETURNS TABLE(id uuid, form_data jsonb, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.pink_elephant_is_staff() THEN RAISE EXCEPTION 'Staff access required'; END IF;
  RETURN QUERY SELECT s.id, s.form_data, s.created_at
  FROM pink_elephant_private.qr_intake_sessions s
  WHERE s.status = 'awaiting_id_check' AND s.expires_at > now()
  ORDER BY s.created_at;
END $$;

CREATE FUNCTION public.pe_qr_approve(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.pink_elephant_is_staff() THEN RAISE EXCEPTION 'Staff access required'; END IF;
  UPDATE pink_elephant_private.qr_intake_sessions
  SET status = 'approved', approved_by = auth.uid(), approved_at = now()
  WHERE id = p_id AND status = 'awaiting_id_check' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Intake expired or already reviewed'; END IF;
END $$;

CREATE FUNCTION public.pe_qr_finish(p_id uuid, p_hash text, p_signatures jsonb, p_sms jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE s pink_elephant_private.qr_intake_sessions;
DECLARE new_id uuid;
DECLARE final_data jsonb;
BEGIN
  SELECT * INTO s FROM pink_elephant_private.qr_intake_sessions
  WHERE id = p_id AND token_hash = p_hash AND expires_at > now() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session expired'; END IF;
  IF s.status = 'completed' THEN RETURN s.consent_form_id; END IF;
  IF s.status <> 'approved' OR s.approved_by IS NULL OR s.approved_at IS NULL THEN
    RAISE EXCEPTION 'Staff ID check required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pink_elephant_private.staff_members WHERE user_id = s.approved_by AND active) THEN
    RAISE EXCEPTION 'Staff approval is no longer valid';
  END IF;
  IF s.form_data->>'type' = 'minor-piercing' THEN
    IF coalesce(p_signatures->>'adultSignature','') = '' OR coalesce(p_signatures->>'minorSignature','') = '' THEN
      RAISE EXCEPTION 'Both signatures required';
    END IF;
  ELSIF coalesce(p_signatures->>'signature','') = '' THEN RAISE EXCEPTION 'Signature required'; END IF;
  final_data := s.form_data || p_signatures || jsonb_build_object(
    'staffVerified',true,'staffVerifiedBy',s.approved_by,'staffVerifiedAt',s.approved_at,
    'aftercareAcknowledged',true,'waiverVersion','v1','consentSignedAt',now(),
    'timestamp',now(),'submissionDate',to_char(now() AT TIME ZONE 'America/Chicago','YYYY-MM-DD'),
    'submissionTime',to_char(now() AT TIME ZONE 'America/Chicago','HH12:MI AM'),
    'isArchived',false,'source','public-qr','appointmentSmsConsent',p_sms);
  INSERT INTO public.consent_forms(form_data,form_type,service_category,is_minor,guardian_name,guardian_phone,
    consent_agreed_input,consent_agreed,consent_signed_at,waiver_version,signature_url,guardian_signature_url,minor_signature_url)
  VALUES(final_data,s.form_data->>'type',
    CASE WHEN s.form_data->>'type' = 'minor-piercing' THEN 'piercing' ELSE s.form_data->>'type' END,
    s.form_data->>'type' = 'minor-piercing',nullif(s.form_data->>'parentGuardianName',''),
    CASE WHEN s.form_data->>'type' = 'minor-piercing' THEN s.form_data->>'phone' END,
    true,true,now(),'v1',p_signatures->>'signature',p_signatures->>'adultSignature',p_signatures->>'minorSignature')
  RETURNING id INTO new_id;
  UPDATE pink_elephant_private.qr_intake_sessions SET status = 'completed',consent_form_id = new_id WHERE id = p_id;
  RETURN new_id;
END $$;

REVOKE ALL ON FUNCTION public.pe_qr_create(uuid,text,text,jsonb), public.pe_qr_session(uuid,text),
  public.pe_qr_ready(uuid,text,jsonb),public.pe_qr_finish(uuid,text,jsonb,jsonb),
  public.pe_qr_pending(),public.pe_qr_approve(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pe_qr_create(uuid,text,text,jsonb),public.pe_qr_session(uuid,text),
  public.pe_qr_ready(uuid,text,jsonb),public.pe_qr_finish(uuid,text,jsonb,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.pe_qr_pending(),public.pe_qr_approve(uuid) TO authenticated;
COMMIT;
