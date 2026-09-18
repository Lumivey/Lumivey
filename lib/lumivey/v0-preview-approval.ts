/** INTERNAL / CORE. Pure boundary, NOT a public route, session provider or DB adapter.
 * No approval is issued from a browser checkbox, localStorage, client hash or email.
 * Persist only after independently authenticated permission and immutable revision lookup.
 */
export type ApprovalActor = Readonly<{ subjectId: string; ownerId: string; canApprove: boolean }>;
export type FinalPreviewRevision = Readonly<{
  previewId: string;
  ownerId: string;
  briefSha256: string;
  assetsSha256: string;
  finalized: boolean;
}>;
export type ApprovalWrite = Readonly<{
  previewId: string;
  ownerId: string;
  briefSha256: string;
  assetsSha256: string;
  approvedBySubject: string;
}>;
export interface TrustedPreviewApprovalStore {
  /** Independently validate an authenticated server session and current owner membership. */
  authenticate(): Promise<ApprovalActor | null>;
  /** Independently read immutable finalized artifacts, never trust request JSON as a revision. */
  findFinalRevision(previewId: string): Promise<FinalPreviewRevision | null>;
  /** Atomically INSERT ON CONFLICT DO NOTHING and compare stored immutable fields.
   * Must reject revoked approval; must not UPDATE an existing approval or remove revocations.
   */
  insertExactApproval(record: ApprovalWrite): Promise<'inserted' | 'already-identical' | 'conflict'>;
}
export type ApprovalResult =
  | Readonly<{ kind: 'approved'; status: 'inserted' | 'already-identical' }>
  | Readonly<{ kind: 'blocked'; code: 'INVALID_PREVIEW' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FINAL' | 'CONFLICT' | 'BACKEND_UNAVAILABLE' }>;
const sha = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const id = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 256;

/** Caller supplies only a preview ID; actor, owner, approval permission and hashes are server-derived. */
export async function approveFinalPreview(input: { trusted: TrustedPreviewApprovalStore; requestedPreviewId: string }): Promise<ApprovalResult> {
  if (!id(input.requestedPreviewId)) return { kind: 'blocked', code: 'INVALID_PREVIEW' };
  try {
    const actor = await input.trusted.authenticate();
    if (!actor) return { kind: 'blocked', code: 'UNAUTHENTICATED' };
    if (!id(actor.subjectId) || !id(actor.ownerId) || actor.canApprove !== true) {
      return { kind: 'blocked', code: 'FORBIDDEN' };
    }
    const revision = await input.trusted.findFinalRevision(input.requestedPreviewId);
    if (!revision || !id(revision.previewId) || revision.previewId !== input.requestedPreviewId ||
        revision.ownerId !== actor.ownerId || revision.finalized !== true ||
        !sha(revision.briefSha256) || !sha(revision.assetsSha256)) {
      return { kind: 'blocked', code: 'NOT_FINAL' };
    }
    const persisted = await input.trusted.insertExactApproval({
      previewId: revision.previewId,
      ownerId: actor.ownerId,
      briefSha256: revision.briefSha256,
      assetsSha256: revision.assetsSha256,
      approvedBySubject: actor.subjectId,
    });
    if (persisted === 'inserted' || persisted === 'already-identical') {
      return { kind: 'approved', status: persisted };
    }
    if (persisted === 'conflict') return { kind: 'blocked', code: 'CONFLICT' };
    return { kind: 'blocked', code: 'BACKEND_UNAVAILABLE' };
  } catch {
    // Never leak session, database or driver errors to the browser.
    return { kind: 'blocked', code: 'BACKEND_UNAVAILABLE' };
  }
}
