import test from 'node:test';
import assert from 'node:assert/strict';
import { makeV0BuildIdentity } from '../lib/lumivey/v0-build-identity.ts';

const brief = () => ({
  version: 1,
  artistImpression: { id: 'preview-1', headline: 'Eigen richting' },
  previewSignature: { previewId: 'preview-1', motifs: ['focus'] },
  assets: [{ name: 'real.jpg', url: 'https://assets.example/one.jpg' }],
  pages: [{ name: 'Home' }],
});

test('same approved revision hashes identically despite JSON key order', () => {
  const original = brief();
  const reordered = { pages: original.pages, assets: [{ url: 'https://assets.example/one.jpg', name: 'real.jpg' }], previewSignature: { motifs: ['focus'], previewId: 'preview-1' }, artistImpression: { headline: 'Eigen richting', id: 'preview-1' }, version: 1 };
  assert.deepEqual(makeV0BuildIdentity(original), makeV0BuildIdentity(reordered));
});

test('changing brief and changing assets produce separate revisions', () => {
  const original = makeV0BuildIdentity(brief());
  const text = makeV0BuildIdentity({ ...brief(), pages: [{ name: 'Home' }, { name: 'Contact' }] });
  const image = makeV0BuildIdentity({ ...brief(), assets: [{ name: 'real.jpg', url: 'https://assets.example/two.jpg' }] });
  assert.notEqual(original.briefSha256, text.briefSha256);
  assert.equal(original.assetsSha256, text.assetsSha256);
  assert.notEqual(original.assetsSha256, image.assetsSha256);
  assert.equal(original.briefSha256, image.briefSha256);
});

test('missing or mismatched signature cannot yield an identity', () => {
  assert.throws(() => makeV0BuildIdentity({ ...brief(), previewSignature: null }), /PreviewSignature/);
  assert.throws(() => makeV0BuildIdentity({ ...brief(), previewSignature: { previewId: 'different' } }), /PreviewSignature/);
});

test('non JSON data and circular references are rejected', () => {
  assert.throws(() => makeV0BuildIdentity({ ...brief(), weird: Infinity }), /Non-finite/);
  const circular = {}; circular.self = circular;
  assert.throws(() => makeV0BuildIdentity({ ...brief(), circular }), /Circular/);
});
