import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeV0Reservation } from '../lib/lumivey/v0-build-authorization.ts';

const brief = 'a'.repeat(64);
const assets = 'b'.repeat(64);
const approved = Object.freeze({ ownerId: 'owner-a', previewId: 'preview-1', briefSha256: brief, assetsSha256: assets, approved: true, revoked: false });
const actor = Object.freeze({ subjectId: 'verified-session-subject', ownerId: 'owner-a', canBuild: true });
const request = Object.freeze({ requestedPreviewId: approved.previewId, requestedBriefSha256: brief, requestedAssetsSha256: assets });
function context({ authenticated = actor, approval = approved, fail = false } = {}) {
  let reads = 0;
  return {
    trusted: {
      async authenticate() { if (fail) throw Error('db secret must not leak'); return authenticated; },
      async findApprovedBuild() { reads++; return approval; },
    },
    get reads() { return reads; },
  };
}

// A valid session must be tied to the exact owner of a durable approved preview.
test('verified owner and immutable approved revision yield server-derived key', async () => {
  const ctx = context();
  const result = await authorizeV0Reservation({ trusted: ctx.trusted, ...request, ownerId: 'malicious-client-owner' });
  assert.deepEqual(result, { kind: 'authorized', key: { ownerId: 'owner-a', approvedPreviewId: 'preview-1', briefSha256: brief, assetsSha256: assets } });
  assert.equal(ctx.reads, 1);
});

test('anonymous and unprivileged sessions cannot read approval or reserve', async () => {
  for (const authenticated of [null, { ...actor, canBuild: false }, { ...actor, ownerId: '' }]) {
    const ctx = context({ authenticated });
    const result = await authorizeV0Reservation({ trusted: ctx.trusted, ...request });
    assert.equal(result.kind, 'blocked');
    assert.equal(ctx.reads, 0);
  }
});

test('tenant B cannot authorize tenant A preview even with matching hashes', async () => {
  const ctx = context({ authenticated: { ...actor, ownerId: 'owner-b' } });
  assert.deepEqual(await authorizeV0Reservation({ trusted: ctx.trusted, ...request }), { kind: 'blocked', code: 'NO_APPROVAL' });
});

test('unapproved, revoked, missing and mismatched preview never authorize', async () => {
  for (const approval of [null, { ...approved, approved: false }, { ...approved, revoked: true }, { ...approved, previewId: 'another-preview' }]) {
    const ctx = context({ approval });
    assert.deepEqual(await authorizeV0Reservation({ trusted: ctx.trusted, ...request }), { kind: 'blocked', code: 'NO_APPROVAL' });
  }
});

test('different final brief or assets revision fails closed', async () => {
  const ctx = context();
  for (const payload of [{ ...request, requestedBriefSha256: 'c'.repeat(64) }, { ...request, requestedAssetsSha256: 'd'.repeat(64) }]) {
    assert.deepEqual(await authorizeV0Reservation({ trusted: ctx.trusted, ...payload }), { kind: 'blocked', code: 'REVISION_MISMATCH' });
  }
});

test('invalid inputs stop before authentication, and backend failures return safe fixed code', async () => {
  const ctx = context();
  assert.deepEqual(await authorizeV0Reservation({ trusted: ctx.trusted, ...request, requestedPreviewId: '' }), { kind: 'blocked', code: 'INVALID_IDENTITY' });
  assert.equal(ctx.reads, 0);
  const failed = await authorizeV0Reservation({ trusted: context({ fail: true }).trusted, ...request });
  assert.deepEqual(failed, { kind: 'blocked', code: 'AUTH_UNAVAILABLE' });
  assert.ok(!JSON.stringify(failed).includes('secret'));
});
