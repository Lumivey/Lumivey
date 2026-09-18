import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const routes = [
  '../app/api/build/v0/route.ts',
  '../app/api/regression/adrie/build-v0/route.ts',
];

for (const relativePath of routes) {
  test(`${relativePath} remains fail-closed until auth and durable ledger are integrated`, () => {
    const route = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
    assert.match(route, /export async function POST\(/);
    assert.match(route, /V0_BUILD_SAFETY_GATE_CLOSED/);
    assert.match(route, /status:\s*503/);
    assert.match(route, /Cache-Control["']?:\s*["']no-store/);
    // Ensure this handler cannot issue a paid build through the existing adapter.
    assert.doesNotMatch(route, /import\s*\{[^}]*createV0Build/);
    assert.doesNotMatch(route, /createV0Build\s*\(/);
    assert.doesNotMatch(route, /process\.env\.|request\.headers|get\s*\(\s*['"]authorization/, 'No ad-hoc flag or bearer bypass');
  });
}
