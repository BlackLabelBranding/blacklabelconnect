// Fetch the exact Black Label Connect artwork selected in Supabase Storage.
// Expo native app icons must be local at build time, not remote URLs.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE = 'https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/804FCE9F-FD54-4694-9682-9CFC158C53A1.png';
const response = await fetch(SOURCE, { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error('Connect icon fetch failed: HTTP ' + response.status);
const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.length < 40 || bytes.length > 15 * 1024 * 1024 ||
    !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ||
    bytes.toString('ascii', 12, 16) !== 'IHDR') {
  throw new Error('The Supabase Connect icon is not a valid PNG');
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width !== height || width < 1024) {
  throw new Error('Connect icon must be a square PNG at least 1024px: received ' + width + 'x' + height);
}
for (const destination of ['assets/connect-icon.png', 'public/favicon.png', 'public/apple-touch-icon.png', 'public/icon-192.png', 'public/icon-512.png']) {
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  console.log('Prepared ' + destination + ' (' + width + 'x' + height + ')');
}
