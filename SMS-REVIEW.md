# Pink Elephant — appointment SMS draft

Prepared from GitHub commit `ec3a4b212ab72e90a440b0d8d908dcf96678e941`.
This is a local review copy. GitHub, Vercel production, Supabase records, and Twilio settings have not been changed.

## What customers will see

One optional, unchecked box beside the phone field:

> I agree to receive text messages from The Pink Elephant about appointment scheduling, confirmations, changes, and reminders at the number provided. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is optional and is not a condition of purchase. This does not include promotional texts.

The form also states that the person checking the box must be the phone’s account holder or authorized user. On minor intake, the phone field and consent refer to the parent or guardian. Privacy Policy and SMS Terms links appear next to the choice. Changing the phone number clears the checkbox.

SMS signup is disabled by default. Declining texts never blocks intake. Draft policy pages are at `/privacy` and `/sms-terms` and do not load customer records.

## Draft Privacy Policy — for shop review

**Information collected.** The intake app collects contact details, date of birth, service information, consent acknowledgments, signatures, and identification images. Minor piercing intake also collects guardian details and supporting documents. When you choose appointment texts, we record the phone number, your choice, the wording shown, and the time it was recorded.

**How information is used.** We use intake information to administer tattoo and piercing services, review consent and identification, manage the waiting list, and maintain service records. If you opt in, we use your number for appointment scheduling, confirmations, changes, and reminders. Appointment SMS consent does not authorize marketing texts.

**Service providers and SMS information.** The app uses Vercel for hosting and Supabase for database and file storage. The appointment text program is intended to use Twilio for messaging. Providers process information needed to operate these services. Mobile information and SMS opt-in data and consent will not be sold or shared with third parties or affiliates for marketing or promotional purposes. We may disclose information when required by law.

**Your choices.** Appointment texts are optional. You may complete intake without opting in. Once messaging is enabled, reply STOP to stop texts or HELP for assistance. You can also ask the front desk about your contact details, SMS preferences, access, corrections, or deletion requests. Some service and consent records may need to be retained to meet applicable requirements.

**Guardian information.** Minor piercing intake must be completed with a parent or guardian. Any SMS choice on that form applies to the guardian’s provided number, not the minor’s number.

**Questions and changes.** Contact The Pink Elephant at [(832) 266-6917](tel:+18322666917) or [info@pinkelephantparlor.com](mailto:info@pinkelephantparlor.com) with privacy questions. Updates to this policy will be posted on the Privacy Policy page. A change to the kinds of texts sent will require an appropriate new consent choice.

## Draft Appointment SMS Terms — for shop review

**Program and consent.** The Pink Elephant appointment text program covers scheduling, confirmations, appointment changes, and reminders. Opt in using the separate, unchecked SMS checkbox on our intake form. Consent is optional and is not a condition of purchase or service. This program does not include promotional texts. You must be the phone’s account holder or an authorized user. For minor intake, a parent or guardian provides their own number and consent.

**Frequency and cost.** Message frequency varies based on your appointment activity. Message and data rates may apply according to your wireless plan.

**Stopping texts and getting help.** Once messaging is enabled, reply STOP to unsubscribe. You may receive one final confirmation of your opt-out; appointment texts will then stop. Reply HELP for assistance, or call [(832) 266-6917](tel:+18322666917) or email [info@pinkelephantparlor.com](mailto:info@pinkelephantparlor.com). Opting out of texts does not cancel an appointment. Contact the shop to schedule, change, or cancel an appointment if you are not using texts.

**Delivery.** Message delivery may be delayed or unavailable. Carriers are not liable for delayed or undelivered messages. Contact the shop directly for time-sensitive appointment changes.

**Privacy.** See the Privacy Policy for information about intake data and SMS consent.

## Storage and verification

The patch adds `appointmentSmsConsent` inside the existing `consent_forms.form_data` JSON. It records agreed/declined, the normalized US phone number when valid, client/guardian, purpose, disclosure wording and version, policy paths, source, and a browser-recorded timestamp. The existing row's `created_at` supplies the separate database creation time. It does not grant permission based on older forms that lack this record.

After the existing save finishes, the app reads the saved SMS record back from Supabase and compares every recorded field before reporting success. A failed readback preserves the form and asks staff to check it. This readback code has not been exercised against the live database.

The existing app lets staff delete whole consent forms. This patch does not create an independent permanent SMS audit log or enforce retention. Before using these records to send texts, implement a retained server-side consent history and an opt-out list independent of deletable forms. A browser record by itself is not a sending authorization system.

## Before enabling signup or sending

1. Shop review: confirm the draft policies match actual practices. The supplied support contacts, (832) 266-6917 and info@pinkelephantparlor.com, are included in both pages. Finalize retention practices and publish the reviewed pages.
2. Verify an approved test submission saves both agreed and declined preferences in Supabase. Implement and verify retained consent history, authenticated server-side permission checks, and Twilio STOP/HELP handling. Confirm the Twilio sender registration matches appointment messaging. Only then set `VITE_APPOINTMENT_SMS_ENABLED=true` and rebuild.

No Twilio credentials belong in the browser. This patch sends no texts and does not implement scheduling or Twilio webhooks.

## Validation

- TypeScript check passed (`npm run lint`).
- Production build passed (`npm run build`); the existing large-bundle warning remains.
- Five automated consent tests passed (`node --test tests/smsConsent.test.ts`): supported numbers, exact recorded evidence, guardian recipient, optional refusal, disabled signup, and missing or changed saved fields.
- Live database save, browser visual review, and Twilio delivery/STOP/HELP have not been verified.

Sources: [Twilio Messaging Policy](https://www.twilio.com/en-us/legal/messaging-policy) and [A2P 10DLC Campaign Onboarding Guide](https://help.twilio.com/articles/11847054539547).
