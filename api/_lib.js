// Shared helpers. Files starting with "_" are not exposed as routes by Vercel.

export const ID_RE = /^[A-Za-z0-9_-]{16}$/;
export const MAX_MESSAGE = 280;
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export const photoPath = (id) => `gifts/${id}/photo`;
export const metaPath = (id) => `gifts/${id}/meta.json`;

// Optional: set UPLOAD_PASSWORD in Vercel to stop strangers using your store.
export function passwordOk(given) {
  const required = process.env.UPLOAD_PASSWORD;
  if (!required) return true;
  if (typeof given !== 'string' || given.length !== required.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ required.charCodeAt(i);
  return diff === 0;
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
