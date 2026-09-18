import test from 'node:test';
import assert from 'node:assert/strict';
import { GUEST_IDLE_MS, issueGuestResumeCredential, verifyGuestResumeCredential, renewedGuestExpiry, guestNeedsExpiry } from '../lib/lumivey/guest-discovery-core.ts';

const secret = 'test-only-nonproduction-secret-value-32-characters';
const now = new Date('2026-09-18T12:00:00Z');

test('opaque resume token is random and only digest is persisted', () => {
  const a = issueGuestResumeCredential(secret);
  const b = issueGuestResumeCredential(secret);
  assert.match(a.token, /^[A-Za-z0-9_-]{43}$/);
  assert.match(a.digest, /^[0-9a-f]{64}$/);
  assert.notEqual(a.token, a.digest);
  assert.notEqual(a.token, b.token);
  assert.notEqual(a.digest, b.digest);
  assert.deepEqual(Object.keys(a).sort(), ['digest', 'token']);
});

test('only matching credential of active unexpired dossier can resume', () => {
  const { token, digest } = issueGuestResumeCredential(secret);
  const stored = { status: 'active', resumeTokenDigest: digest, expiresAt: renewedGuestExpiry(now) };
  const check = (tokenValue, changed = {}, at = now) => verifyGuestResumeCredential({ token: tokenValue, stored: { ...stored, ...changed }, hmacKey: secret, now: at });
  assert.equal(check(token), true);
  assert.equal(check(issueGuestResumeCredential(secret).token), false);
  assert.equal(check('test-business-name'), false);
  assert.equal(check(token, { status: 'claimed' }), false);
  assert.equal(check(token, { status: 'expired' }), false);
  assert.equal(check(token, {}, stored.expiresAt), false);
  assert.equal(check(token, {}, new Date(stored.expiresAt.getTime() + 1)), false);
  assert.equal(check(token, { resumeTokenDigest: 'invalid' }), false);
});

test('extension needs verified activity and is exactly 30 days; expired records select for cleanup', () => {
  const expiry = renewedGuestExpiry(now);
  assert.equal(expiry.getTime() - now.getTime(), GUEST_IDLE_MS);
  assert.equal(guestNeedsExpiry('active', expiry, now), false);
  assert.equal(guestNeedsExpiry('active', expiry, expiry), true);
  assert.equal(guestNeedsExpiry('claimed', expiry, expiry), false);
  assert.equal(guestNeedsExpiry('expired', expiry, expiry), false);
});

test('missing secret and invalid clock fail closed', () => {
  assert.throws(() => issueGuestResumeCredential('short'), /GUEST_SECRET_UNAVAILABLE/);
  assert.throws(() => renewedGuestExpiry(new Date(NaN)), /GUEST_INVALID_TIME/);
  assert.throws(() => guestNeedsExpiry('active', new Date(NaN), now), /GUEST_INVALID_TIME/);
});
