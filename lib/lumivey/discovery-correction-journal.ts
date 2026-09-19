/* INTERNAL / CORE. Pure replay of rows loaded from a trusted, dossier-scoped server repository.
 * Not an authorization boundary, route, database adapter, or AI-event classifier.
 * Only the server writer may assign sequence and capture exact entrepreneur utterances.
 * Never manufacture these rows from client-submitted confirmation flags or model output.
 */
export type StoredCorrectionEvent = Readonly<{
  dossierId: string;
  claimKey: string;
  sequence: number;
  kind: 'confirmation' | 'correction' | 'rejection';
  value: string;
  utterance: string;
  recordedAt: string;
  accessKind: 'verified-guest' | 'verified-account';
  subjectId: string | null;
}>;

export type ReplayedStatement = Readonly<{
  value: string;
  evidence: string;
  sequence: number;
  kind: StoredCorrectionEvent['kind'];
}>;

const KEY = /^[a-z][a-z0-9_.:-]{0,127}$/;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fail closed for corruption, wrong-tenant rows, duplicate/order defects and missing utterances.
 * Caller MUST authenticate access to dossier first, then fetch rows WHERE dossier_id = ...
 * with a restricted server DB role. This pure function cannot prove row provenance.
 */
export function replayTrustedCorrections(input: {
  dossierId: string;
  rows: readonly StoredCorrectionEvent[];
}): ReadonlyMap<string, readonly ReplayedStatement[]> {
  if (!ID.test(input.dossierId) || !Array.isArray(input.rows)) throw new Error('DISCOVERY_JOURNAL_INVALID');
  const grouped = new Map<string, ReplayedStatement[]>();
  let previousSequence = -1;
  for (const row of input.rows) {
    if (!row || row.dossierId !== input.dossierId || !KEY.test(row.claimKey) ||
        !Number.isSafeInteger(row.sequence) || row.sequence <= previousSequence ||
        !['confirmation', 'correction', 'rejection'].includes(row.kind) ||
        typeof row.value !== 'string' || typeof row.utterance !== 'string' ||
        !row.utterance.trim() || row.utterance.length > 20000 ||
        (row.kind !== 'rejection' && !row.value.trim()) ||
        (row.kind === 'rejection' && row.value !== '') ||
        !['verified-guest', 'verified-account'].includes(row.accessKind) ||
        (row.accessKind === 'verified-account' && (!row.subjectId || !row.subjectId.trim())) ||
        (row.accessKind === 'verified-guest' && row.subjectId !== null) ||
        typeof row.recordedAt !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(row.recordedAt) ||
        !Number.isFinite(Date.parse(row.recordedAt))) {
      throw new Error('DISCOVERY_JOURNAL_INVALID');
    }
    previousSequence = row.sequence;
    const statements = grouped.get(row.claimKey) ?? [];
    statements.push({
      value: row.value,
      evidence: row.utterance,
      sequence: row.sequence,
      kind: row.kind,
    });
    grouped.set(row.claimKey, statements);
  }
  return grouped;
}
