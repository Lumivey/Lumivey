import 'server-only';

// Server-only entrypoint; the pure core is split out for unit tests without
// importing Next's server-only sentinel into Node's test runner.
export { verifyNeonPreviewReadOnly } from './neon-preview-identity-core';
export type { NeonPreviewCheckCode, NeonPreviewCheckInput, ReadOnlyQuery } from './neon-preview-identity-core';
