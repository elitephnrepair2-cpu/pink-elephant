// Offer printing only after the saved status has been read back successfully.
export async function completeVisitForPrinting(
  client: any,
  id: string,
  refresh: () => Promise<any[] | null>,
) {
  const { error } = await client.rpc('pe_complete_visit', { p_id: id });
  if (error) throw new Error('Could not mark the visit completed. Refresh the queue and try again.');
  const forms = await refresh();
  const saved = forms?.find(form => (form.db_id || form.id) === id);
  if (!saved || saved.isArchived || saved.procedureStatus !== 'completed')
    throw new Error('The completed status could not be verified. Refresh the queue before printing; nothing was cleared.');
  return saved;
}
