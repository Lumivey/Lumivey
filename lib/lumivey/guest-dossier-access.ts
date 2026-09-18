/* INTERNAL / CORE. Pure application-layer precondition only: NO public route, SQL
 * connector, database authorization, cookie or account-ownership verification.
 * Caller must be trusted server code and loader must use a vetted least-privilege
 * scoped DB routine. Never use owner/BYPASSRLS credentials for this loader.
 * A successful result does not establish actual RLS isolation.
 */
import { verifyGuestResumeCredential, type GuestDossierAccess } from './guest-discovery-core.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

export type GuestDossierRecord = GuestDossierAccess & Readonly<{
  id: string;
  stateVersion: number;
}>;
export type GuestAccessDecision =
  | Readonly<{ ok: true; dossierId: string; stateVersion: number }>
  | Readonly<{ ok: false; code: 'DENIED' | 'UNAVAILABLE' }>;

/** Does not disclose whether the requested dossier exists. Any trusted data-store
 * error fails closed. Never return a stored digest or an input token to the client.
 * A later write MUST recheck status/expiry/digest and state_version atomically in DB.
 */
export async function checkGuestResumeAccess(input: Readonly<{
  dossierId: unknown;
  token: unknown;
  hmacKey: string | undefined;
  now: Date;
  loadDossier: (id: string) => Promise<GuestDossierRecord | null>;
}>): Promise<GuestAccessDecision> {
  if (typeof input.dossierId !== 'string' || !UUID.test(input.dossierId) ||
      typeof input.token !== 'string' || !TOKEN.test(input.token)) {
    return { ok: false, code: 'DENIED' };
  }
  if (typeof input.hmacKey !== 'string' || input.hmacKey.length < 32 ||
      !(input.now instanceof Date) || !Number.isFinite(input.now.getTime()) ||
      typeof input.loadDossier !== 'function') {
    return { ok: false, code: 'UNAVAILABLE' };
  }
  try {
    const row = await input.loadDossier(input.dossierId);
    if (!row || row.id !== input.dossierId ||
        !Number.isSafeInteger(row.stateVersion) || row.stateVersion < 0) {
      return { ok: false, code: 'DENIED' };
    }
    if (!verifyGuestResumeCredential({
      token: input.token, stored: row, hmacKey: input.hmacKey, now: input.now,
    })) return { ok: false, code: 'DENIED' };
    return { ok: true, dossierId: row.id, stateVersion: row.stateVersion };
  } catch {
    return { ok: false, code: 'UNAVAILABLE' };
  }
}
