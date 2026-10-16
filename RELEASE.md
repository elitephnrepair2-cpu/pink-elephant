# Pink Elephant — live release

## Customer and staff addresses

Intended stable production origin: `https://pink-elephant-chi.vercel.app` (shown in
the existing Vercel project and GitHub repository). Verify the domain assignment
and deployed release before distributing the QR artwork.

- Customer QR waiver: `/intake`
- Staff sign-in: `/`
- Instagram and aftercare: `/welcome`
- Privacy: `/privacy`
- Appointment SMS terms: `/sms-terms`

Old deployment-specific QR URLs will continue running their old deployment.
Replace printed codes after production verification; do not restore legacy keys
or public database permissions to make old deployments work.

## Required Vercel project settings

Set these under Settings → Environment Variables for Production. Add the same
settings for the release Preview if testing the deployed version before promotion.
Values should be copied directly from the local private `.env.local`, never from chat.

| Setting | Purpose |
| --- | --- |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser connection using the new publishable key |
| `SUPABASE_URL` | Existing Supabase project URL |
| `SUPABASE_SERVER_KEY` | Replacement server secret; never use a VITE_ prefix |
| `INTAKE_APPROVAL_PIN` | Fresh dedicated staff approval PIN; never use a VITE_ prefix |
| `INTAKE_APPROVAL_STAFF_ID` | Approved staff UUID associated with this PIN |
| `INTAKE_ALLOWED_ORIGINS` | `https://pink-elephant-chi.vercel.app` for production; append the exact approved preview origin when preview-testing |
| `VITE_APPOINTMENT_SMS_ENABLED` | `false` |

Use the Vite framework preset, repository root, `npm run build`, and `dist` output.
Vercel deploys `api/intake.ts` as the server endpoint as well as the static frontend.
Changes to frontend environment values require a new build/deployment.

The user reported successful installation of migrations 01–04 and both staff
accounts. The user also confirmed local staff login, private signature viewing,
public customer submission, same-phone PIN approval, final signature saving,
queue appearance, and the redesigned staff screen. Legacy API keys were disabled;
a subsequent check returned HTTP 401 for the old public key. Replacement keys and
denied public record access were verified. Do not re-run CREATE-only migrations
against production without checking installation first.

## Deployment acceptance checks

1. Production `/intake` opens on a phone without staff login. `/` requires staff login.
2. Staff queue and private saved signatures work; direct anonymous consent reads
   and private document downloads remain blocked.
3. Staff review real physical ID on the customer phone; the fresh PIN unlocks only
   that intake. A completed, signed waiver saves and appears in the staff queue.
4. Privacy/SMS terms load, the customer link goes to `/intake`, and the public
   welcome screen displays no customer records or wait estimates.
5. Scan the new QR on a phone over cellular data and confirm the production URL.

Avoid rollback to the old insecure app. If this release fails, keep the protected
database rules and pause intake while fixing forward. Reverting code alone cannot
restore the old flow because legacy keys are disabled and public access is revoked.

## SMS remains a separate project step

This release does not send texts. The public API currently records SMS consent as
declined and the public checkbox is disabled regardless of the frontend flag.
The flag must not be treated as an SMS activation switch.

Before appointment messaging:
- Implement affirmative optional SMS consent in the public submission flow and
  test both agreed/declined evidence, including number, exact wording, version,
  server timestamp, and a retained event history separate from editable waivers.
- Confirm Twilio sender type and registration status. US local long-code numbers
  require A2P 10DLC registration; toll-free numbers use toll-free verification.
- Configure Twilio credentials only on the server, appointment data and reminder
  scheduling, inbound STOP/HELP webhooks with signature verification, and a durable
  opt-out/suppression list checked before every send.
- Verify real opt-in, a test appointment message, HELP, STOP, delivery callbacks,
  and no promotional messages under appointment-only consent.

References:
- https://www.twilio.com/docs/messaging/compliance/a2p-10dlc
- https://www.twilio.com/docs/messaging/compliance/toll-free/api-onboarding
- https://www.twilio.com/en-us/legal/messaging-policy
