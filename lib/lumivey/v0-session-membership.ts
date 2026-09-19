import type { VerifiedActor } from './v0-build-authorization';

/** INTERNAL / CORE. Pure fail-closed contract; no route, DB adapter, or auth provider wired yet. */
export type ProviderSession = Readonly<{
  userId: string;
  expiresAt: Date;
  emailVerified: boolean;
  banned: boolean;
  impersonated: boolean;
}>;
export type OwnerMembership = Readonly<{
  subjectId: string;
  ownerId: string;
  active: boolean;
  canBuild: boolean;
}>;
export interface TrustedMembershipSource {
  /** Verify session against the real provider on the server; never accept a client session object. */
  verifySession(): Promise<ProviderSession | null>;
  /** Server-controlled membership rows only, keyed by verified provider subject. */
  membershipsFor(subjectId: string): Promise<readonly OwnerMembership[]>;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** No browser owner selection; multiple eligible owners require an explicit authenticated owner-context design. */
export async function resolveVerifiedBuildActor(source: TrustedMembershipSource, now: Date = new Date()): Promise<VerifiedActor | null> {
  try {
    const session = await source.verifySession();
    if (!session || !uuid.test(session.userId) || !(session.expiresAt instanceof Date) ||
        !Number.isFinite(session.expiresAt.valueOf()) || session.expiresAt <= now ||
        session.emailVerified !== true || session.banned !== false || session.impersonated !== false) return null;
    const memberships = await source.membershipsFor(session.userId);
    if (!Array.isArray(memberships)) return null;
    const eligible = memberships.filter((row) => row.subjectId === session.userId && row.active === true &&
      row.canBuild === true && typeof row.ownerId === 'string' && row.ownerId.trim() !== '' && row.ownerId.length <= 256);
    if (eligible.length !== 1) return null;
    return { subjectId: session.userId, ownerId: eligible[0].ownerId, canBuild: true };
  } catch {
    return null;
  }
}
