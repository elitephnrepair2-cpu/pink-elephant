# Consent access maintenance

The user authorized beginning maintenance while the shop was quiet. Screenshots
confirmed RLS enabled, anon SELECT/INSERT/UPDATE/DELETE grants, and unrestricted
PUBLIC policies including ALL on public.consent_forms.

`01-lock-consent-access.sql` is prepared for the Supabase SQL Editor. It has not
been executed by Codex. It removes all policies from this table and revokes browser
role table privileges inside a transaction. It preserves records and administrator
access. If it errors, the transaction must not be treated as successfully applied.
If the editor reports an aborted transaction on a subsequent run, run ROLLBACK
before retrying the complete script.

Expected verification is RLS true, remaining policies zero. This is temporary
containment, not a full security remediation. Existing browser content cannot be
recalled. Storage signatures and identification images need a separate access
review, including previously issued public URLs. Do not reopen the former public
policies to restore app functionality.

Before normal service resumes, implement a server-authorized intake operation,
staff authentication with an explicit staff allowlist, private document access,
and a queue feed that does not expose full consent records. Check intake,
signatures, age verification, staff queue updates, and denied unauthenticated
record reads/updates/deletes. Retained SMS consent and STOP/HELP handling remain
separate pending work; appointment SMS signup stays disabled.
