/* INTERNAL / CORE. A projection of already-authorized, dossier-scoped storage rows.
 * NOT an auth boundary, persistence layer, AI extractor or production publication gate.
 * Call only after a trusted server verifies dossier access and loads scoped events.
 */
import { replayTrustedCorrections, type StoredCorrectionEvent } from './discovery-correction-journal.ts';
import { resolveSourceClaim, type SourceObservation, type ResolvedClaim } from './source-trust.ts';

const CLAIM_KEY = /^[a-z][a-z0-9_.:-]{0,127}$/;

export type ObservedClaim = Readonly<{ claimKey: string; observation: SourceObservation }>;
export type DiscoveryClaimProjection = Readonly<{
  confirmedFacts: readonly Readonly<{ claimKey: string; value: string; evidence: string }>[];
  sourceCandidates: readonly Readonly<{ claimKey: string; candidate: string; sourceId: string; evidence: string }>[];
  rejectedClaims: readonly string[];
}>;

/** Reconstruct from freshly loaded trusted data, never a client-supplied JSON snapshot.
 * A newer owner correction/rejection always wins over an old website observation.
 * On corrupt input, throw before returning ANY partial result.
 */
export function projectDiscoveryClaims(input: {
  dossierId: string;
  observations: readonly ObservedClaim[];
  events: readonly StoredCorrectionEvent[];
}): DiscoveryClaimProjection {
  const grouped = replayTrustedCorrections({ dossierId: input.dossierId, rows: input.events });
  if (!Array.isArray(input.observations)) throw new Error('DISCOVERY_PROJECTION_INVALID');
  const observations = new Map<string, SourceObservation>();
  for (const entry of input.observations) {
    if (!entry || typeof entry.claimKey !== 'string' || !CLAIM_KEY.test(entry.claimKey) ||
        !entry.observation || observations.has(entry.claimKey)) {
      throw new Error('DISCOVERY_PROJECTION_INVALID');
    }
    observations.set(entry.claimKey, entry.observation);
  }
  const keys = [...new Set([...observations.keys(), ...grouped.keys()])].sort();
  const confirmedFacts: { claimKey: string; value: string; evidence: string }[] = [];
  const sourceCandidates: { claimKey: string; candidate: string; sourceId: string; evidence: string }[] = [];
  const rejectedClaims: string[] = [];
  for (const claimKey of keys) {
    const resolved: ResolvedClaim = resolveSourceClaim({
      observation: observations.get(claimKey),
      verifiedOwnerStatements: grouped.get(claimKey),
    });
    if (resolved.state === 'confirmed' || resolved.state === 'corrected') {
      confirmedFacts.push({ claimKey, value: resolved.value, evidence: resolved.evidence });
    } else if (resolved.state === 'source-only') {
      sourceCandidates.push({ claimKey, candidate: resolved.candidate, sourceId: resolved.sourceId, evidence: resolved.evidence });
    } else if (resolved.state === 'rejected') {
      rejectedClaims.push(claimKey);
    }
  }
  return { confirmedFacts, sourceCandidates, rejectedClaims };
}
