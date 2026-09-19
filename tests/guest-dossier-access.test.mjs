import test from 'node:test';
import assert from 'node:assert/strict';
import { issueGuestResumeCredential } from '../lib/lumivey/guest-discovery-core.ts';
import { checkGuestResumeAccess } from '../lib/lumivey/guest-dossier-access.ts';

const key = 'server-only-test-key-of-at-least-32-characters';
const a = '11111111-1111-4111-8111-111111111111';
const b = '22222222-2222-4222-8222-222222222222';
const now = new Date('2026-09-18T12:00:00Z');
const credentialA = issueGuestResumeCredential(key);
const credentialB = issueGuestResumeCredential(key);
const rows = new Map([
  [a, { id: a, stateVersion: 3, status: 'active', expiresAt: new Date('2026-10-01T00:00:00Z'), resumeTokenDigest: credentialA.digest }],
  [b, { id: b, stateVersion: 6, status: 'active', expiresAt: new Date('2026-10-01T00:00:00Z'), resumeTokenDigest: credentialB.digest }],
]);
function check(dossierId, token, extra = {}) {
  return checkGuestResumeAccess({ dossierId, token, hmacKey: key, now, loadDossier: async id => rows.get(id) ?? null, ...extra });
}

test('two independent guest dossiers accept their own token and preserve correct version', async () => {
  assert.deepEqual(await check(a, credentialA.token), { ok: true, dossierId: a, stateVersion: 3 });
  assert.deepEqual(await check(b, credentialB.token), { ok: true, dossierId: b, stateVersion: 6 });
});

test('A token cannot access B, and missing dossier gives same generic denial', async () => {
  assert.deepEqual(await check(b, credentialA.token), { ok: false, code: 'DENIED' });
  assert.deepEqual(await check(a, credentialB.token), { ok: false, code: 'DENIED' });
  assert.deepEqual(await check('33333333-3333-4333-8333-333333333333', credentialA.token), { ok: false, code: 'DENIED' });
});

test('malformed tokens and ids are rejected without a storage lookup', async () => {
  let loads = 0;
  const loadDossier = async () => { loads++; return rows.get(a); };
  assert.deepEqual(await checkGuestResumeAccess({ dossierId: a, token: 'bad', hmacKey: key, now, loadDossier }), { ok: false, code: 'DENIED' });
  assert.deepEqual(await checkGuestResumeAccess({ dossierId: '../other', token: credentialA.token, hmacKey: key, now, loadDossier }), { ok: false, code: 'DENIED' });
  assert.equal(loads, 0);
});

test('expired and claimed dossiers reject an old token', async () => {
  const original = rows.get(a);
  assert.deepEqual(await check(a, credentialA.token, { now: original.expiresAt }), { ok: false, code: 'DENIED' });
  assert.deepEqual(await check(a, credentialA.token, { loadDossier: async () => ({ ...original, status: 'claimed' }) }), { ok: false, code: 'DENIED' });
});

test('wrong scope or corrupted state version fails closed', async () => {
  assert.deepEqual(await check(a, credentialA.token, { loadDossier: async () => rows.get(b) }), { ok: false, code: 'DENIED' });
  assert.deepEqual(await check(a, credentialA.token, { loadDossier: async () => ({ ...rows.get(a), stateVersion: -1 }) }), { ok: false, code: 'DENIED' });
});

test('missing server secret and storage failures never expose credentials or errors', async () => {
  assert.deepEqual(await check(a, credentialA.token, { hmacKey: undefined }), { ok: false, code: 'UNAVAILABLE' });
  assert.deepEqual(await check(a, credentialA.token, { loadDossier: async () => { throw new Error('postgres://secret@host'); } }), { ok: false, code: 'UNAVAILABLE' });
});
