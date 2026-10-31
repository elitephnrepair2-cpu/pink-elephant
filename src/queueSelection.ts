interface QueueVisit {
  id: string;
  db_id?: string;
  isArchived?: boolean;
  procedureStatus?: string;
}

// The database repeats this check under a row lock; UI state is never proof.
export function activeQueueIds(visits: QueueVisit[]): string[] {
  return [...new Set(visits
    .filter(visit => !visit.isArchived)
    .map(visit => visit.db_id || visit.id))];
}
