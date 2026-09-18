import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../docs/architecture/sql/', import.meta.url);
const read = (filename) => readFileSync(new URL(filename, ROOT), 'utf8');
const resume = read('007_guest_resume_function_review.sql');
const correction = read('008_guest_correction_function_review.sql');

for (const [name, content] of [['resume', resume], ['correction', correction]]) {
  test(`${name} design is entirely commented and cannot be applied as a migration`, () => {
    const executable = content.split(/\r?\n/).filter((line) => line.trim() && !line.trimStart().startsWith('--'));
    assert.deepEqual(executable, []);
    assert.match(content, /REVIEW-ONLY/);
    assert.match(content, /SECURITY DEFINER/);
    assert.match(content, /REVOKE ALL/);
    assert.match(content, /PUBLIC/);
    assert.match(content, /NOLOGIN/);
    assert.match(content, /pg_temp/);
    assert.doesNotMatch(content, /\bGRANT\s+(?:ALL|SELECT|INSERT|UPDATE|DELETE)\s+ON\s+(?:ALL\s+)?TABLES?\s+TO\s+lumivey_discovery_app_preview\b/i);
  });
}

test('resume requires scoped token, active status, expiry and atomic rotation', () => {
  assert.match(resume, /d\.id\s*=\s*p_dossier_id/);
  assert.match(resume, /d\.resume_token_digest\s*=\s*p_old_digest/);
  assert.match(resume, /d\.status\s*=\s*'active'/);
  assert.match(resume, /d\.expires_at\s*>\s*clock_timestamp\(\)/);
  assert.match(resume, /SET\s+resume_token_digest\s*=\s*p_new_digest/);
  assert.match(resume, /UPDATE\s+public\.lumivey_guest_discovery_dossiers/i);
});

test('correction proposes one atomic version increment and event insert with scoped evidence', () => {
  assert.match(correction, /d\.id\s*=\s*p_dossier_id/);
  assert.match(correction, /d\.resume_token_digest\s*=\s*p_digest/);
  assert.match(correction, /d\.status\s*=\s*'active'/);
  assert.match(correction, /d\.expires_at\s*>\s*v_now/);
  assert.match(correction, /d\.state_version\s*=\s*p_expected_version/);
  assert.match(correction, /WITH guarded AS\s*\(\s*--\s*UPDATE/s);
  assert.match(correction, /INSERT INTO public\.lumivey_discovery_correction_events/);
  assert.match(correction, /FROM guarded/);
  assert.match(correction, /'verified-guest', NULL/);
  assert.match(correction, /p_utterance/);
  assert.match(correction, /RETURNING sequence INTO v_event_sequence/);
  assert.match(correction, /roll back/i);
});
