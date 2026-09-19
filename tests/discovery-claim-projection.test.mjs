import test from 'node:test';
import assert from 'node:assert/strict';
import { projectDiscoveryClaims } from '../lib/lumivey/discovery-claim-projection.ts';

const dossierId = '11111111-1111-4111-8111-111111111111';
const oldSite = { claimKey: 'service.projectmanagement', observation: { value: 'Projectmanagement', sourceId: 'old-site', evidence: 'Oude dienstenpagina', observedAt: '2026-09-18T00:00:00Z' } };
const independentSource = { claimKey: 'business.location', observation: { value: 'Rotterdam', sourceId: 'old-site', evidence: 'Contactpagina', observedAt: '2026-09-18T00:00:00Z' } };
const event = (sequence, kind, value, claimKey = 'service.projectmanagement') => ({ dossierId, claimKey, sequence, kind, value, utterance: `Ondernemer: ${kind} ${value}`, recordedAt: '2026-09-18T11:20:00Z', accessKind: 'verified-guest', subjectId: null });

test('reloading a corrected dossier never republishes the old service but retains other unconfirmed sources', () => {
  const saved = JSON.parse(JSON.stringify({ dossierId, observations: [oldSite, independentSource], events: [event(1, 'correction', 'Strategisch assetmanagement')] }));
  const result = projectDiscoveryClaims(saved);
  assert.deepEqual(result.confirmedFacts.map(({ claimKey, value }) => ({ claimKey, value })), [{ claimKey: 'service.projectmanagement', value: 'Strategisch assetmanagement' }]);
  assert.deepEqual(result.sourceCandidates.map(({ claimKey, candidate }) => ({ claimKey, candidate })), [{ claimKey: 'business.location', candidate: 'Rotterdam' }]);
  assert.equal(result.confirmedFacts.some(({ value }) => value === 'Projectmanagement'), false);
});

test('explicitly rejected old claim cannot reappear as an unconfirmed publication candidate', () => {
  const result = projectDiscoveryClaims({ dossierId, observations: [oldSite], events: [event(1, 'rejection', '')] });
  assert.deepEqual(result, { confirmedFacts: [], sourceCandidates: [], rejectedClaims: ['service.projectmanagement'] });
});

test('an entrepreneur can provide a new verified fact that has no old website observation', () => {
  const result = projectDiscoveryClaims({ dossierId, observations: [], events: [event(1, 'confirmation', 'Elektrische installaties', 'business.specialism')] });
  assert.deepEqual(result.confirmedFacts.map(({ claimKey, value }) => ({ claimKey, value })), [{ claimKey: 'business.specialism', value: 'Elektrische installaties' }]);
});

test('cross-dossier correction, duplicated observation and unsorted events fail without partial output', () => {
  for (const input of [
    { dossierId, observations: [oldSite], events: [event(1, 'correction', 'Fake', 'service.projectmanagement'), { ...event(2, 'confirmation', 'Fake'), dossierId: '22222222-2222-4222-8222-222222222222' }] },
    { dossierId, observations: [oldSite, oldSite], events: [] },
    { dossierId, observations: [oldSite], events: [event(2, 'rejection', ''), event(1, 'confirmation', 'Fake')] },
    { dossierId, observations: [{...oldSite, claimKey: '../escape'}], events: [] },
  ]) assert.throws(() => projectDiscoveryClaims(input), /DISCOVERY_(JOURNAL|PROJECTION)_INVALID/);
});

test('source-only values never become confirmed simply because an account exists or documents are numerous', () => {
  const observations = Array.from({ length: 15 }, (_, i) => ({ claimKey: `source.item${i}`, observation: { value: 'Unverified', sourceId: `site-${i}`, evidence: `page ${i}`, observedAt: '2026-09-18T00:00:00Z' } }));
  const result = projectDiscoveryClaims({ dossierId, observations, events: [] });
  assert.equal(result.confirmedFacts.length, 0);
  assert.equal(result.sourceCandidates.length, 15);
});
