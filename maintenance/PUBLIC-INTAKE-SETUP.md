# Public QR intake — activation checklist

## Current status

The local `/intake` page opens without authentication and renders the existing waiver.
The root app remains behind staff authentication. The former `/?mode=kiosk` entry
also resolves to public intake in the new code. Old deployment-specific URLs still
run old code and are not repaired by this local change.

Public submission is not activated yet. The schema in `03-public-qr-intake.sql`
and server-only environment settings must be installed before testing a real save.
Do not reopen anonymous consent_forms or Storage policies.

## Workflow

1. Customer chooses adult tattoo, adult piercing, or guardian/minor piercing and
   reads the existing disclosure. They enter their details and capture ID photos.
2. Sending the ID check creates a private draft, not a completed consent form.
   ID photos are stored privately under content-addressed object paths. A random
   receipt secret authorizes only this draft's status and final submission. Only
   its hash is stored in the database; no receipt is placed in a URL.
3. Customer hands their phone and physical ID to staff. Step 4 shows the submitted
   details and photo. After inspecting the original ID and required minor documents,
   staff confirm the check and enter a dedicated approval PIN on that same phone.
   The server records the configured staff UUID and database timestamp, without
   creating a staff login session on the customer's phone. Account passwords are
   not used for this step. Approval from the signed-in staff dashboard remains an
   optional alternative. Return for correction expires the prior draft receipt.
4. The customer page detects approval, unlocks signatures, and submits acceptance.
   The server and database require approval before creating a completed waiver.
   The signature paths, acceptance, version, server timestamp, and approval details
   are saved together. The completed waiver then enters the existing staff queue.
5. The customer gets a success screen only after server-side save verification.
   They may then open Instagram/aftercare. SMS signup remains disabled.

## Required setup

- Run `03-public-qr-intake.sql` in the Supabase SQL Editor after the already-installed
  staff helper and policies. It is transactional and grants no anonymous table access.
  It has not yet been executed or integration-tested against the live database.
- The user subsequently reported successful execution of `03-public-qr-intake.sql`.
  The local server-to-database connection and invalid-receipt denial were verified.
- Run `04-customer-phone-pin.sql` to add durable PIN-attempt limits and correction
  handling. This script has not yet been installed or live-tested. Set server-only
  `INTAKE_APPROVAL_PIN` to a fresh case-sensitive secret of at least six characters
  and `INTAKE_APPROVAL_STAFF_ID` to the approved staff account responsible for it.
  The formerly hardcoded shared PIN is not configured as a fallback. A shared PIN
  identifies the configured account, not the actual individual who entered it;
  separate staff PIN assignments are required for individual attribution.
  The current configuration supports one PIN/account pairing.
- Add `SUPABASE_URL`, `SUPABASE_SERVER_KEY`, and `INTAKE_ALLOWED_ORIGINS` in the
  server environment. `SUPABASE_SERVER_KEY` must be a Supabase server secret or
  service-role key. Enter it directly in the hosting environment; do not send it in
  chat, commit it, or prefix it with `VITE_`. For local testing, use an ignored
  `.env.local` with `INTAKE_ALLOWED_ORIGINS=http://127.0.0.1:4173`.
- For Vercel, configure the exact production origin, and any specifically approved
  preview origin, as a comma-separated allowlist. No wildcard CORS is enabled.
- Deploy the API functions and frontend together to a preview, verify them, and
  then approve the production release. The QR should point to the stable production
  domain plus `/intake`, not a deployment-specific hostname.

## Validation before rollout

- Automated tests cover date/age checks, minor guardian validation, ignored forged
  verification fields, image format/size limits, rejected origins, missing config,
  approval-required finalization, missing acceptance, receipt isolation, and retry
  behavior. API workflow tests use a mock database, not the live SQL functions.
- Check SQL execution, a customer draft, staff-only ID review, signature submission,
  database fields, queue updates, private document rendering, and unauthenticated
  denial of record lists and direct document downloads in the deployed preview.
- Check that minor intake requires guardian DOB, guardian relationship, guardian ID,
  a supporting minor document, and both signatures. Staff still determine whether
  the requested procedure is permitted and required documentation is sufficient.

## Operational limits

- Customers must keep the page open; closing/reloading loses the in-memory receipt
  and unfinished signatures. Drafts expire for submission after four hours. They
  are not automatically deleted; a reviewed draft/document retention process is
  still required. Incomplete uploads can leave private orphaned objects.
- New draft creation is limited to ten per IP hash per fifteen minutes. Shared event
  Wi-Fi may hit this limit; staff should plan an appropriate production rate limit.
- PIN approval is limited to five attempts per intake and fifteen attempts per IP
  hash within fifteen minutes. Attempts are counted in the database, so creating
  a fresh receipt does not reset the IP limit. This does not prevent use of a known
  PIN; do not reuse the formerly public PIN. Keep the customer screen shielded
  while staff enter their approval PIN, and replace any disclosed PIN.
- The request cap is 3.5 MB, each image is capped at 600 KB, and the browser prepares
  ID photos up to 1400 pixels. Staff must refuse unreadable photos and request a
  retake. PNG/JPEG only. Server validation checks declared type and magic bytes;
  it is not an image malware-scanning service.
- Images and signatures use immutable, content-addressed upload paths. Repeated
  completed submissions return success without uploading over saved signatures.
- The approved staff workflow still has existing editing/archive capabilities;
  this change is not an immutable legal audit system or legal sufficiency review.
- Artists-table permissions and legacy staff deletion controls are outside this
  QR submission patch. Consent deletion remains denied by the installed policies.
