import test from 'node:test';
import assert from 'node:assert/strict';
import { submitV0Once } from '../lib/lumivey/v0-build-gate.ts';

const key = Object.freeze({ ownerId: 'verified-operator', approvedPreviewId: 'preview-1', briefSha256: 'a'.repeat(64), assetsSha256: 'b'.repeat(64) });
function ledger() {
  let job;
  let claimed = false;
  return {
    async reserve() {
      if (job) return { job: { ...job }, inserted: false };
      job = { id: 'job-1', status: 'reserved', chatId: null };
      return { job: { ...job }, inserted: true };
    },
    async claimOnce() {
      if (claimed || job.status !== 'reserved') return false;
      claimed = true;
      job.status = 'submitting';
      return true;
    },
    async markSubmitted(_id, _owner, chatId) { job.status = 'submitted'; job.chatId = chatId; },
    async markUncertain() { job.status = 'uncertain'; },
    get job() { return job; },
  };
}

test('two concurrent callers reserve one build; duplicate never invokes upstream', async () => {
  const db = ledger();
  let calls = 0;
  const create = async () => { calls++; await Promise.resolve(); return { chatId: 'chat-one' }; };
  const results = await Promise.all([submitV0Once({ ledger: db, key, create }), submitV0Once({ ledger: db, key, create })]);
  assert.equal(calls, 1);
  assert.deepEqual(results.map(r => r.kind).sort(), ['existing', 'submitted']);
  assert.equal(db.job.status, 'submitted');
});

test('refresh after submission returns existing without another create', async () => {
  const db = ledger();
  let calls = 0;
  const create = async () => { calls++; return { chatId: 'chat-one' }; };
  await submitV0Once({ ledger: db, key, create });
  const repeated = await submitV0Once({ ledger: db, key, create });
  assert.equal(repeated.kind, 'existing');
  assert.equal(calls, 1);
});

test('uncertain upstream outcome is not retried', async () => {
  const db = ledger();
  let calls = 0;
  const create = async () => { calls++; throw new Error('timeout'); };
  const result = await submitV0Once({ ledger: db, key, create });
  const repeated = await submitV0Once({ ledger: db, key, create });
  assert.equal(result.kind, 'uncertain');
  assert.equal(repeated.kind, 'existing');
  assert.equal(db.job.status, 'uncertain');
  assert.equal(calls, 1);
});

test('lost claim cannot trigger upstream request', async () => {
  const db = ledger();
  db.claimOnce = async () => false;
  let calls = 0;
  const result = await submitV0Once({ ledger: db, key, create: async () => { calls++; return { chatId: 'chat-one' }; } });
  assert.equal(result.kind, 'existing');
  assert.equal(calls, 0);
});

test('failed post-response persistence never retries an already sent build', async () => {
  const db = ledger();
  db.markSubmitted = async () => { throw new Error('database disconnected'); };
  let calls = 0;
  const create = async () => { calls++; return { chatId: 'chat-one' }; };
  const result = await submitV0Once({ ledger: db, key, create });
  const again = await submitV0Once({ ledger: db, key, create });
  assert.equal(result.kind, 'uncertain');
  assert.equal(again.kind, 'existing');
  assert.equal(calls, 1);
});

test('unverified owner and invalid fingerprint fail before reservation', async () => {
  const db = ledger();
  await assert.rejects(submitV0Once({ ledger: db, key: { ...key, ownerId: '' }, create: async () => ({ chatId: 'x' }) }), /owner/);
  await assert.rejects(submitV0Once({ ledger: db, key: { ...key, briefSha256: 'invalid' }, create: async () => ({ chatId: 'x' }) }), /buildidentiteit/);
  assert.equal(db.job, undefined);
});
