import type { V0BuildIdentity } from './v0-build-identity';

/**
 * CORE safety contract. The implementation MUST use a shared transactional database,
 * NEVER browser storage, process memory or an expiring lock. It must verify the DB role
 * and Preview branch before it is allowed to implement this interface.
 */
export type V0JobStatus = 'reserved' | 'submitting' | 'submitted' | 'uncertain' | 'completed' | 'failed';
export type V0Job = Readonly<{
  id: string;
  status: V0JobStatus;
  chatId: string | null;
}>;
export type V0JobKey = Readonly<V0BuildIdentity & { ownerId: string }>;
export interface DurableV0JobLedger {
  /** Atomic INSERT ON CONFLICT, returning the row AND whether it was newly inserted. */
  reserve(key: V0JobKey): Promise<{ job: V0Job; inserted: boolean }>;
  /** Single conditional UPDATE reserved -> submitting, COMMITTED before returning true. */
  claimOnce(jobId: string, ownerId: string): Promise<boolean>;
  /** Conditional UPDATE submitting -> submitted; must persist the upstream chat ID. */
  markSubmitted(jobId: string, ownerId: string, chatId: string): Promise<void>;
  /** Conditional UPDATE submitting -> uncertain; never reset to reserved. */
  markUncertain(jobId: string, ownerId: string): Promise<void>;
}

export type V0GateResult =
  | { kind: 'existing'; job: V0Job }
  | { kind: 'submitted'; jobId: string; chatId: string }
  | { kind: 'uncertain'; jobId: string };

/**
 * Caller MUST prove session/operator identity, Preview approval and final immutable
 * Brief/assets BEFORE calling. This function never derives ownerId from request JSON.
 * If a required persistence operation fails, no automatic retry of upstream POST occurs.
 */
export async function submitV0Once(input: {
  ledger: DurableV0JobLedger;
  key: V0JobKey;
  create: () => Promise<{ chatId: string }>;
}): Promise<V0GateResult> {
  const { ledger, key, create } = input;
  if (!key.ownerId || !key.ownerId.trim()) throw new Error('Verified owner ontbreekt');
  if (!key.approvedPreviewId || !/^[a-f0-9]{64}$/.test(key.briefSha256) || !/^[a-f0-9]{64}$/.test(key.assetsSha256)) {
    throw new Error('Ongeldige definitieve buildidentiteit');
  }
  const { job, inserted } = await ledger.reserve(key);
  if (!inserted) return { kind: 'existing', job };
  // A fresh reservation does not automatically authorize a network POST; only the
  // single committed conditional claim can grant that right.
  const claimed = await ledger.claimOnce(job.id, key.ownerId);
  if (!claimed) return { kind: 'existing', job: { ...job, status: 'submitting' } };

  let chatId: string;
  try {
    const response = await create();
    chatId = response.chatId;
    if (typeof chatId !== 'string' || !chatId.trim()) throw new Error('Upstream chat-ID ontbreekt');
  } catch {
    // An upstream timeout/crash can mean the paid build DID start. Never resend.
    // Even if markUncertain itself fails, persisted status remains submitting.
    try { await ledger.markUncertain(job.id, key.ownerId); } catch { /* fail closed */ }
    return { kind: 'uncertain', jobId: job.id };
  }

  try {
    await ledger.markSubmitted(job.id, key.ownerId, chatId);
  } catch {
    // The build was already sent and its chat ID might not have persisted.
    // This caller must reconcile manually; it cannot create again.
    return { kind: 'uncertain', jobId: job.id };
  }
  return { kind: 'submitted', jobId: job.id, chatId };
}
