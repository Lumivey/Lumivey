import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVerifiedBuildActor } from '../lib/lumivey/v0-session-membership.ts';
const subject = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const session = Object.freeze({ userId: subject, expiresAt: new Date('2030-01-01T00:00:00Z'), emailVerified: true, banned: false, impersonated: false });
const membership = Object.freeze({ subjectId: subject, ownerId: 'owner-a', active: true, canBuild: true });
const now = new Date('2026-09-18T12:00:00Z');
function trusted(s = session, rows = [membership]) {
  let reads = 0;
  return { async verifySession() { return s; }, async membershipsFor(id) { reads++; assert.equal(id, subject); return rows; }, get reads() { return reads; } };
}
test('one independently verified membership resolves owner without client owner input', async () => {
  const src = trusted();
  assert.deepEqual(await resolveVerifiedBuildActor(src, now), { subjectId: subject, ownerId: 'owner-a', canBuild: true });
  assert.equal(src.reads, 1);
});
test('anonymous, expired, unverified, banned, impersonated or invalid sessions never query membership', async () => {
  for (const s of [null, { ...session, expiresAt: now }, { ...session, emailVerified: false }, { ...session, banned: true }, { ...session, impersonated: true }, { ...session, userId: 'client-subject' }]) {
    const src = trusted(s);
    assert.equal(await resolveVerifiedBuildActor(src, now), null);
    assert.equal(src.reads, 0);
  }
});
test('absent, inactive, wrong-subject, no-build or ambiguous memberships fail closed', async () => {
  for (const rows of [[], [{ ...membership, active: false }], [{ ...membership, canBuild: false }], [{ ...membership, subjectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }], [membership, { ...membership, ownerId: 'owner-b' }]]) {
    assert.equal(await resolveVerifiedBuildActor(trusted(session, rows), now), null);
  }
});
test('provider and membership failures fail closed without leaking error', async () => {
  assert.equal(await resolveVerifiedBuildActor({ async verifySession() { throw Error('secret'); }, async membershipsFor() { throw Error('should not run'); } }, now), null);
  assert.equal(await resolveVerifiedBuildActor({ async verifySession() { return session; }, async membershipsFor() { throw Error('secret'); } }, now), null);
});
