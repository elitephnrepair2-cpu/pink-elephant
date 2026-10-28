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
