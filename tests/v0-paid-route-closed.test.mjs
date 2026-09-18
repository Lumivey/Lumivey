import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const paidRoutes = [
  { path: '../app/api/build/v0/route.ts', method: 'POST' },
  { path: '../app/api/regression/adrie/build-v0/route.ts', method: 'POST' },
  { path: '../app/api/regression/michael/build-clean/route.ts', method: 'POST' },
  { path: '../app/api/regression/michael/correct-latest-v0/route.ts', method: 'GET' },
  { path: '../app/api/regression/adrie/visual-reference/route.ts', method: 'POST' },
  { path: '../app/api/regression/adrie/correct-existing/route.ts', method: 'POST' },
];

for (const { path, method } of paidRoutes) {
  test(`${path} remains fail-closed until auth and durable ledger are integrated`, () => {
    const route = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(route, new RegExp(`export async function ${method}\\(`));
    assert.match(route, /V0_BUILD_SAFETY_GATE_CLOSED/);
    assert.match(route, /status:\s*503/);
    assert.match(route, /Cache-Control["']?:\s*["']no-store/);
    assert.doesNotMatch(route, /^import.*(?:createV0Build|correctV0Build|submitV0Once)/m);
    assert.doesNotMatch(route, /^import.*OpenAI/m);
    assert.doesNotMatch(route, /\bfetch\s*\(/, 'Disabled route must not send HTTP traffic');
    assert.doesNotMatch(route, /\b(?:createV0Build|correctV0Build|submitV0Once)\s*\(/);
    assert.doesNotMatch(route, /process\.env\.|request\.headers|get\s*\(\s*['"]authorization/, 'No ad-hoc flag or bearer bypass');
  });
}

test('GET correction must not expose a paid mutation or a POST alias', () => {
  const route = readFileSync(new URL(paidRoutes[3].path, import.meta.url), 'utf8');
  assert.doesNotMatch(route, /export\s+(?:async\s+)?function\s+POST\(/);
  assert.doesNotMatch(route, /\bfetch\s*\(/);
});
