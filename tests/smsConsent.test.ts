import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSmsConsent, normalizeSmsPhone, savedConsentMatches, SMS_CONSENT_TEXT } from '../src/smsConsent.ts';

const input = { agreed: true, phone: '(713) 555-0123', isMinor: false, enabled: true, recordedAt: '2026-10-16T06:00:00.000Z' };

test('only accepts supported US numbers and preserves a normalized destination', () => {
  for (const number of ['7135550123', '(713) 555-0123', '+1 713-555-0123']) assert.equal(normalizeSmsPhone(number), '+17135550123');
  for (const number of ['', '123', '+44 20 7946 0958', '7135550123 ext 2', '+7135550123']) assert.equal(normalizeSmsPhone(number), null);
});

test('records explicit consent, exact disclosure, recipient, and time', () => {
  const consent = buildSmsConsent(input);
  assert.equal(consent.agreed, true);
  assert.equal(consent.phone, '+17135550123');
  assert.equal(consent.recordedAt, input.recordedAt);
  assert.equal(consent.wording, SMS_CONSENT_TEXT);
  assert.equal(consent.purpose, 'appointments');
  assert.equal(consent.recipient, 'client');
  assert.equal(buildSmsConsent({ ...input, isMinor: true }).recipient, 'guardian');
});

test('declining texts does not block intake or grant messaging permission', () => {
  const consent = buildSmsConsent({ ...input, agreed: false, enabled: false, phone: 'not a mobile number' });
  assert.equal(consent.agreed, false);
});

test('blocks opt-in when rollout is disabled or the number is invalid', () => {
  assert.throws(() => buildSmsConsent({ ...input, enabled: false }), /not available/);
  assert.throws(() => buildSmsConsent({ ...input, phone: '123' }), /valid US phone/);
});

test('detects lost consent fields and altered saved values', () => {
  const consent = buildSmsConsent(input);
  assert.equal(savedConsentMatches(consent, JSON.parse(JSON.stringify(consent))), true);
  for (const key of Object.keys(consent)) {
    const missing = { ...consent };
    delete missing[key];
    assert.equal(savedConsentMatches(consent, missing), false);
  }
  assert.equal(savedConsentMatches(consent, { ...consent, agreed: false }), false);
  assert.equal(savedConsentMatches(consent, null), false);
});
