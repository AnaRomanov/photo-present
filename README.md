# Unwrap 🎁

Upload a photo and a message, get a link. Whoever opens it sees a wiggling present and has to tap it to unwrap the photo. Made for sending in Messenger, where you can't gift-wrap pictures.

## How it works

- `/` is the create page. The photo is resized to 2048px max and re-encoded as JPEG in the browser (which also strips EXIF data like GPS location), then uploaded straight to Vercel Blob.
- `/g/<id>` is the gift page. The ID is 16 random characters, so links can't be guessed.
- Photos live in a **private** Blob store. They have no public URL and are only served through `/api/gift`.
- The gift page has no `og:image`, so Messenger's link preview won't spoil the photo.
- Check **Delete after it's opened** on the create page to make a gift self-destruct the moment the recipient actually taps it open (not just when the page loads — so peeking at your own "Peek at it" link is safe).

```
public/index.html     create page
public/gift.html      gift page (served at /g/:id)
public/blob-client.js bundled @vercel/blob/client for the browser (npm run vendor)
api/upload.js         issues upload tokens, checks password + path + type + size
api/create.js         saves the message once the photo is uploaded
api/gift.js           returns the message, or streams the photo with ?photo=1
```

## Deploy

1. Push this folder to a GitHub repo and import it in Vercel. No framework preset or build settings needed.
2. In the project, go to **Storage → Create Storage → Blob**, set access to **Private**, and connect it to the project.
3. Check **Settings → Environment Variables** for `BLOB_READ_WRITE_TOKEN`. Connected stores may authenticate with OIDC instead, which is fine for reading photos, but browser uploads need this token to sign upload requests. If it's missing, copy the read-write token from the Blob store's settings and add it as `BLOB_READ_WRITE_TOKEN`.
4. Optional but recommended: add an `UPLOAD_PASSWORD` environment variable so only you can create gifts. The create page asks for it once and remembers it on that device.
5. Redeploy so the new environment variables take effect.

## Local development

```
npm install
npx vercel link
npx vercel env pull .env.local
npx vercel dev
```

## Changing things

- Gift colours: the `:root` variables at the top of `public/gift.html`.
- Max message length and photo size: `api/_lib.js`.
- After upgrading `@vercel/blob`, run `npm run vendor` to rebuild `public/blob-client.js`.

## Deleting gifts

Gifts don't expire unless "Delete after it's opened" was checked when creating them. To remove one manually, delete the `gifts/<id>/` folder in the Blob store's file browser in the Vercel dashboard.

## Known limits

- HEIC photos (the default on iPhones) only re-encode to JPEG in browsers that can decode HEIC client-side — mainly Safari. On a browser that can't, the create page shows an error instead of silently uploading a photo most recipients couldn't view.
