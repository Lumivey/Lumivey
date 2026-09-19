import type { V0JobKey } from './v0-build-gate';

/**
 * INTERNAL / CORE. Pure boundary only; this is NOT wired into a route and
 * cannot be used as a substitute for a verified session or durable approval.
 * Both lookups MUST be performed on the server against trusted storage.
 */
export type VerifiedActor = Readonly<{
  subjectId: string;
  ownerId: string;
  canBuild: boolean;
}>;

export type ApprovedBuild = Readonly<{
  ownerId: string;
  previewId: string;
  briefSha256: string;
  assetsSha256: string;
  approved: boolean;
  revoked: boolean;
}>;

export interface ServerBuildAuthorization {
  /** Verify a session or operator credential; never accept identity from request JSON. */
  authenticate(): Promise<VerifiedActor | null>;
  /** Fetch durable immutable approval by preview ID from trusted server storage. */
  findApprovedBuild(previewId: string): Promise<ApprovedBuild | null>;
}

export type BuildAuthorizationResult =
  | { kind: 'authorized'; key: V0JobKey }
  | { kind: 'blocked'; code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'INVALID_IDENTITY' | 'NO_APPROVAL' | 'REVISION_MISMATCH' | 'AUTH_UNAVAILABLE' };

/**
 * Request fields are identifiers to look up, NOT authority or evidence of approval.
 * Returning a key does not perform a v0 request or prove DB/RLS readiness.
 */
export async function authorizeV0Reservation(input: {
  trusted: ServerBuildAuthorization;
  requestedPreviewId: string;
  requestedBriefSha256: string;
  requestedAssetsSha256: string;
}): Promise<BuildAuthorizationResult> {
  const { requestedPreviewId: previewId, requestedBriefSha256: brief, requestedAssetsSha256: assets } = input;
  if (typeof previewId !== 'string' || !previewId.trim() || previewId.length > 256 ||
      typeof brief !== 'string' || !/^[a-f0-9]{64}$/.test(brief) ||
      typeof assets !== 'string' || !/^[a-f0-9]{64}$/.test(assets)) {
    return { kind: 'blocked', code: 'INVALID_IDENTITY' };
  }
  try {
    const actor = await input.trusted.authenticate();
    if (!actor) return { kind: 'blocked', code: 'UNAUTHENTICATED' };
    if (typeof actor.subjectId !== 'string' || !actor.subjectId.trim() ||
        typeof actor.ownerId !== 'string' || !actor.ownerId.trim() || actor.ownerId.length > 256 ||
        actor.canBuild !== true) return { kind: 'blocked', code: 'FORBIDDEN' };
    const approval = await input.trusted.findApprovedBuild(previewId);
    if (!approval || approval.approved !== true || approval.revoked !== false ||
        approval.previewId !== previewId || approval.ownerId !== actor.ownerId) {
      return { kind: 'blocked', code: 'NO_APPROVAL' };
    }
    if (approval.briefSha256 !== brief || approval.assetsSha256 !== assets) {
      return { kind: 'blocked', code: 'REVISION_MISMATCH' };
    }
    return { kind: 'authorized', key: {
      ownerId: actor.ownerId,
      approvedPreviewId: approval.previewId,
      briefSha256: approval.briefSha256,
      assetsSha256: approval.assetsSha256,
    } };
  } catch {
    // Database/session errors can contain secrets; return only a fixed code.
    return { kind: 'blocked', code: 'AUTH_UNAVAILABLE' };
  }
}
