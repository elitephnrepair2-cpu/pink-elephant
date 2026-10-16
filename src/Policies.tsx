import React from 'react';

export function PolicyPage({ kind, draft }: { kind: 'privacy' | 'sms-terms'; draft: boolean }) {
  const privacy = kind === 'privacy';
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-6 text-slate-800 leading-relaxed">
      <a href="/" className="text-primary underline">Return to The Pink Elephant</a>
      <h1 className="text-3xl font-black">{privacy ? 'Privacy Policy' : 'Appointment SMS Terms'}</h1>
      {draft && <p role="status" className="p-4 bg-amber-50 border border-amber-300 rounded-xl font-semibold">Draft for shop review. Appointment SMS signup is not enabled.</p>}
      <p>Policy version: appointment-sms-v1. These pages describe The Pink Elephant tattoo and piercing intake app and the proposed appointment text program.</p>
      {privacy ? <>
        <section><h2 className="text-xl font-bold">Information collected</h2><p>The intake app collects contact details, date of birth, service information, consent acknowledgments, signatures, and identification images. Minor piercing intake also collects guardian details and supporting documents. When you choose appointment texts, we record the phone number, your choice, the wording shown, and the time it was recorded.</p></section>
        <section><h2 className="text-xl font-bold">How information is used</h2><p>We use intake information to administer tattoo and piercing services, review consent and identification, manage the waiting list, and maintain service records. If you opt in, we use your number for appointment scheduling, confirmations, changes, and reminders. Appointment SMS consent does not authorize marketing texts.</p></section>
        <section><h2 className="text-xl font-bold">Service providers and SMS information</h2><p>The app uses Vercel for hosting and Supabase for database and file storage. The appointment text program is intended to use Twilio for messaging. Providers process information needed to operate these services. Mobile information and SMS opt-in data and consent will not be sold or shared with third parties or affiliates for marketing or promotional purposes. We may disclose information when required by law.</p></section>
        <section><h2 className="text-xl font-bold">Your choices</h2><p>Appointment texts are optional. You may complete intake without opting in. Once messaging is enabled, reply STOP to stop texts or HELP for assistance. You can also ask the front desk about your contact details, SMS preferences, access, corrections, or deletion requests. Some service and consent records may need to be retained to meet applicable requirements.</p></section>
        <section><h2 className="text-xl font-bold">Guardian information</h2><p>Minor piercing intake must be completed with a parent or guardian. Any SMS choice on that form applies to the guardian’s provided number, not the minor’s number.</p></section>
        <section><h2 className="text-xl font-bold">Questions and changes</h2><p>Contact The Pink Elephant using the phone number or email below with privacy questions. Updates to this policy will be posted on this page. A change to the kinds of texts sent will require an appropriate new consent choice.</p></section>
        <a className="text-primary underline" href="/sms-terms">Read Appointment SMS Terms</a>
      </> : <>
        <section><h2 className="text-xl font-bold">Program and consent</h2><p>The Pink Elephant appointment text program covers scheduling, confirmations, appointment changes, and reminders. Opt in using the separate, unchecked SMS checkbox on our intake form. Consent is optional and is not a condition of purchase or service. This program does not include promotional texts. You must be the phone’s account holder or an authorized user. For minor intake, a parent or guardian provides their own number and consent.</p></section>
        <section><h2 className="text-xl font-bold">Frequency and cost</h2><p>Message frequency varies based on your appointment activity. Message and data rates may apply according to your wireless plan.</p></section>
        <section><h2 className="text-xl font-bold">Stopping texts and getting help</h2><p>Once messaging is enabled, reply STOP to unsubscribe. You may receive one final confirmation of your opt-out; appointment texts will then stop. Reply HELP for assistance, or contact The Pink Elephant using the phone number or email below. Opting out of texts does not cancel an appointment. Contact the shop to schedule, change, or cancel an appointment if you are not using texts.</p></section>
        <section><h2 className="text-xl font-bold">Delivery</h2><p>Message delivery may be delayed or unavailable. Carriers are not liable for delayed or undelivered messages. Contact the shop directly for time-sensitive appointment changes.</p></section>
        <section><h2 className="text-xl font-bold">Privacy</h2><p>See our <a className="text-primary underline" href="/privacy">Privacy Policy</a> for information about intake data and SMS consent.</p></section>
      </>}
      <section className="border-t border-slate-200 pt-6 space-y-2">
        <h2 className="text-xl font-bold">Contact The Pink Elephant</h2>
        <p>Call <a className="text-primary underline" href="tel:+18322666917">(832) 266-6917</a></p>
        <p>Email <a className="text-primary underline" href="mailto:info@pinkelephantparlor.com">info@pinkelephantparlor.com</a></p>
      </section>
    </main>
  );
}
