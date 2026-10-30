import React, { useEffect, useRef } from 'react';

export function PrintConfirmation({ names, onResolve }: { names: string[]; onResolve: (confirmed: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => { dialog.current?.close(); };
  }, []);
  return <dialog ref={dialog} className="fixed inset-0 z-[400] m-auto bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 backdrop:bg-slate-950/90" aria-labelledby="print-confirm-title" onCancel={event => { event.preventDefault(); onResolve(false); }}>
    <h2 id="print-confirm-title" className="text-xl font-bold">Did every page print successfully?</h2>
    <p>Check the paper packet for {names.join(', ')}. Confirm all intake details, signatures and saved ID documents are readable.</p>
    <p>The browser cannot detect printer cancellation, empty paper or printer failure. Only confirm after checking the actual printed pages.</p>
    <button autoFocus className="btn-secondary w-full" onClick={() => onResolve(false)}>Cancelled / failed — keep in queue</button>
    <button className="btn-primary w-full" onClick={() => onResolve(true)}>I checked every printed page — clear queue</button>
    <p className="text-sm">Saved records, consent and attachments stay in Form History.</p>
  </dialog>;
}

export function CompletionPrintPrompt({ name, onPrint, onLater }: {
  name: string; onPrint: () => void; onLater: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => { dialog.current?.close(); };
  }, []);
  return <dialog ref={dialog} className="fixed inset-0 z-[400] m-auto bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 backdrop:bg-slate-950/90" aria-labelledby="completion-print-title" onCancel={event => { event.preventDefault(); onLater(); }}>
    <h2 id="completion-print-title" className="text-xl font-bold">Visit completed. Print now?</h2>
    <p>{name} is marked completed. Would you like to print the signed form now?</p>
    <p>After printing, you’ll confirm that every page printed successfully before clearing this customer from the queue.</p>
    <button autoFocus className="btn-secondary w-full" onClick={onLater}>Not now — keep in queue</button>
    <button className="btn-primary w-full" onClick={onPrint}>Print & Clear</button>
    <p className="text-sm">Saved records, consent and attachments stay saved.</p>
  </dialog>;
}

export function QueueClearChoice({ names, busy, onCancel, onPrint, onWithoutPrinting }: {
  names: string[]; busy: boolean; onCancel: () => void; onPrint: () => void; onWithoutPrinting: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => { dialog.current?.close(); };
  }, []);
  return <dialog ref={dialog} className="fixed inset-0 z-[400] m-auto bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 backdrop:bg-slate-950/90" aria-labelledby="queue-clear-title" onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
    <h2 id="queue-clear-title" className="text-xl font-bold">Clear without printing?</h2>
    <p>Are you choosing to remove {names.join(', ')} from the active queue without printing?</p>
    <p>This clears the selected visits from the queue, even if their procedures are not marked completed. Saved forms, consent, signatures and attachments remain in Form History.</p>
    <button autoFocus disabled={busy} className="btn-secondary w-full" onClick={onCancel}>Cancel — keep in queue</button>
    <button disabled={busy} className="btn-primary w-full" onClick={onPrint}>Print & Clear instead</button>
    <button disabled={busy} className="btn-secondary w-full" onClick={onWithoutPrinting}>{busy ? 'Updating queue…' : 'Yes, clear without printing'}</button>
  </dialog>;
}
