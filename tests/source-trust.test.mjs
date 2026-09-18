import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSourceClaim } from '../lib/lumivey/source-trust.ts';

const oldWebsite = { value: 'Projectmanagement', sourceId: 'old-site/over-ons', evidence: 'Oude dienstenpagina noemt projectmanagement', observedAt: '2026-09-18T00:00:00Z' };
const statement = (kind, value, sequence) => ({ kind, value, sequence, evidence: `Authenticated entrepreneur said: ${kind} ${value}` });

test('old website is only a candidate, even when the source contains evidence', () => {
  assert.deepEqual(resolveSourceClaim({ observation: oldWebsite }), {
    state: 'source-only', candidate: 'Projectmanagement', sourceId: oldWebsite.sourceId, evidence: oldWebsite.evidence,
  });
});

test('latest explicit entrepreneur correction supersedes confirmed and scraped values', () => {
  assert.deepEqual(resolveSourceClaim({ observation: oldWebsite, verifiedOwnerStatements: [
    statement('confirmation', 'Projectmanagement', 1), statement('correction', 'Strategisch assetmanagement', 2),
  ] }), { state: 'corrected', value: 'Strategisch assetmanagement', evidence: statement('correction', 'Strategisch assetmanagement', 2).evidence });
});

test('explicit rejection blocks an old website fact rather than reverting to the old source', () => {
  const rejected = statement('rejection', '', 3);
  assert.deepEqual(resolveSourceClaim({ observation: oldWebsite, verifiedOwnerStatements: [rejected] }), {
    state: 'rejected', evidence: rejected.evidence,
  });
});

test('a later explicit confirmation can replace earlier correction without reusing stale site data', () => {
  const latest = statement('confirmation', 'Assetmanagementadvies', 8);
  assert.deepEqual(resolveSourceClaim({ observation: oldWebsite, verifiedOwnerStatements: [latest, statement('correction', 'Andere dienst', 5)] }), {
    state: 'confirmed', value: latest.value, evidence: latest.evidence,
  });
});

test('missing provenance and invalid owner event cannot transform a source into truth', () => {
  assert.deepEqual(resolveSourceClaim({ observation: { ...oldWebsite, evidence: '' } }), { state: 'unknown' });
  assert.equal(resolveSourceClaim({ observation: oldWebsite, verifiedOwnerStatements: [{...statement('confirmation', 'Onterecht bevestigd', 1), evidence: ''}] }).state, 'source-only');
});
