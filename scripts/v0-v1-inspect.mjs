#!/usr/bin/env node
// Read-only status inspection for Lumivey's EXISTING v0 API v1 chats.
// No generation, no deployment, and no customer content in returned output.
// Usage: V0_API_KEY=... node scripts/v0-v1-inspect.mjs <existing-v1-chat-id>
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const BASE = 'https://api.v0.dev/v1';
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{3,128}$/.test(value);

export async function inspectV1({ chatId, apiKey, request = fetch }) {
  if (!validId(chatId)) throw new Error('Invalid v1 chat ID');
  if (!apiKey) throw new Error('V0_API_KEY is not configured');
  const response = await request(`${BASE}/chats/${encodeURIComponent(chatId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`v0 v1 status request failed: HTTP ${response.status}`);
  const payload = await response.json();
  const chat = payload?.data?.chat ?? payload?.data ?? payload?.chat ?? payload;
  const version = chat?.latestVersion ?? null;
  const status = version?.status ?? 'unknown';
  if (!['pending', 'completed', 'failed', 'unknown'].includes(status)) {
    throw new Error('Unexpected v0 v1 version status');
  }
  const created = Date.parse(version?.createdAt ?? '');
  const updated = Date.parse(version?.updatedAt ?? '');
  return {
    chatId,
    versionId: validId(version?.id) ? version.id : null,
    status,
    done: status === 'completed' || status === 'failed',
    previewReady: status === 'completed' && Boolean(version?.demoUrl),
    generationElapsedMs: Number.isFinite(created) && Number.isFinite(updated) && updated >= created ? updated - created : null,
    // Never leak chat text, generated code, sensitive preview URLs, screenshots or the key.
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await inspectV1({ chatId: process.argv[2], apiKey: process.env.V0_API_KEY })));
  } catch (error) {
    console.error(`V1 STATUS FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exitCode = 1;
  }
}
