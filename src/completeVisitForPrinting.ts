// Verify only this visit. Refreshing the whole queue also renews private image
// links for unrelated customers and must not delay the completion prompt.
export async function completeVisitForPrinting(client: any, id: string) {
  const { error } = await client.rpc('pe_complete_visit', { p_id: id });
  if (error) throw new Error('Could not mark the visit completed. Refresh the queue and try again.');
  const { data: row, error: readError } = await client.from('consent_forms')
    .select('id, form_data').eq('id', id).single();
  const saved = row?.form_data;
  if (readError || row?.id !== id || !saved || saved.isArchived || saved.procedureStatus !== 'completed')
    throw new Error('The completed status could not be verified. Refresh the queue before printing; nothing was cleared.');
  return { ...saved, id: row.id, db_id: row.id };
}
