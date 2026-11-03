// Issues a short-lived token so the browser can upload the photo straight to Blob
// (avoids the 4.5 MB request limit on Vercel functions).
import { handleUpload } from '@vercel/blob/client';
import { ID_RE, MAX_PHOTO_BYTES, json, passwordOk } from './_lib.js';

export async function POST(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return json({ error: 'Server not set up: add BLOB_READ_WRITE_TOKEN (see README)' }, 500);
  }
  const body = await request.json();

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload = {};
        try { payload = JSON.parse(clientPayload || '{}'); } catch {}
        if (!passwordOk(payload.password)) throw new Error('Wrong password');

        const m = /^gifts\/([^/]+)\/photo$/.exec(pathname);
        if (!m || !ID_RE.test(m[1])) throw new Error('Bad upload path');

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
    });
    return json(result);
  } catch (err) {
    return json({ error: err.message }, err.message === 'Wrong password' ? 401 : 400);
  }
}
