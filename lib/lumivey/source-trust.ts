/* INTERNAL / CORE. Pure truth-resolution contract, not wired to routes or storage.
 * Only a trusted server may populate verifiedOwnerStatement after verifying
 * dossier access and preserving the actual entrepreneur message as evidence.
 * A scraped website, model inference, uploaded document, account or preview
 * request cannot create a confirmation merely by setting a status flag.
 */
export type SourceObservation = Readonly<{
  value: string;
  sourceId: string;
  evidence: string;
  observedAt: string;
}>;

export type VerifiedOwnerStatement = Readonly<{
  value: string;
  evidence: string;
  sequence: number;
  kind: 'confirmation' | 'correction' | 'rejection';
}>;

export type ResolvedClaim =
  | Readonly<{ state: 'source-only'; candidate: string; sourceId: string; evidence: string }>
  | Readonly<{ state: 'confirmed' | 'corrected'; value: string; evidence: string }>
  | Readonly<{ state: 'rejected'; evidence: string }>
  | Readonly<{ state: 'unknown' }>;

/** Takes owner statements retrieved from trusted, access-controlled dossier storage.
 * Latest explicit owner statement has precedence; observations never outvote it.
 * This function does NOT authenticate the speaker or persist the event.
 */
export function resolveSourceClaim(input: {
  observation?: SourceObservation | null;
  verifiedOwnerStatements?: readonly VerifiedOwnerStatement[];
}): ResolvedClaim {
  const valid = (input.verifiedOwnerStatements ?? []).filter((event) =>
    event && Number.isSafeInteger(event.sequence) && event.sequence >= 0 &&
    typeof event.evidence === 'string' && event.evidence.trim().length > 0 &&
    (event.kind === 'rejection' || (typeof event.value === 'string' && event.value.trim().length > 0))
  );
  const latest = valid.reduce<VerifiedOwnerStatement | null>(
    (current, event) => !current || event.sequence > current.sequence ? event : current, null
  );
  if (latest) {
    if (latest.kind === 'rejection') return { state: 'rejected', evidence: latest.evidence };
    return {
      state: latest.kind === 'correction' ? 'corrected' : 'confirmed',
      value: latest.value.trim(), evidence: latest.evidence,
    };
  }
  const source = input.observation;
  if (source && typeof source.value === 'string' && source.value.trim() &&
      typeof source.sourceId === 'string' && source.sourceId.trim() &&
      typeof source.evidence === 'string' && source.evidence.trim()) {
    return { state: 'source-only', candidate: source.value.trim(), sourceId: source.sourceId, evidence: source.evidence };
  }
  return { state: 'unknown' };
}
