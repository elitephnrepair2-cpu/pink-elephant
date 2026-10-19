import React, { useEffect, useRef, useState } from 'react';
import type { FormType } from './types';

type Receipt = { id: string; token: string };
const api = async (action: string, receipt: Receipt, extra: Record<string, any> = {}) => {
  const response = await fetch('/api/intake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...receipt, ...extra }) });
  const data = await response.json().catch(() => ({ error: 'Intake is unavailable. Please ask the front desk.' }));
  if (!response.ok) throw new Error(data.error || 'Could not complete this step.');
  return data;
};

export async function prepareImage(value: string): Promise<string> {
  const img = new Image(); img.src = value;
  await img.decode();
  if (img.width <= 0 || img.height <= 0) throw new Error('Could not read your image. Please retake it.');
  // Bound requests without shrinking identification below a readable size.
  const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare your image.');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const compressed = canvas.toDataURL('image/jpeg', .88);
  if (compressed.length > 800000) throw new Error('Your photo is too large. Please retake it with less background, keeping the ID clearly readable.');
  return compressed;
}

export function PublicIntake({ Form }: { Form: React.ComponentType<any> }) {
  const [type, setType] = useState<FormType | null>(null);
  const [saved, setSaved] = useState(false);
  const [approved, setApproved] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const receipt = useRef<Receipt | null>(null);
  const frozenDraft = useRef<Record<string, any> | null>(null);
  const requestInFlight = useRef(false);

  const requestApproval = async (formData: any) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true; setError('');
    try {
      if (!receipt.current) {
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        receipt.current = { id: crypto.randomUUID(), token: Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('') };
      }
      if (!frozenDraft.current) {
        const form = { ...formData, type };
        for (const field of type === 'minor-piercing' ? ['guardianIdPhoto','minorBirthCert'] : ['idPhoto']) {
          if (!form[field]) throw new Error('Please capture all required identification photos.');
          form[field] = await prepareImage(form[field]);
        }
        // Do not send duplicate full-size previews, signatures, or UI flags.
        const fields = ['name','dob','address','phone','city','state','zip','parentGuardianName','guardianDOB','minorName','relationToMinor','procedureExplanation','healingTime','idPhoto','guardianIdPhoto','minorBirthCert'];
        frozenDraft.current = Object.fromEntries(fields.filter(field => form[field] !== undefined).map(field => [field, form[field]]));
        frozenDraft.current.type = type;
      }
      const result = await api('draft', receipt.current, { form: frozenDraft.current });
      setApproved(result.status === 'approved');
      setWaiting(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not send the ID check.'); throw error; }
    finally { requestInFlight.current = false; }
  };

  useEffect(() => {
    if (!waiting || approved || !receipt.current) return;
    let active = true; let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const result = await api('status', receipt.current!);
        if (!active) return;
        if (result.status === 'approved') { setApproved(true); setError(''); return; }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Could not check staff approval.'); }
      if (active) timer = setTimeout(poll, 8000);
    };
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, [waiting, approved]);

  const submit = async (data: any) => {
    if (!receipt.current || !approved) throw new Error('Staff must check your physical ID first.');
    setError('');
    try {
      const images: Record<string, string> = {};
      for (const field of type === 'minor-piercing' ? ['adultSignature','minorSignature'] : ['signature']) images[field] = data[field];
      const result = await api('complete', receipt.current, { ...images, aftercareAcknowledged: data.aftercareAcknowledged });
      if (result.saved !== true) throw new Error('Could not verify your saved waiver.');
      receipt.current = null; frozenDraft.current = null;
      setSaved(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save your waiver.'); throw error; }
  };

  const approveOnPhone = async (pin: string, formData: any) => {
    if (!waiting) await requestApproval(formData);
    if (!receipt.current) throw new Error('Send the ID check first.');
    const result = await api('approve-pin', receipt.current, { pin, idChecked: true });
    if (result.status !== 'approved') throw new Error('Staff approval could not be verified.');
    setApproved(true);
    setError('');
  };

  const returnForCorrection = async () => {
    if (receipt.current) await api('cancel', receipt.current);
    receipt.current = null; frozenDraft.current = null;
    setWaiting(false); setApproved(false); setError('');
  };

  return <div className="min-h-screen bg-[#fff8f5] px-4 py-8 text-[#502237]">
    <main className="max-w-3xl mx-auto">
      <header className="text-center mb-7">
        <img src="/assets/pink-elephant-logo.png" alt="The Pink Elephant" className="w-24 h-24 object-contain mx-auto" />
        <h1 className="text-3xl font-black mt-3">A little paperwork. A little pink.</h1>
        <p className="mt-2 text-sm">Your tattoo & piercing intake · No account needed</p>
      </header>
      {saved ? <section className="bg-white rounded-3xl border border-pink-200 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">You’re checked in ♡</h2>
        <p>Your waiver and signature are saved. Check with the front desk for your next step.</p>
        <a className="btn-primary" href="/welcome">Instagram & aftercare reminders</a>
      </section> : <>
        {!type ? <section className="space-y-4">
          <h2 className="font-bold text-xl text-center">What brings you in today?</h2>
          {(['tattoo','piercing','minor-piercing'] as FormType[]).map(value => <button key={value} type="button" className="btn-primary w-full" onClick={() => setType(value)}>{value === 'minor-piercing' ? 'Piercing with parent / guardian' : value}</button>)}
          <p className="text-sm text-center">Have your physical ID ready. A parent or guardian must be present for minor intake. Staff will confirm service eligibility before proceeding.</p>
        </section> : <section className="bg-white rounded-3xl border border-pink-200 p-5 sm:p-8 shadow-sm">
          {error && <p role="alert" className="border border-red-200 bg-red-50 text-red-800 p-4 rounded-xl mb-5">{error}</p>}
          <Form type={type} onSubmit={submit} publicIntake publicApproved={approved} publicWaiting={waiting} publicError={error} onRequestPublicApproval={requestApproval} onApprovePublicPin={approveOnPhone} onReturnPublicCorrection={returnForCorrection} />
        </section>}
      </>}
      <footer className="text-center text-sm mt-7 flex justify-center gap-4"><a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a><a href="/sms-terms" target="_blank" rel="noopener noreferrer" className="underline">SMS Terms</a></footer>
    </main>
  </div>;
}
