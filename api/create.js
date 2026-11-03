// Called after the photo upload finishes: saves the message and makes the gift live.
import { head, put } from '@vercel/blob';
import { ID_RE, MAX_MESSAGE, json, metaPath, passwordOk, photoPath } from './_lib.js';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const { id, message = '', password, burnAfterOpen = false } = body || {};
  if (!passwordOk(password)) return json({ error: 'Wrong password' }, 401);
  if (typeof id !== 'string' || !ID_RE.test(id)) return json({ error: 'Bad id' }, 400);
  if (typeof message !== 'string' || message.length > MAX_MESSAGE) {
    return json({ error: `Message must be ${MAX_MESSAGE} characters or fewer` }, 400);
  }

  try {
    await head(photoPath(id));
  } catch {
    return json({ error: 'Photo not found — try uploading again' }, 400);
  }

  try {
    await put(metaPath(id), JSON.stringify({ message: message.trim(), createdAt: new Date().toISOString(), burnAfterOpen: !!burnAfterOpen }), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: false,
    });
  } catch {
    return json({ error: 'This gift already exists' }, 409);
  }

  return json({ id, url: `/g/${id}` });
}
