import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyNeonPreviewReadOnly } from '../lib/lumivey/neon-preview-identity-core.ts';

const source = readFileSync(new URL('../lib/lumivey/neon-preview-identity.ts', import.meta.url), 'utf8');
test('public-facing import boundary is server-only', () => {
  assert.match(source, /^import ['"]server-only['"];?/m);
});

const connectionUrl = 'postgresql://user:secret@ep-example.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const expectedHostname = 'ep-example.eu-central-1.aws.neon.tech';
const okRow = [{ ledger_exists: true, rls_enabled: true, rls_forced: true, db_role_bypasses_rls: false, db_role_is_superuser: false, policy_count: 1 }];
function input(extra = {}) {
  return { deploymentEnvironment: 'preview', connectionUrl, expectedHostname, query: async () => okRow, ...extra };
}

test('nonprivileged role, at least one policy and enforced RLS yield preliminary PASS only', async () => {
  assert.equal(await verifyNeonPreviewReadOnly(input()), 'PASS_PRELIMINARY');
});

test('production, missing settings, malformed URL and endpoint drift block before any DB query', async () => {
  let calls = 0;
  const query = async () => { calls++; return okRow; };
  assert.equal(await verifyNeonPreviewReadOnly(input({ deploymentEnvironment: 'production', query })), 'BLOCKED_NOT_PREVIEW');
  assert.equal(await verifyNeonPreviewReadOnly(input({ expectedHostname: undefined, query })), 'BLOCKED_MISSING_CONFIG');
  assert.equal(await verifyNeonPreviewReadOnly(input({ connectionUrl: 'not a URL', query })), 'BLOCKED_BAD_CONNECTION_URL');
  assert.equal(await verifyNeonPreviewReadOnly(input({ expectedHostname: 'ep-other.eu-central-1.aws.neon.tech', query })), 'BLOCKED_ENDPOINT_MISMATCH');
  assert.equal(calls, 0);
});

test('missing ledger, disabled RLS and DB errors fail closed with safe code', async () => {
  assert.equal(await verifyNeonPreviewReadOnly(input({ query: async () => [{ ledger_exists: false, rls_enabled: null, rls_forced: null }] })), 'BLOCKED_LEDGER_MISSING');
  assert.equal(await verifyNeonPreviewReadOnly(input({ query: async () => [{ ...okRow[0], rls_forced: false }] })), 'BLOCKED_RLS_NOT_ENFORCED');
  const result = await verifyNeonPreviewReadOnly(input({ query: async () => { throw new Error('user:secret@ep-example private'); } }));
  assert.equal(result, 'BLOCKED_DB_QUERY_FAILED');
  assert.ok(!result.includes('secret'));
});

test('BYPASSRLS, superuser and unknown role attributes block even with FORCE RLS', async () => {
  for (const row of [
    { ...okRow[0], db_role_bypasses_rls: true },
    { ...okRow[0], db_role_is_superuser: true },
    { ...okRow[0], db_role_bypasses_rls: null },
  ]) {
    assert.equal(await verifyNeonPreviewReadOnly(input({ query: async () => [row] })), 'BLOCKED_PRIVILEGED_DB_ROLE');
  }
});

test('zero or unverified policy count blocks; policy existence alone is not owner isolation proof', async () => {
  for (const policy_count of [0, null, '1']) {
    assert.equal(await verifyNeonPreviewReadOnly(input({ query: async () => [{ ...okRow[0], policy_count }] })), 'BLOCKED_NO_RLS_POLICY');
  }
});

test('query is strictly read-only and executed once only after endpoint match', async () => {
  const statements = [];
  assert.equal(await verifyNeonPreviewReadOnly(input({ query: async (sql) => { statements.push(sql); return okRow; } })), 'PASS_PRELIMINARY');
  assert.equal(statements.length, 1);
  assert.match(statements[0], /^SELECT\b/);
  assert.doesNotMatch(statements[0], /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP)\b/i);
});
