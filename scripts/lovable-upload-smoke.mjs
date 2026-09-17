#!/usr/bin/env node
// Lovable MCP get_file_upload_url returns a presigned ticket. This script tests its PUT stage.
// No generation or project creation: no build credits.
// Usage: node scripts/lovable-upload-smoke.mjs /path/to/image.png < ticket.json
// Treat ticket.json as secret and do not commit it.
import { readFile, stat } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export function validateTicket(ticket) {
  const text = ticket.upload_url ?? ticket.url;
  if (typeof text !== 'string' || typeof ticket.file_id !== 'string') {
    throw new Error('Ticket requires url/upload_url and file_id');
  }
  const url = new URL(text);
  if (url.protocol !== 'https:' || url.hostname !== 'storage.googleapis.com') {
    throw new Error('Unexpected upload destination; refusing to send image');
  }
  return { url: url.toString(), fileId: ticket.file_id, extraHeaders: ticket.headers ?? {} };
}

export async function upload(filePath, ticket, request = fetch) {
  const {url,fileId,extraHeaders} = validateTicket(ticket);
  if (Object.keys(extraHeaders).some(k => /^(host|content-length)$/i.test(k))) {
    throw new Error('Host/content-length must not be overridden');
  }
  const info = await stat(filePath);
  if (!info.isFile() || info.size < 1 || info.size > 262144000) {
    throw new Error('Invalid upload file size');
  }
  const body = await readFile(filePath);
  const result = await request(url, {
    method:'PUT', headers:{'content-type':'image/png',...extraHeaders},
    body, signal:AbortSignal.timeout(30000)
  });
  if (!result.ok) throw new Error(`Upload failed: HTTP ${result.status}`);
  return {uploaded:true,status:result.status,fileId,bytes:body.byteLength};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error('Specify the local PNG path');
    const parts=[];
    for await (const piece of process.stdin) parts.push(piece);
    const ticket=JSON.parse(Buffer.concat(parts).toString('utf8'));
    console.log(JSON.stringify(await upload(process.argv[2],ticket)));
  } catch (e) {
    console.error(`FAIL: ${e.message}`);
    process.exitCode=1;
  }
}
