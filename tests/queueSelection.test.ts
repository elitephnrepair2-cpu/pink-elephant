import test from 'node:test';
import assert from 'node:assert/strict';
import { activeQueueIds } from '../src/queueSelection.ts';

test('mixed selection includes waiting, in-progress and completed visits, but excludes history', () => {
  assert.deepEqual(activeQueueIds([
    { id: 'waiting' },
    { id: 'chair', procedureStatus: 'in_progress' },
    { id: 'done', procedureStatus: 'completed' },
    { id: 'old', procedureStatus: 'completed', isArchived: true },
    { id: 'alias', db_id: 'done', procedureStatus: 'completed' },
  ]), ['waiting', 'chair', 'done']);
});

test('an empty selection cannot become a clear-all request', () => {
  assert.deepEqual(activeQueueIds([]), []);
  assert.deepEqual(activeQueueIds([{ id: 'waiting', procedureStatus: 'waiting' }]), ['waiting']);
});
