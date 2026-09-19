#!/usr/bin/env node
// Read-only diagnostics for NEW v0 API v2 chats. Never sends a generation request.
// Usage: V0_API_KEY=... node scripts/v0-v2-inspect.mjs <v2-chat-id> <assistant-message-id>
// Do not use v1 chat IDs: v2 cannot read v1 chats.
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const BASE = 'https://api.v0.dev/v2';
const validId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{3,128}$/.test(value);

async function readJson(path, apiKey, request) {
  const response = await request(`${BASE}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`v0 status request failed: HTTP ${response.status}`);
  return response.json();
}

export async function inspectV0({ chatId, messageId, apiKey, request = fetch }) {
  if (!validId(chatId) || !validId(messageId)) throw new Error('Invalid v2 chat/message ID');
  if (!apiKey) throw new Error('V0_API_KEY is not configured');
  const base = `/chats/${encodeURIComponent(chatId)}`;
  const [messageResponse, previewResponse] = await Promise.all([
    readJson(`${base}/messages/${encodeURIComponent(messageId)}`, apiKey, request),
    readJson(`${base}/preview`, apiKey, request),
  ]);
  const message = messageResponse.data?.message ?? messageResponse.data ?? messageResponse.message ?? messageResponse;
  const preview = previewResponse.data ?? previewResponse;
  const reason = message.finishReason ?? null;
  const usage = message.usage ?? {};
  return {
    chatId,
    messageId,
    done: reason !== null,
    finishReason: reason,
    previewReady: Boolean(preview?.url),
    creditsTotal: usage.creditsCost?.total ?? null,
    updatedAt: message.updatedAt ?? null,
    // Deliberately exclude signed preview URLs, preview tokens, prompt, files and response text.
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [, , chatId, messageId] = process.argv;
    console.log(JSON.stringify(await inspectV0({ chatId, messageId, apiKey: process.env.V0_API_KEY })));
  } catch (error) {
    console.error(`STATUS CHECK FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exitCode = 1;
  }
}
