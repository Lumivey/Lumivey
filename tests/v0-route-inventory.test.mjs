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

/**
 * Source-level tripwire, not a security proof or a substitute for runtime auth.
 * v0 GET status/screenshot endpoints are not paid generation and must not be
 * mistaken for direct mutation. Inspect literal v0 fetch call options separately;
 * the actual mutation endpoints and adapters are forbidden while the gate is shut.
 */
function directV0Mutation(source) {
  if (/\bcreateV0Build\b|\bsubmitV0Once\b|\bv0Fetch\s*\(/.test(source)) return true;
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/\bfetch\s*\(\s*[`"']https:\/\/api\.v0\.dev\/v[12]\//.test(lines[i])) continue;
    const call = lines.slice(i, i + 15).join('\n');
    // Stop at the closing fetch options: a later Firecrawl POST is unrelated.
    const end = call.search(/\}\s*\);/);
    const options = end >= 0 ? call.slice(0, end) : call;
    if (/\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i.test(options)) return true;
  }
  return false;
}

test('no API route can bypass the temporary v0 mutation shutdown', () => {
  const inspected = routes(apiRoot.pathname);
  assert.ok(inspected.length > 0, 'API-route scan unexpectedly empty');
  const violations = inspected
    .filter((filename) => directV0Mutation(readFileSync(filename, 'utf8')))
    .map((filename) => relative(apiRoot.pathname, filename));
  assert.deepEqual(violations, [], `Direct v0 mutation path found: ${violations.join(', ')}`);
});
