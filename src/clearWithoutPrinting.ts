import { activeQueueIds } from './queueSelection.ts';

// Explicit opt-out of printing; still archive only through the existing queue RPC.
export async function clearWithoutPrinting(
  client: any, visits: any[], confirmed: boolean, refresh: () => Promise<any[] | null>,
) {
  if (!confirmed) return false;
  const ids = activeQueueIds(visits);
  if (!ids.length || ids.length > 200) throw new Error('Select between 1 and 200 active visits.');
  let saved = false;
  try {
    const { data, error } = await client.rpc('pe_clear_queue', { p_ids: ids });
    if (error) throw new Error('The queue update could not be confirmed. Check the refreshed queue before retrying.');
    const returned = new Set((data || []).map((row: any) => row.id));
    if (returned.size !== ids.length || ids.some(id => !returned.has(id)))
      throw new Error('The queue returned an unexpected result. Check the refreshed queue.');
    saved = true;
  } finally {
    const forms = await refresh();
    if (!forms) throw new Error('The queue could not refresh. The change may have saved; refresh before retrying.');
    if (saved && forms.some(form => ids.includes(form.db_id || form.id) && !form.isArchived))
      throw new Error('Some selected customers are still active. Refresh before retrying.');
  }
  return true;
}
