#!/usr/bin/env node
// Isolated Lovable MCP presigned-upload smoke test. Does not start a build.
// Usage: node scripts/lovable-upload-smoke.mjs /path/to/image.png < ticket.json
// Treat ticket.json as a short-lived secret: never commit or log its signed URL.
import { readFile, stat } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export function validateTicket(ticket) {
  const text = ticket?.upload_url ?? ticket?.url;
  if (typeof text !== 'string' || typeof ticket?.file_id !== 'string' || !ticket.file_id) {
    throw new Error('Ticket requires url/upload_url and file_id');
  }
  const url = new URL(text);
  if (url.protocol !== 'https:' || url.hostname !== 'storage.googleapis.com') {
    throw new Error('Unexpected upload destination; refusing to send image');
  }
  const headers = ticket.headers ?? {};
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    throw new Error('Invalid signed headers');
  }
  if (Object.keys(headers).some(k => /^(host|content-length|content-type)$/i.test(k))) {
    throw new Error('Signed headers may not override Host, Content-Length or Content-Type');
  }
  const signedHeaderNames = (url.searchParams.get('X-Goog-SignedHeaders') ?? '').split(';');
  if (!signedHeaderNames.includes('content-type')) {
    throw new Error('Expected a signed content-type header');
  }
  return { url: url.toString(), fileId: ticket.file_id, extraHeaders: headers };
}

export async function upload(filePath, ticket, request = fetch) {
  const { url, fileId, extraHeaders } = validateTicket(ticket);
  const info = await stat(filePath);
  if (!info.isFile() || info.size < 1 || info.size > 262144000) {
    throw new Error('Invalid upload file size');
  }
  const body = await readFile(filePath);
  const result = await request(url, {
    method: 'PUT',
    headers: { 'content-type': 'image/png', ...extraHeaders },
    body,
    signal: AbortSignal.timeout(30000),
  });
  if (!result.ok) throw new Error(`Upload failed: HTTP ${result.status}`);
  return { uploaded: true, status: result.status, fileId, bytes: body.byteLength };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error('Specify the local PNG path');
    const parts = [];
    for await (const piece of process.stdin) parts.push(piece);
    const ticket = JSON.parse(Buffer.concat(parts).toString('utf8'));
    console.log(JSON.stringify(await upload(process.argv[2], ticket)));
  } catch (e) {
    console.error(`FAIL: ${e.message}`);
    process.exitCode = 1;
  }
}
