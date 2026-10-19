import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { IntakeError, validateDraft, validateImage, validateReceipt } from './intakeValidation.ts';
import { buildSmsConsent } from '../src/smsConsent.ts';

const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
class WorkflowError extends Error {
  operation: string;
  safeCode: string;
  constructor(operation: string, safeCode: string) {
    super('Intake workflow failed'); this.operation = operation; this.safeCode = safeCode;
  }
}

export function createIntakeHandler({ env = process.env, createDb = createClient } = {}) {
return async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  const reply = (status: number, value: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(value));
  };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, { error: 'POST required.' }); }
  const projectUrl = env.SUPABASE_URL;
  const serverKey = env.SUPABASE_SERVER_KEY;
  const allowedOrigins = (env.INTAKE_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!projectUrl || !serverKey || !allowedOrigins.length) return reply(503, { error: 'Customer intake is not configured yet. Please check with the front desk.' });
  if (typeof req.headers.origin !== 'string' || !allowedOrigins.includes(req.headers.origin)) return reply(403, { error: 'This intake address is not enabled.' });
  if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'JSON required.' });
  // This client is server-only. Never import this file into the browser bundle.
  const db = createDb(projectUrl, serverKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const rpc = async (name: string, args: Record<string, unknown>) => {
    const { data, error } = await db.rpc(name, args);
    if (error) {
      if (/Too many submissions/.test(error.message)) throw new IntakeError('Too many submissions. Please ask the front desk.');
      const code = error.code || (/fetch failed|network/i.test(error.message) ? 'NETWORK' : /invalid.*key|api.*key/i.test(error.message) ? 'API_KEY_REJECTED' : 'UNKNOWN');
      throw new WorkflowError(name, code);
    }
    return data;
  };
  try {
    let body = req.body;
    if (body === undefined) {
      const chunks: Buffer[] = []; let size = 0;
      for await (const chunk of req) {
        const buffer = Buffer.from(chunk); size += buffer.length;
        if (size > 3500000) return reply(413, { error: 'Photos are too large. Retake them or ask the front desk.' });
        chunks.push(buffer);
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } else {
      if (typeof body === 'string') body = JSON.parse(body);
      if (Buffer.byteLength(JSON.stringify(body)) > 3500000) return reply(413, { error: 'Photos are too large. Please ask the front desk.' });
    }
    validateReceipt(body);
    const hash = digest(body.token);
    const forwarded = req.headers['x-forwarded-for'];
    const address = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';
    const ipHash = createHmac('sha256', serverKey).update(address).digest('hex');
    const session = () => rpc('pe_qr_session', { p_id: body.id, p_hash: hash });
    const upload = async (image: ReturnType<typeof validateImage>, field: string) => {
      const path = `consent/${body.id}/${field}_${digest(image.bytes)}.${image.extension}`;
      const { error } = await db.storage.from('signatures').upload(path, image.bytes, { contentType: image.contentType, upsert: false });
      // Content-addressed paths make retries safe; completed evidence is never overwritten.
      if (error && !['409','Duplicate'].includes(String((error as any).statusCode)) && !/already exists/i.test(error.message)) throw new WorkflowError('private_upload', String((error as any).statusCode || 'UNKNOWN'));
      return path;
    };

    if (body.action === 'draft') {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const form = validateDraft(body.form, today);
      const required = form.type === 'minor-piercing' ? ['guardianIdPhoto','minorBirthCert'] : ['idPhoto'];
      const images = required.map(field => ({ field, image: validateImage(body.form[field], field) }));
      form._submissionDigest = digest(JSON.stringify({ form, images: images.map(i => ({ field: i.field, digest: digest(i.image.bytes) })) }));
      await rpc('pe_qr_create', { p_id: body.id, p_hash: hash, p_ip_hash: ipHash, p_form: form });
      const existing = await session();
      if (existing?.status === 'uploading') {
        const paths: Record<string, string> = {};
        for (const { field, image } of images) paths[field] = await upload(image, field);
        await rpc('pe_qr_ready', { p_id: body.id, p_hash: hash, p_paths: paths });
      }
      return reply(200, { status: (await session())?.status });
    }

    const current = await session();
    if (!current) return reply(410, { error: 'This intake session expired. Ask the front desk for help.' });
    if (body.action === 'cancel') {
      await rpc('pe_qr_cancel', { p_id: body.id, p_hash: hash });
      return reply(200, { cancelled: true });
    }
    if (body.action === 'approve-pin') {
      const configuredPin = env.INTAKE_APPROVAL_PIN;
      const staffId = env.INTAKE_APPROVAL_STAFF_ID;
      if (!configuredPin || configuredPin.length < 6 || !staffId || !/^[0-9a-f-]{36}$/i.test(staffId)) {
        return reply(503, { error: 'Staff PIN approval is not configured yet. Ask the front desk.' });
      }
      if (typeof body.pin !== 'string' || body.pin.length > 64 || body.idChecked !== true) throw new IntakeError('Staff must confirm the physical ID check and enter their approval PIN.');
      const matches = timingSafeEqual(createHash('sha256').update(body.pin).digest(), createHash('sha256').update(configuredPin).digest());
      const outcome = await rpc('pe_qr_try_pin', { p_id: body.id, p_hash: hash, p_ip_hash: ipHash, p_matches: matches, p_staff_id: staffId });
      if (outcome === 'locked') return reply(429, { error: 'Too many PIN attempts. Wait 15 minutes or ask staff to use their signed-in dashboard.' });
      if (outcome !== 'approved') return reply(403, { error: 'Approval failed. Check the staff PIN or ask staff to use their dashboard.' });
      return reply(200, { status: 'approved' });
    }
    if (body.action === 'status') return reply(200, { status: current.status });
    if (body.action !== 'complete') return reply(400, { error: 'Unknown intake action.' });
    if (current.status === 'completed') return reply(200, { saved: true });
    if (current.status !== 'approved') return reply(409, { error: 'Please wait for the staff ID check.' });
    if (body.aftercareAcknowledged !== true) throw new IntakeError('Please acknowledge the waiver and aftercare before submitting.');
    const isMinor = current.form_data.type === 'minor-piercing';
    const required = isMinor ? ['adultSignature','minorSignature'] : ['signature'];
    const signatures: Record<string, string> = {};
    // Validate all files before uploading any.
    const images = required.map(field => ({ field, image: validateImage(body[field], field) }));
    for (const { field, image } of images) signatures[field] = await upload(image, field);
    const sms = buildSmsConsent({ agreed: false, phone: current.form_data.phone, isMinor, enabled: false, recordedAt: new Date().toISOString() });
    await rpc('pe_qr_finish', { p_id: body.id, p_hash: hash, p_signatures: signatures, p_sms: sms });
    const saved = await session();
    if (saved?.status !== 'completed' || !saved.consent_form_id) throw new Error('Save verification failed');
    return reply(200, { saved: true });
  } catch (error) {
    if (error instanceof IntakeError || error instanceof SyntaxError) return reply(400, { error: error instanceof SyntaxError ? 'Invalid request.' : error.message });
    if (error instanceof WorkflowError) return reply(503, { error: `This step could not finish (${error.operation}: ${error.safeCode}). Please keep this page open and ask the front desk for help.` });
    if (error instanceof Error && /Too many submissions/.test(error.message)) return reply(429, { error: 'Too many attempts. Please ask the front desk for help.' });
    // Never log or echo request bodies, image data, tokens, or database error details.
    return reply(503, { error: 'We could not finish this step. Please try again with the same form or ask the front desk.' });
  }
}

}
export default createIntakeHandler();
