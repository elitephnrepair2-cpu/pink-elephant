import test from 'node:test';
import assert from 'node:assert/strict';
import { completedQueueIds } from '../src/queueSelection.ts';

test('mixed selection never clears waiting, in-progress, or previously cleared visits', () => {
  assert.deepEqual(completedQueueIds([
    { id: 'waiting' },
    { id: 'chair', procedureStatus: 'in_progress' },
    { id: 'done', procedureStatus: 'completed' },
    { id: 'old', procedureStatus: 'completed', isArchived: true },
    { id: 'alias', db_id: 'done', procedureStatus: 'completed' },
  ]), ['done']);
});

test('an empty selection cannot become a clear-all request', () => {
  assert.deepEqual(completedQueueIds([]), []);
  assert.deepEqual(completedQueueIds([{ id: 'waiting', procedureStatus: 'waiting' }]), []);
});
