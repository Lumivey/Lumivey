import test from 'node:test';
import assert from 'node:assert/strict';
import { replayTrustedCorrections } from '../lib/lumivey/discovery-correction-journal.ts';
import { resolveSourceClaim } from '../lib/lumivey/source-trust.ts';

const dossierId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const oldSite = { value: 'Projectmanagement', sourceId: 'old-website', evidence: 'oude dienstenpagina', observedAt: '2026-09-18T00:00:00Z' };
const event = (sequence, kind, value, utterance, extra = {}) => ({
  dossierId, claimKey: 'service.projectmanagement', sequence, kind, value, utterance,
  recordedAt: '2026-09-18T11:20:00Z', accessKind: 'verified-guest', subjectId: null, ...extra,
});

test('replayed correction overrides old website after a simulated pause and reload', () => {
  const storedRows = [
    event(1, 'confirmation', 'Projectmanagement', 'Ja, dat stond vroeger op mijn site.'),
    event(2, 'correction', 'Strategisch assetmanagement', 'Projectmanagement doe ik niet meer; ik focus op strategisch assetmanagement.'),
  ];
  const reloaded = structuredClone(storedRows);
  const statements = replayTrustedCorrections({ dossierId, rows: reloaded }).get('service.projectmanagement');
  assert.equal(resolveSourceClaim({ observation: oldSite, verifiedOwnerStatements: statements }).state, 'corrected');
  assert.equal(resolveSourceClaim({ observation: oldSite, verifiedOwnerStatements: statements }).value, 'Strategisch assetmanagement');
  assert.equal(storedRows[0].value, 'Projectmanagement'); // history remains intact
});

test('rejection persists across reload and a later explicit confirmation takes precedence', () => {
  const rows = [event(3, 'rejection', '', 'Die dienst bied ik niet meer aan.')];
  const first = replayTrustedCorrections({ dossierId, rows });
  assert.equal(resolveSourceClaim({ observation: oldSite, verifiedOwnerStatements: first.get('service.projectmanagement') }).state, 'rejected');
  const second = replayTrustedCorrections({ dossierId, rows: [...rows, event(4, 'confirmation', 'Projectmanagement', 'Ik bied projectmanagement opnieuw aan.')] });
  assert.equal(resolveSourceClaim({ observation: oldSite, verifiedOwnerStatements: second.get('service.projectmanagement') }).state, 'confirmed');
});

test('events for another dossier and duplicate or unordered sequences fail closed', () => {
  const valid = event(1, 'correction', 'Strategisch assetmanagement', 'Dat is mijn werk.');
  for (const rows of [
    [event(1, 'correction', 'Iets anders', 'Ander gesprek', { dossierId: otherId })],
    [valid, event(1, 'rejection', '', 'Nooit')],
    [event(2, 'rejection', '', 'Nee'), valid],
    [event(1, 'confirmation', 'Fake', '', { accessKind: 'verified-account', subjectId: null })],
    [event(1, 'confirmation', 'Fake', 'AI zegt het', { accessKind: 'model' })],
    [event(1, 'correction', '', 'Geen nieuwe waarde')],
    [event(1, 'rejection', 'Niet leeg', 'Nee')],
    [event(1, 'confirmation', 'Fake', 'Zeg maar', { claimKey: '../other-tenant' })],
  ]) assert.throws(() => replayTrustedCorrections({ dossierId, rows }), /DISCOVERY_JOURNAL_INVALID/);
});

test('empty trusted event history never converts a source into confirmed fact', () => {
  const statements = replayTrustedCorrections({ dossierId, rows: [] }).get('service.projectmanagement');
  assert.equal(resolveSourceClaim({ observation: oldSite, verifiedOwnerStatements: statements }).state, 'source-only');
});
