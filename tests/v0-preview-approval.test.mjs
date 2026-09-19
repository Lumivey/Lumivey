import test from 'node:test';
import assert from 'node:assert/strict';
import { approveFinalPreview } from '../lib/lumivey/v0-preview-approval.ts';

const actor = Object.freeze({ subjectId: 'subject-a', ownerId: 'owner-a', canApprove: true });
const revision = Object.freeze({ previewId: 'preview-1', ownerId: 'owner-a', briefSha256: 'a'.repeat(64), assetsSha256: 'b'.repeat(64), finalized: true });
function harness({ session = actor, final = revision, result = 'inserted', errorAt = '' } = {}) {
  const writes = [];
  let artifactReads = 0;
  const trusted = {
    async authenticate() { if (errorAt === 'session') throw Error('secret session'); return session; },
    async findFinalRevision() { artifactReads++; if (errorAt === 'revision') throw Error('secret DB'); return final; },
    async insertExactApproval(write) { writes.push(write); if (errorAt === 'write') throw Error('secret DB'); return result; },
  };
  return { trusted, writes, get artifactReads() { return artifactReads; } };
}
const call = (ctx, requestedPreviewId = 'preview-1') => approveFinalPreview({ trusted: ctx.trusted, requestedPreviewId });

test('authenticated owner persists server-derived immutable approval, ignoring forged extra fields', async () => {
  const ctx = harness();
  assert.deepEqual(await approveFinalPreview({ trusted: ctx.trusted, requestedPreviewId: 'preview-1', ownerId: 'owner-b', briefSha256: 'c'.repeat(64) }), { kind: 'approved', status: 'inserted' });
  assert.deepEqual(ctx.writes, [{ previewId: 'preview-1', ownerId: 'owner-a', briefSha256: revision.briefSha256, assetsSha256: revision.assetsSha256, approvedBySubject: 'subject-a' }]);
});

test('bad ID, anonymous, no approval permission fail before writing', async () => {
  const badId = harness();
  assert.deepEqual(await call(badId, ''), { kind: 'blocked', code: 'INVALID_PREVIEW' });
  assert.equal(badId.artifactReads, 0);
  for (const session of [null, { ...actor, canApprove: false }, { ...actor, ownerId: '' }, { ...actor, subjectId: '' }]) {
    const ctx = harness({ session });
    assert.equal((await call(ctx)).kind, 'blocked');
    assert.equal(ctx.artifactReads, 0);
    assert.equal(ctx.writes.length, 0);
  }
});

test('tenant B cannot approve tenant A final revision; missing, mutable or invalid hashes rejected', async () => {
  for (const final of [null, { ...revision, ownerId: 'owner-b' }, { ...revision, previewId: 'preview-2' }, { ...revision, finalized: false }, { ...revision, briefSha256: 'untrusted' }, { ...revision, assetsSha256: '' }]) {
    const ctx = harness({ final });
    assert.deepEqual(await call(ctx), { kind: 'blocked', code: 'NOT_FINAL' });
    assert.equal(ctx.writes.length, 0);
  }
});

test('identical repeat is idempotent; changed or revoked stored approval is conflict, never overwrite', async () => {
  assert.deepEqual(await call(harness({ result: 'already-identical' })), { kind: 'approved', status: 'already-identical' });
  assert.deepEqual(await call(harness({ result: 'conflict' })), { kind: 'blocked', code: 'CONFLICT' });
});

test('backend exceptions leak no secrets and do not signal approval', async () => {
  for (const errorAt of ['session', 'revision', 'write']) {
    const result = await call(harness({ errorAt }));
    assert.deepEqual(result, { kind: 'blocked', code: 'BACKEND_UNAVAILABLE' });
    assert.equal(JSON.stringify(result).includes('secret'), false);
  }
});
