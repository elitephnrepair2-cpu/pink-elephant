import { DOCUMENT_FIELDS } from './privateDocuments.ts';

export function packetFingerprint(row: any): string {
  return JSON.stringify([row.id, row.form_data, row.consent_agreed, row.consent_signed_at, row.waiver_version,
    row.signature_url, row.guardian_signature_url, row.minor_signature_url]);
}

// No queue mutation can occur before explicit staff confirmation. Print-dialog
// events deliberately play no part: browsers cannot prove paper reached a printer.
export async function runPrintAndClear(options: {
  print: () => Promise<void>;
  confirmPrinted: () => Promise<boolean>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}) {
  await options.print();
  if (!await options.confirmPrinted()) return false;
  try { await options.clear(); }
  finally { await options.refresh(); }
  return true;
}

export function assertSignedPacket(form: Record<string, any>) {
  const required = form.type === 'minor-piercing' ? ['adultSignature', 'minorSignature'] : ['signature'];
  if (required.some(field => !form[field])) throw new Error('A saved signature is missing or unavailable. The customer remains in the queue.');
  for (const field of DOCUMENT_FIELDS) {
    if (form._documentPaths?.[field] && !form[field]) throw new Error('A saved attachment could not be loaded. The customer remains in the queue.');
  }
}

// Read saved evidence again before calling the existing non-destructive queue RPC.
export async function clearPrintedQueue(client: any, ids: string[], snapshots: Map<string, string>) {
  const { data: latest, error: readError } = await client.from('consent_forms').select('*').in('id', ids);
  if (readError || latest?.length !== ids.length || latest.some((row: any) => snapshots.get(row.id) !== packetFingerprint(row)))
    throw new Error('A saved record changed or could not be checked after printing. Print the updated packet before clearing.');
  const { data, error } = await client.rpc('pe_clear_queue', { p_ids: ids });
  if (error) throw new Error('Queue update could not be confirmed. Check the refreshed queue before retrying.');
  const removed = new Set((data || []).map((row: any) => row.id));
  if (removed.size !== ids.length || ids.some(id => !removed.has(id)))
    throw new Error('Queue update returned an unexpected result. Check the refreshed queue.');
}

export async function preparePrintWindow(popup: Window, markup: string) {
  if (popup.closed) throw new Error('The packet window was closed. Nothing was cleared.');
  popup.document.open();
  popup.document.write(`<!doctype html><html><head><title>Pink Elephant signed intake packet</title></head><body>${markup}</body></html>`);
  popup.document.close();
  // The existing consent layout uses the app stylesheet. Copy only stylesheets,
  // never scripts or other customer UI into this dedicated printing window.
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(element => element.cloneNode(true));
  const stylesheetLoads = styles.filter(element => element instanceof HTMLLinkElement).map(element => new Promise<void>((resolve, reject) => {
    const link = element as HTMLLinkElement;
    link.onload = () => resolve(); link.onerror = () => reject(new Error('The packet styles could not load. Nothing was cleared.'));
    setTimeout(() => reject(new Error('The packet styles timed out. Nothing was cleared.')), 20000);
  }));
  styles.forEach(element => popup.document.head.appendChild(element));
  const style = popup.document.createElement('style');
  style.textContent = `body{background:white;color:black;margin:0}.packet+.packet{break-before:page}@media print{html,body{height:auto!important;overflow:visible!important}img{max-width:100%!important;height:auto!important;break-inside:avoid}}`;
  popup.document.head.appendChild(style);
  await Promise.all([...stylesheetLoads, ...Array.from(popup.document.images).map(img => new Promise<void>((resolve, reject) => {
    const fail = () => reject(new Error('A signature or attachment could not load. Nothing was cleared.'));
    if (img.complete) { img.naturalWidth ? resolve() : fail(); return; }
    const timer = setTimeout(fail, 20000);
    img.onload = () => { clearTimeout(timer); img.naturalWidth ? resolve() : fail(); };
    img.onerror = () => { clearTimeout(timer); fail(); };
  }))]);
  await popup.document.fonts.ready;
  if (popup.closed) throw new Error('The packet window was closed. Nothing was cleared.');
  popup.focus();
  popup.print();
}
