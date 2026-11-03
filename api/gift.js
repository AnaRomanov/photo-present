// GET  /api/gift?id=...            -> { message }
// GET  /api/gift?id=...&photo=1    -> the photo itself, streamed from the private store
// POST /api/gift?id=...            -> marks the gift opened; deletes it if it was "delete after opened"
import { del, get } from '@vercel/blob';
import { ID_RE, json, metaPath, photoPath } from './_lib.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  if (!ID_RE.test(id)) return json({ error: 'Not found' }, 404);

  if (searchParams.get('photo')) {
    const photo = await get(photoPath(id), { access: 'private' }).catch(() => null);
    if (!photo || photo.statusCode !== 200) return new Response('Not found', { status: 404 });
    return new Response(photo.stream, {
      headers: {
        'content-type': photo.blob.contentType,
        'cache-control': 'private, max-age=86400',
        'x-robots-tag': 'noindex',
        'x-content-type-options': 'nosniff',
      },
    });
  }

  const meta = await get(metaPath(id), { access: 'private' }).catch(() => null);
  if (!meta || meta.statusCode !== 200) return json({ error: 'Not found' }, 404);
  const { message = '' } = JSON.parse(await new Response(meta.stream).text());
  return json({ message }, 200, { 'cache-control': 'no-store' });
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  if (!ID_RE.test(id)) return json({ error: 'Not found' }, 404);

  const meta = await get(metaPath(id), { access: 'private' }).catch(() => null);
  if (!meta || meta.statusCode !== 200) return json({ error: 'Not found' }, 404);
  const { burnAfterOpen = false } = JSON.parse(await new Response(meta.stream).text());

  if (burnAfterOpen) {
    await del([photoPath(id), metaPath(id)]).catch(() => {});
  }
  return json({ ok: true });
}
