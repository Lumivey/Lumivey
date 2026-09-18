import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const apiRoot = new URL('../app/api/', import.meta.url);

function routes(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const pathname = join(dir, entry.name);
    if (entry.isDirectory()) return routes(pathname);
    return entry.isFile() && /^route\.[cm]?[jt]sx?$/.test(entry.name) ? [pathname] : [];
  });
}

const forbidden = [
  /\bcreateV0Build\b/,
  /\bsubmitV0Once\b/,
  /api\.v0\.dev\/v[12]/,
  /\bv0Fetch\s*\(/,
];

// While all paid build routes are intentionally disabled, NO other HTTP API route
// may quietly invoke the v0 create/correction path. When the authenticated,
// transactional endpoint is ready, replace this temporary no-mutation invariant
// with an explicit narrow allowlist plus an integration test.
test('no API route can bypass the temporary v0 mutation shutdown', () => {
  const violations = [];
  const inspected = routes(apiRoot.pathname);
  for (const filename of inspected) {
    const source = readFileSync(filename, 'utf8');
    if (forbidden.some((pattern) => pattern.test(source))) {
      violations.push(relative(apiRoot.pathname, filename));
    }
  }
  assert.ok(inspected.length > 0, 'API-route scan unexpectedly empty');
  assert.deepEqual(violations, [], `Direct v0 path found outside the approved gate: ${violations.join(', ')}`);
});
