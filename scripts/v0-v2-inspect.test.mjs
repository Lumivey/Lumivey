import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectV0 } from './v0-v2-inspect.mjs';

test('reads completion, preview readiness and usage without exposing token or preview URL', async () => {
  const calls = [];
  const request = async (url, init) => {
    calls.push({ url, method: init.method, authorized: init.headers.Authorization === 'Bearer test-key' });
    return {
      ok: true,
      json: async () => url.endsWith('/preview')
        ? { data: { url: 'https://private-preview.example', token: 'SECRET' } }
        : { data: { message: { finishReason: 'stop', usage: { creditsCost: { total: 1.25 } }, updatedAt: '2026-09-17T12:00:00Z', content: 'SECRET COPY' } } },
    };
  };
  const result = await inspectV0({ chatId: 'chat_abc', messageId: 'msg_xyz', apiKey: 'test-key', request });
  assert.deepEqual(result, { chatId: 'chat_abc', messageId: 'msg_xyz', done: true, finishReason: 'stop', previewReady: true, creditsTotal: 1.25, updatedAt: '2026-09-17T12:00:00Z' });
  assert.equal(calls.length, 2);
  assert.ok(calls.every(c => c.method === 'GET' && c.authorized));
  assert.ok(!JSON.stringify(result).includes('SECRET'));
});

test('does not mark unfinished messages as completed', async () => {
  const request = async url => ({ ok: true, json: async () => url.endsWith('/preview') ? { data: null } : { data: { finishReason: null } } });
  const result = await inspectV0({ chatId: 'chat_abc', messageId: 'msg_xyz', apiKey: 'test-key', request });
  assert.equal(result.done, false);
  assert.equal(result.previewReady, false);
  assert.equal(result.creditsTotal, null);
});

test('refuses invalid identifiers and reports status failures without disclosing body', async () => {
  await assert.rejects(inspectV0({ chatId: '../oops', messageId: 'msg_xyz', apiKey: 'test-key', request: async () => { throw Error('should not run'); } }), /Invalid/);
  await assert.rejects(inspectV0({ chatId: 'chat_abc', messageId: 'msg_xyz', apiKey: 'test-key', request: async () => ({ ok: false, status: 401 }) }), /HTTP 401/);
});
