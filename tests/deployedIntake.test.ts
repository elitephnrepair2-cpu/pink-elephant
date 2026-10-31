import test from 'node:test';
import assert from 'node:assert/strict';
// Import the exact JavaScript file shipped to Vercel, not its TypeScript source.
import handler, { createIntakeHandler } from '../api/intake.js';

test('deployed JavaScript entry loads and rejects unsupported methods', async () => {
  let body = '';
  const response = { statusCode: 0, setHeader() {}, end(value: string) { body = value; } };
  await handler({ method: 'GET' } as any, response as any);
  assert.equal(response.statusCode, 405);
  assert.equal(JSON.parse(body).error, 'POST required.');
});

test('deployed entry reaches session lookup without TypeScript source imports', async () => {
  let body = '';
  const response = { statusCode: 0, setHeader() {}, end(value: string) { body = value; } };
  const deployed = createIntakeHandler({
    env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVER_KEY: 'test-only', INTAKE_ALLOWED_ORIGINS: 'https://example.com' },
    createDb: (() => ({ rpc: async () => ({ data: null, error: null }) })) as any,
  });
  await deployed({ method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json' }, socket: {}, body: { action: 'status', id: '00000000-0000-4000-8000-000000000000', token: '0'.repeat(64) } } as any, response as any);
  assert.equal(response.statusCode, 410);
  assert.match(JSON.parse(body).error, /expired/);
});
