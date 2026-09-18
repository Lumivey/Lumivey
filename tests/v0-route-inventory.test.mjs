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
 * Detect known direct and adapter-based mutation paths. v0 GET status/screenshot
 * requests remain read-only and are not mistaken for paid generation.
 */
function directV0Mutation(source) {
  if (/\b(?:createV0Build|correctV0Build|submitV0Once)\b|\bv0Fetch\s*\(/.test(source)) return true;
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/\bfetch\s*\(\s*[`"']https:\/\/api\.v0\.dev\/v[12]\//.test(lines[i])) continue;
    const call = lines.slice(i, i + 15).join('\n');
    const end = call.search(/\}\s*\);/);
    const options = end >= 0 ? call.slice(0, end) : call;
    if (/\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i.test(options)) return true;
  }
  return false;
}

test('no API route can bypass temporary v0 mutation shutdown, including adapter helpers', () => {
  const inspected = routes(apiRoot.pathname);
  assert.ok(inspected.length > 0, 'API-route scan unexpectedly empty');
  const violations = inspected
    .filter((filename) => directV0Mutation(readFileSync(filename, 'utf8')))
    .map((filename) => relative(apiRoot.pathname, filename));
  assert.deepEqual(violations, [], `v0 mutation path found outside approved gate: ${violations.join(', ')}`);
});
