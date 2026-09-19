import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, chmodSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const script = new URL('../scripts/guest-preview-two-session-smoke.mjs', import.meta.url);
const run = extra => spawnSync(process.execPath, [script.pathname], {
  cwd: new URL('..', import.meta.url).pathname,
  encoding: 'utf8',
  timeout: 5000,
  env: { PATH: process.env.PATH || '', HOME: process.env.HOME || '',
         SystemRoot: process.env.SystemRoot || '', ...extra },
});

test('missing secure passfile refuses before invoking psql and never claims isolation', () => {
  const result = run({ LUMIVEY_CONFIRMED_PREVIEW_BRANCH:'br-green-lake-b2xh1tni',
    LUMIVEY_CONFIRMED_PREVIEW_HOST:'ep-gentle-recipe-b29ex0vh.c-6.eu-central-1.aws.neon.tech' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /BLOCKED_MISSING_SAFE_CREDENTIAL_HANDOFF/);
  assert.doesNotMatch(result.stdout + result.stderr, /PASS_|NOT_A_B_/);
});

test('even a private passfile cannot override absent independent branch/host confirmation', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lumivey-preview-gate-'));
  try {
    const path = join(dir, 'pgpass');
    writeFileSync(path, 'test-only-placeholder', { mode: 0o600 });
    chmodSync(path, 0o600);
    const result = run({ LUMIVEY_PGPASSFILE: path,
      LUMIVEY_CONFIRMED_PREVIEW_BRANCH: 'br-wrong',
      LUMIVEY_CONFIRMED_PREVIEW_HOST: 'other.example.invalid' });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /BLOCKED_PREVIEW_IDENTITY_UNCONFIRMED/);
    assert.doesNotMatch(result.stdout + result.stderr, /test-only-placeholder|PASS_/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('operator smoke contains only read-only identity query and does not open a dossier or use owner credentials', () => {
  const source = readFileSync(script, 'utf8');
  assert.match(source, /Promise\.all\(\[oneConnection\(env\), oneConnection\(env\)\]\)/);
  assert.match(source, /PGSSLMODE: 'verify-full'/);
  assert.match(source, /LUMIVEY_PGPASSFILE/);
  assert.match(source, /pg_catalog\.pg_stat_ssl/);
  assert.doesNotMatch(source, /\b(?:INSERT INTO|UPDATE public\.|DELETE FROM|GRANT EXECUTE|ALTER ROLE)\b/i);
  assert.doesNotMatch(source, /\bneondb_owner\b/);
});
