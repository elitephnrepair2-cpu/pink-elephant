import test from 'node:test';
import assert from 'node:assert/strict';
import { documentPath, withPrivateDocuments, withoutTemporaryLinks } from '../src/privateDocuments.ts';

const origin = 'https://example.supabase.co';
test('accepts durable paths and same-project legacy public links', () => {
  assert.equal(documentPath('consent/form/signature.png', origin), 'consent/form/signature.png');
  assert.equal(documentPath(`${origin}/storage/v1/object/public/signatures/consent/form/signature.png`, origin), 'consent/form/signature.png');
  for (const value of ['https://other.test/consent/a.png', 'consent/../a.png', 'consent/a?token=x', 'other/a.png']) assert.equal(documentPath(value, origin), null);
});
test('signs staff document links but never writes the token back to the database', async () => {
  const client = { storage: { from(bucket: string) {
    assert.equal(bucket, 'signatures');
    return { async createSignedUrl(path: string, seconds: number) {
      assert.equal(seconds, 600);
      return { data: { signedUrl: `${origin}/storage/v1/object/sign/signatures/${path}?token=temporary` }, error: null };
    } };
  } } } as any;
  const original = { signature: 'consent/a/sig.png', name: 'Test' };
  const display = await withPrivateDocuments(original, client, origin);
  assert.match(display.signature, /token=temporary/);
  assert.deepEqual(withoutTemporaryLinks(display, origin), original);
});
test('failed signing hides the preview but preserves its durable path', async () => {
  const client = { storage: { from: () => ({ createSignedUrl: async () => ({ data: null, error: new Error('denied') }) }) } } as any;
  const display = await withPrivateDocuments({ signature: 'consent/a/sig.png' }, client, origin);
  assert.equal(display.signature, null);
  assert.equal(withoutTemporaryLinks(display, origin).signature, 'consent/a/sig.png');
});
