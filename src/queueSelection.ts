interface QueueVisit {
  id: string;
  db_id?: string;
  isArchived?: boolean;
  procedureStatus?: string;
}

// The database repeats this check under a row lock; UI state is never proof.
export function completedQueueIds(visits: QueueVisit[]): string[] {
  return [...new Set(visits
    .filter(visit => !visit.isArchived && visit.procedureStatus === 'completed')
    .map(visit => visit.db_id || visit.id))];
}
