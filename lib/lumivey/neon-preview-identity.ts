import 'server-only';

/**
 * Private diagnostic building block. This module is NOT an API route and must
 * never return connection strings, hostnames, usernames or other DB metadata
 * to a browser or an unauthenticated caller.
 *
 * expectedHostname MUST be independently obtained for the explicitly chosen
 * Neon `lumivey-preview` branch. A project ID, Preview env scope, table name,
 * or hostname extracted from the same DATABASE_URL is NOT independent proof.
 */
export type NeonPreviewCheckCode =
  | 'PASS_PRELIMINARY'
  | 'BLOCKED_NOT_PREVIEW'
  | 'BLOCKED_MISSING_CONFIG'
  | 'BLOCKED_BAD_CONNECTION_URL'
  | 'BLOCKED_ENDPOINT_MISMATCH'
  | 'BLOCKED_DB_QUERY_FAILED'
  | 'BLOCKED_LEDGER_MISSING'
  | 'BLOCKED_RLS_NOT_ENFORCED';

export interface ReadOnlyQuery {
  <T extends Record<string, unknown>>(sql: string): Promise<readonly T[]>;
}

export type NeonPreviewCheckInput = {
  deploymentEnvironment: string | undefined;
  connectionUrl: string | undefined;
  expectedHostname: string | undefined;
  query: ReadOnlyQuery;
};

/** Preliminary identity/readiness only, never owner authorization or write capability. */
export async function verifyNeonPreviewReadOnly(input: NeonPreviewCheckInput): Promise<NeonPreviewCheckCode> {
  if (input.deploymentEnvironment !== 'preview') return 'BLOCKED_NOT_PREVIEW';
  if (!input.connectionUrl || !input.expectedHostname?.trim()) return 'BLOCKED_MISSING_CONFIG';

  let actualHostname: string;
  try {
    const parsed = new URL(input.connectionUrl);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname) {
      return 'BLOCKED_BAD_CONNECTION_URL';
    }
    actualHostname = parsed.hostname.toLowerCase();
  } catch {
    return 'BLOCKED_BAD_CONNECTION_URL';
  }

  const expectedHostname = input.expectedHostname.trim().toLowerCase();
  // The expected value must be a hostname, not a second potentially leaked URL.
  if (!/^[a-z0-9.-]+$/.test(expectedHostname) || !expectedHostname.includes('.')) {
    return 'BLOCKED_MISSING_CONFIG';
  }
  if (actualHostname !== expectedHostname) return 'BLOCKED_ENDPOINT_MISMATCH';

  try {
    const result = await input.query<{
      ledger_exists: boolean;
      rls_enabled: boolean | null;
      rls_forced: boolean | null;
    }>(`SELECT
  to_regclass('public.lumivey_v0_build_jobs') IS NOT NULL AS ledger_exists,
  (SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public.lumivey_v0_build_jobs')) AS rls_enabled,
  (SELECT relforcerowsecurity FROM pg_class WHERE oid = to_regclass('public.lumivey_v0_build_jobs')) AS rls_forced`);
    if (result.length !== 1 || result[0].ledger_exists !== true) return 'BLOCKED_LEDGER_MISSING';
    if (result[0].rls_enabled !== true || result[0].rls_forced !== true) return 'BLOCKED_RLS_NOT_ENFORCED';
    return 'PASS_PRELIMINARY';
  } catch {
    // Never expose raw driver errors; they may contain user/host/connection data.
    return 'BLOCKED_DB_QUERY_FAILED';
  }
}
