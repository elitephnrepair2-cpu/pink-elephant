export class IntakeError extends Error {}

export function ageOnDate(value: unknown, today: string): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new IntakeError('Enter a valid date of birth.');
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || value > today || value < '1900-01-01') throw new IntakeError('Enter a valid date of birth.');
  const [y, m, d] = value.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}

export function validateDraft(raw: any, today: string) {
  if (!raw || !['tattoo', 'piercing', 'minor-piercing'].includes(raw.type)) throw new IntakeError('Choose a service.');
  const result: Record<string, any> = { type: raw.type };
  for (const field of ['name','dob','address','phone','city','state','zip','parentGuardianName','guardianDOB','minorName','relationToMinor','procedureExplanation','healingTime']) {
    const value = raw[field] ?? '';
    if (typeof value !== 'string' || value.length > (field === 'procedureExplanation' ? 2000 : 300)) throw new IntakeError('An intake field is invalid or too long.');
    result[field] = value.trim();
  }
  const phoneDigits = result.phone.replace(/\D/g, '');
  if (!result.phone || !result.address || phoneDigits.length < 10 || phoneDigits.length > 15 || !/^[+\d\s().-]+$/.test(result.phone)) throw new IntakeError('Name, address, and a valid phone number are required.');
  const age = ageOnDate(result.dob, today);
  if (raw.type === 'minor-piercing') {
    if (!result.parentGuardianName || !result.minorName || !result.relationToMinor) throw new IntakeError('Guardian, minor, and relationship details are required.');
    if (age >= 18 || ageOnDate(result.guardianDOB, today) < 18) throw new IntakeError('Minor intake requires a minor and an adult guardian.');
  } else if (!result.name || age < 18) throw new IntakeError('Adult intake requires a customer age 18 or older.');
  // Ignore caller-supplied verification, archive, signature, consent, or storage fields.
  return result;
}

export function validateImage(value: unknown, label: string) {
  if (typeof value !== 'string') throw new IntakeError(`${label} is required.`);
  const match = value.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length % 4 !== 0 || match[2].length > 820000) throw new IntakeError(`${label} must be a PNG/JPEG image under 600 KB. Retake the photo or ask the front desk for help.`);
  const bytes = Buffer.from(match[2], 'base64');
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpg = bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if ((match[1] === 'png' ? !png : !jpg) || bytes.length < 32 || bytes.length > 600000) throw new IntakeError(`${label} is not a supported image.`);
  return { bytes, contentType: `image/${match[1]}`, extension: match[1] === 'png' ? 'png' : 'jpg' };
}

export function validateReceipt(body: any) {
  if (!body || typeof body.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)
    || typeof body.token !== 'string' || !/^[0-9a-f]{64}$/i.test(body.token)) throw new IntakeError('Invalid intake session. Start again or ask the front desk.');
}
