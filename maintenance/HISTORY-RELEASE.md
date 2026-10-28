# Queue and history release — installed and deployed

## Latest change: administrator-directed deletion

The user explicitly approved removing the application time lock for both existing
history admins while keeping the warning, typed DELETE confirmation and legal-hold
protection. Migration 08 supersedes only the pe_manage_history definition in 07.
Do not reapply 07 after 08 without reapplying 08. Retention dates remain recorded;
retention responsibility is disclosed rather than enforced by the deletion function.

Migration 08 was verified in a rollback-only rehearsal: a fresh synthetic history
entry could be deleted by an approved admin, a held entry was blocked, and queue
completion/selection, signature preservation, and archive/restore checks still passed.
Synthetic records were rolled back. Migration 08 was then committed without deleting
customer records. Post-install checks confirmed time-lock removal, legal-hold checks,
and direct browser DELETE denial. The updated frontend warning is commit
062831894a85125803d8e30ac7e9e9b980162d80 on the existing release branch.
The earlier two-year-block descriptions below are historical and superseded by 08.


Customer URL stays https://pink-elephant-chi.vercel.app/intake. Existing QR codes
using that exact stable address need no replacement. A deployment-specific QR
continues to open its old deployment; scan the actual printed code before deciding.

## Install order

1. Review/apply 06-history-admin-access.sql, then 07-queue-history-controls.sql
   using the Supabase project SQL editor as database owner. Migration 06 fails
   atomically unless both named, email-confirmed accounts are active approved staff.
   Existing migrations 01–04 and staff_members are prerequisites. Migration 07
   supersedes 05; do not reinstall 05 afterward.
2. Deploy this local app to the existing Vercel project, keeping production domain,
   private document permissions, intake endpoint and environment settings.

Migrations 06 and 07 were installed together in one transaction through the
Supabase dashboard after a successful rollback-only installation rehearsal.
Both named administrators passed identity checks; an unapproved identity was
rejected; anonymous function execution and direct authenticated DELETE were denied.
Row-level security is enabled on the private history-admin table.

The rollback-only verification script then passed against the actual database:
waiting-only and mixed selections were rejected atomically, completion plus queue
clearing preserved the synthetic signature, history archive/restore worked, and
retention blocked deletion. All synthetic fixtures were rolled back; no actual
customer records were changed or deleted.

Type checking, production build and 19 local tests passed. Frontend commit
c9674af1b1a29a43771a1304f17aaf90f2eeebde was pushed to the existing release branch
codex/secure-qr-intake-release. Vercel preview GQzXUGpmRo5TtPcJugJe75xSipUJ built
successfully and was rebuilt with production settings as
CVx8ZnPVjcUAvYpesVvypRMf5ayi. Vercel confirmed Ready, Production, and the stable
pink-elephant-chi.vercel.app domain. Staff sign-in and public intake entry screens
were checked after deployment. Authenticated staff UI actions and two-device
realtime behavior still require a signed-in staff session to verify end to end.

## Behavior

- Mark completed records a server timestamp and keeps the visit in the live queue.
- Only selected completed live visits can be cleared. Server locks and checks the
  entire selection; a stale/ineligible selection is rejected without partial clear.
- Saving artist details no longer silently removes a customer from the queue.
- Cleared visits remain in history with signatures and consent intact.
- The two nominated history admins can archive/restore history; other staff can
  read it but cannot call the history-management operation successfully.
- History deletion requires two confirmations and server enforcement of a minimum
  two-calendar-year window from the last database record entry and no legal hold.
- Existing rows conservatively start that window at migration installation, since
  their historic last edit time is unknown. Form-data edits restart it; hiding or
  restoring history does not. DB administrators manage legal holds directly.
- Deletion removes selected consent_forms rows. Private storage attachments and
  backups remain retained; this is explicitly disclosed and is NOT full customer
  data erasure. A later storage-cleanup process needs separate scope and verification.
- Two years is only the configured minimum: review other retention obligations
  before allowing a deletion. Set legal_hold for records that must be kept longer.

## Acceptance checks before production

Use synthetic records in staging, never real customer data for destructive tests.
Verify both named admins and a third ordinary staff account. Test anonymous denial,
unapproved-account denial, staff/admin separation, and direct DELETE denial.
Verify waiting records cannot be selected/cleared; a crafted mixed RPC selection
must fail atomically. Mark a visit complete, select it, clear it, and verify its
signature and consent still open in history. Observe a second staff session for
completion, clear, archive, restore and delete changes via the existing realtime
subscription; verify consent_forms is enabled for realtime in Supabase.
Verify archived history can be restored, fresh and legal-held records reject
deletion, and an eligible synthetic record deletes only after explicit confirmation.
Verify all record edits refresh record_last_entry_at and browser attempts to lower
that timestamp or change legal_hold fail to defeat retention.
Scan the existing printed QR on a phone and confirm the actual URL and intake flow.
