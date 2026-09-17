import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectV1 } from './v0-v1-inspect.mjs';

const mock = (payload, status = 200) => async (url, init) => {
  assert.equal(url, 'https://api.v0.dev/v1/chats/chat_123');
  assert.equal(init.method, 'GET');
  assert.equal(init.headers.Authorization, 'Bearer test-key');
  return { ok: status === 200, status, json: async () => payload };
};

test('completed v1 chat returns only safe status, no private URL, content or files', async () => {
  const result = await inspectV1({ chatId: 'chat_123', apiKey: 'test-key', request: mock({ id: 'chat_123', text: 'SECRET', latestVersion: { id: 'ver_456', status: 'completed', demoUrl: 'https://private.example/token', files: [{ content: 'SECRET CODE' }], createdAt: '2026-09-17T12:00:00Z', updatedAt: '2026-09-17T12:01:30Z' } }) });
  assert.deepEqual(result, { chatId: 'chat_123', versionId: 'ver_456', status: 'completed', done: true, previewReady: true, generationElapsedMs: 90000 });
  assert.ok(!JSON.stringify(result).includes('SECRET'));
  assert.ok(!JSON.stringify(result).includes('private.example'));
});

test('pending and missing versions cannot be mistaken for completed builds', async () => {
  const pending = await inspectV1({ chatId: 'chat_123', apiKey: 'test-key', request: mock({ latestVersion: { id: 'ver_456', status: 'pending', demoUrl: 'https://stale.example' } }) });
  assert.equal(pending.done, false);
  assert.equal(pending.previewReady, false);
  const missing = await inspectV1({ chatId: 'chat_123', apiKey: 'test-key', request: mock({ id: 'chat_123' }) });
  assert.equal(missing.status, 'unknown');
  assert.equal(missing.generationElapsedMs, null);
});

test('failed build and HTTP errors are represented without dumping response bodies', async () => {
  const failed = await inspectV1({ chatId: 'chat_123', apiKey: 'test-key', request: mock({ latestVersion: { status: 'failed' } }) });
  assert.equal(failed.done, true);
  assert.equal(failed.previewReady, false);
  await assert.rejects(inspectV1({ chatId: 'chat_123', apiKey: 'test-key', request: mock({ secret: 'NEVER LOG' }, 403) }), /HTTP 403/);
});

test('rejects invalid IDs and missing credentials before contacting v0', async () => {
  await assert.rejects(inspectV1({ chatId: '../secret', apiKey: 'test-key', request: async () => { throw Error('must not call'); } }), /Invalid/);
  await assert.rejects(inspectV1({ chatId: 'chat_123', apiKey: '', request: async () => { throw Error('must not call'); } }), /V0_API_KEY/);
});
