import { createHash } from 'node:crypto';

/** Stable hashing inputs only. NOT an authorization check or a duplicate-build lock. */
export type V0BuildIdentity = Readonly<{
  approvedPreviewId: string;
  briefSha256: string;
  assetsSha256: string;
}>;

function stableJson(value: unknown, seen: Set<object> = new Set()): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite number in build input');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error('Circular build input');
    seen.add(value);
    const result = `[${value.map((entry) => entry === undefined ? 'null' : stableJson(entry, seen)).join(',')}]`;
    seen.delete(value);
    return result;
  }
  if (value && typeof value === 'object') {
    if (seen.has(value)) throw new Error('Circular build input');
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      throw new Error('Build input must be plain JSON data');
    }
    seen.add(value);
    const object = value as Record<string, unknown>;
    const result = `{${Object.keys(object).filter((key) => object[key] !== undefined).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(object[key], seen)}`).join(',')}}`;
    seen.delete(value);
    return result;
  }
  throw new Error('Unsupported value in build input');
}

function sha256(value: unknown): string {
  return createHash('sha256').update(stableJson(value), 'utf8').digest('hex');
}

/** Call only after server-side owner authorization and durable Preview approval verification.
 * Hashes identify a FINAL revision; never hash an unapproved, mutable client-supplied brief
 * and treat its digest as proof of approval. The owner is deliberately NOT accepted here. */
export function makeV0BuildIdentity(brief: {
  artistImpression: { id: string };
  previewSignature?: { previewId: string } | null;
  assets: readonly unknown[];
  [key: string]: unknown;
}): V0BuildIdentity {
  const approvedPreviewId = brief.artistImpression?.id;
  if (typeof approvedPreviewId !== 'string' || !approvedPreviewId.trim()) {
    throw new Error('Approved Preview ID ontbreekt');
  }
  if (!brief.previewSignature || brief.previewSignature.previewId !== approvedPreviewId) {
    throw new Error('PreviewSignature hoort niet bij de goedgekeurde Preview');
  }
  if (!Array.isArray(brief.assets)) throw new Error('Definitieve assets ontbreken');
  const { assets, ...briefWithoutAssets } = brief;
  return {
    approvedPreviewId,
    briefSha256: sha256(briefWithoutAssets),
    assetsSha256: sha256(assets),
  };
}
