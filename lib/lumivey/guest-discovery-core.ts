import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** INTERNAL / CORE: server-side primitives only. NOT a connected guest endpoint or auth provider. */
export const GUEST_IDLE_DAYS = 30;
export const GUEST_IDLE_MS = GUEST_IDLE_DAYS * 24 * 60 * 60 * 1000;
const DIGEST = /^[0-9a-f]{64}$/;
const TOKEN = /^[A-Za-z0-9_-]{43}$/; // 32 cryptographically random bytes, base64url

export type GuestDossierState = 'active' | 'claimed' | 'expired';
export type GuestDossierAccess = Readonly<{
  status: GuestDossierState;
  resumeTokenDigest: string;
  expiresAt: Date;
}>;

/** Key MUST come from a server-only secret manager; separate from any database credentials. */
function secretKey(key: string): string {
  if (typeof key !== 'string' || key.length < 32) throw new Error('GUEST_SECRET_UNAVAILABLE');
  return key;
}

export function issueGuestResumeCredential(hmacKey: string): Readonly<{ token: string; digest: string }> {
  const key = secretKey(hmacKey);
  const token = randomBytes(32).toString('base64url');
  return { token, digest: createHmac('sha256', key).update(token, 'utf8').digest('hex') };
}

/** Compare only keyed digests. Never query by email, name, IP or raw URL token. */
export function verifyGuestResumeCredential(input: {
  token: unknown;
  stored: GuestDossierAccess;
  hmacKey: string;
  now: Date;
}): boolean {
  if (typeof input.token !== 'string' || !TOKEN.test(input.token)) return false;
  const stored = input.stored;
  if (stored.status !== 'active' || !DIGEST.test(stored.resumeTokenDigest)) return false;
  if (!(input.now instanceof Date) || !Number.isFinite(input.now.getTime()) ||
      !(stored.expiresAt instanceof Date) || !Number.isFinite(stored.expiresAt.getTime()) ||
      input.now.getTime() >= stored.expiresAt.getTime()) return false;
  const candidate = createHmac('sha256', secretKey(input.hmacKey)).update(input.token, 'utf8').digest();
  return timingSafeEqual(candidate, Buffer.from(stored.resumeTokenDigest, 'hex'));
}

/** Call only after server verified the credential. A passive visit never silently extends expiry. */
export function renewedGuestExpiry(verifiedAt: Date): Date {
  if (!(verifiedAt instanceof Date) || !Number.isFinite(verifiedAt.getTime())) {
    throw new Error('GUEST_INVALID_TIME');
  }
  return new Date(verifiedAt.getTime() + GUEST_IDLE_MS);
}

/** Selection for cleanup; physical blob deletion and DB record deletion require durable orchestration. */
export function guestNeedsExpiry(status: GuestDossierState, expiresAt: Date, now: Date): boolean {
  if (!(expiresAt instanceof Date) || !Number.isFinite(expiresAt.getTime()) ||
      !(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error('GUEST_INVALID_TIME');
  return status === 'active' && now.getTime() >= expiresAt.getTime();
}
