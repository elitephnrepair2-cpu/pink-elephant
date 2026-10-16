export const SMS_CONSENT_VERSION = 'appointment-sms-v1';
export const SMS_CONSENT_TEXT = 'I agree to receive text messages from The Pink Elephant about appointment scheduling, confirmations, changes, and reminders at the number provided. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is optional and is not a condition of purchase. This does not include promotional texts.';
export const SMS_PHONE_OWNER_TEXT = 'I am the account holder or authorized user of this phone number.';

export interface AppointmentSmsConsent {
  agreed: boolean;
  recordedAt: string;
  phone: string;
  purpose: 'appointments';
  recipient: 'client' | 'guardian';
  version: string;
  wording: string;
  phoneOwnerWording: string;
  source: 'intake-form';
  privacyPolicyPath: '/privacy';
  termsPath: '/sms-terms';
}

// US numbers only for the first rollout. Do not silently guess another country.
export function normalizeSmsPhone(value: string): string | null {
  if (!/^[+\d\s().-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(national)) return null;
  if (value.trim().startsWith('+') && !(digits.length === 11 && digits.startsWith('1'))) return null;
  return `+1${national}`;
}

export function buildSmsConsent(input: {
  agreed: boolean; phone: string; isMinor: boolean; enabled: boolean; recordedAt: string;
}): AppointmentSmsConsent {
  const agreed = input.agreed === true;
  if (agreed && !input.enabled) throw new Error('Appointment text signup is not available yet.');
  const phone = normalizeSmsPhone(input.phone);
  if (agreed && !phone) throw new Error('Enter a valid US phone number for appointment texts, or leave SMS consent unchecked.');
  return {
    agreed, recordedAt: input.recordedAt, phone: phone || input.phone.trim(),
    purpose: 'appointments', recipient: input.isMinor ? 'guardian' : 'client',
    version: SMS_CONSENT_VERSION, wording: SMS_CONSENT_TEXT,
    phoneOwnerWording: SMS_PHONE_OWNER_TEXT, source: 'intake-form',
    privacyPolicyPath: '/privacy', termsPath: '/sms-terms',
  };
}

// A successful request alone is not proof that the consent fields survived storage.
export function savedConsentMatches(expected: AppointmentSmsConsent, actual: unknown): boolean {
  if (!actual || typeof actual !== 'object') return false;
  return Object.entries(expected).every(([key, value]) => (actual as Record<string, unknown>)[key] === value);
}
