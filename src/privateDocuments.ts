import type { SupabaseClient } from '@supabase/supabase-js';

export const DOCUMENT_FIELDS = ['signature', 'adultSignature', 'minorSignature', 'idPhoto', 'guardianIdPhoto', 'minorIdPhoto', 'minorBirthCert', 'idPhotoFront', 'idPhotoBack', 'guardianIdPhotoFront', 'guardianIdPhotoBack'] as const;

export function documentPath(value: unknown, projectUrl: string): string | null {
  if (typeof value !== 'string' || !value) return null;
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.origin !== new URL(projectUrl).origin) return null;
      const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/signatures\/(.+)$/);
      if (!match) return null;
      path = decodeURIComponent(match[1]);
    } catch { return null; }
  }
  if (!path.startsWith('consent/') || path.split('/').some(part => !part || part === '.' || part === '..') || /[\\?#]/.test(path)) return null;
  return path;
}

// Keep durable object paths separate from expiring, display-only signed links.
export async function withPrivateDocuments(form: Record<string, any>, client: SupabaseClient, projectUrl: string) {
  const result: Record<string, any> & { _documentPaths: Record<string, string> } = { ...form, _documentPaths: {} };
  await Promise.all(DOCUMENT_FIELDS.map(async field => {
    const path = documentPath(form[field], projectUrl);
    if (path) {
      result._documentPaths[field] = path;
      const { data, error } = await client.storage.from('signatures').createSignedUrl(path, 600);
      result[field] = !error && data?.signedUrl ? data.signedUrl : null;
    } else if (typeof form[field] === 'string' && /^https?:/i.test(form[field])) {
      // Never request a customer document from an unrecognized external URL.
      result[field] = null;
    }
  }));
  return result;
}

export function withoutTemporaryLinks(form: Record<string, any>, projectUrl: string) {
  const { _documentPaths, ...saved } = form;
  for (const field of DOCUMENT_FIELDS) {
    const path = _documentPaths?.[field] || documentPath(saved[field], projectUrl);
    if (path) saved[field] = path;
  }
  return saved;
}
