-- Approval PINs remain in server-only configuration, not in browser code.
BEGIN;
CREATE TABLE pink_elephant_private.qr_pin_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES pink_elephant_private.qr_intake_sessions(id),
  ip_hash text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON pink_elephant_private.qr_pin_attempts(ip_hash, attempted_at);
CREATE INDEX ON pink_elephant_private.qr_pin_attempts(session_id, attempted_at);
ALTER TABLE pink_elephant_private.qr_pin_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pink_elephant_private.qr_pin_attempts FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.pe_qr_try_pin(p_id uuid, p_hash text, p_ip_hash text, p_matches boolean, p_staff_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE s pink_elephant_private.qr_intake_sessions;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_ip_hash, 1));
  SELECT * INTO s FROM pink_elephant_private.qr_intake_sessions
  WHERE id = p_id AND token_hash = p_hash AND expires_at > now() FOR UPDATE;
  IF NOT FOUND THEN RETURN 'invalid'; END IF;
  IF s.status = 'approved' OR s.status = 'completed' THEN RETURN 'approved'; END IF;
  IF s.status <> 'awaiting_id_check' THEN RETURN 'invalid'; END IF;
  IF (SELECT count(*) FROM pink_elephant_private.qr_pin_attempts
      WHERE session_id = p_id AND attempted_at > now() - interval '15 minutes') >= 5
    OR (SELECT count(*) FROM pink_elephant_private.qr_pin_attempts
      WHERE ip_hash = p_ip_hash AND attempted_at > now() - interval '15 minutes') >= 15
  THEN RETURN 'locked'; END IF;
  INSERT INTO pink_elephant_private.qr_pin_attempts(session_id,ip_hash) VALUES(p_id,p_ip_hash);
  IF NOT p_matches OR NOT EXISTS (
    SELECT 1 FROM pink_elephant_private.staff_members WHERE user_id = p_staff_id AND active
  ) THEN RETURN 'incorrect'; END IF;
  UPDATE pink_elephant_private.qr_intake_sessions
  SET status = 'approved',approved_by = p_staff_id,approved_at = now()
  WHERE id = p_id;
  RETURN 'approved';
END $$;
REVOKE ALL ON FUNCTION public.pe_qr_try_pin(uuid,text,text,boolean,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pe_qr_try_pin(uuid,text,text,boolean,uuid) TO service_role;

CREATE FUNCTION public.pe_qr_cancel(p_id uuid, p_hash text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE pink_elephant_private.qr_intake_sessions SET expires_at = now()
  WHERE id = p_id AND token_hash = p_hash AND status <> 'completed';
$$;
REVOKE ALL ON FUNCTION public.pe_qr_cancel(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pe_qr_cancel(uuid,text) TO service_role;
COMMIT;
