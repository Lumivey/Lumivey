import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route = readFileSync(new URL('../app/api/regression/adrie/build-v0/route.ts', import.meta.url), 'utf8');

test('Adrie paid-build route stays fail-closed while backend authorization and durable ledger are absent', () => {
  assert.match(route, /export async function POST\(/);
  assert.match(route, /V0_BUILD_SAFETY_GATE_CLOSED/);
  assert.match(route, /status:\s*503/);
  assert.match(route, /Cache-Control["']?:\s*["']no-store/);
  assert.doesNotMatch(route, /createV0Build\s*\(/, 'Do not make the paid upstream call from this route');
  assert.doesNotMatch(route, /process\.env\.|request\.headers|get\s*\(\s*['"]authorization/, 'Do not add an ad-hoc env or bearer bypass');
});
