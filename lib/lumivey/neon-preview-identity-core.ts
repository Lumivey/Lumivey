/**
 * Pure diagnostic: caller must be server-side and supply an independently
 * verified endpoint hostname for the intended Neon Preview branch.
 * No API route, DB driver or runtime environment read is implemented here.
 */
export type NeonPreviewCheckCode =
  | 'PASS_PRELIMINARY'
  | 'BLOCKED_NOT_PREVIEW'
  | 'BLOCKED_MISSING_CONFIG'
  | 'BLOCKED_BAD_CONNECTION_URL'
  | 'BLOCKED_ENDPOINT_MISMATCH'
  | 'BLOCKED_DB_QUERY_FAILED'
  | 'BLOCKED_LEDGER_MISSING'
  | 'BLOCKED_RLS_NOT_ENFORCED'
  | 'BLOCKED_PRIVILEGED_DB_ROLE'
  | 'BLOCKED_NO_RLS_POLICY';

export interface ReadOnlyQuery {
  <T extends Record<string, unknown>>(sql: string): Promise<readonly T[]>;
}

export type NeonPreviewCheckInput = {
  deploymentEnvironment: string | undefined;
  connectionUrl: string | undefined;
  expectedHostname: string | undefined;
  query: ReadOnlyQuery;
};

/** Preliminary identity/readiness ONLY: not proof of owner auth, policy correctness or write access. */
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
  if (!/^[a-z0-9.-]+$/.test(expectedHostname) || !expectedHostname.includes('.')) {
    return 'BLOCKED_MISSING_CONFIG';
  }
  if (actualHostname !== expectedHostname) return 'BLOCKED_ENDPOINT_MISMATCH';

  try {
    const result = await input.query<{
      ledger_exists: boolean;
      rls_enabled: boolean | null;
      rls_forced: boolean | null;
      db_role_bypasses_rls: boolean | null;
      db_role_is_superuser: boolean | null;
      policy_count: number;
    }>(`SELECT
  to_regclass('public.lumivey_v0_build_jobs') IS NOT NULL AS ledger_exists,
  (SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public.lumivey_v0_build_jobs')) AS rls_enabled,
  (SELECT relforcerowsecurity FROM pg_class WHERE oid = to_regclass('public.lumivey_v0_build_jobs')) AS rls_forced,
  (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS db_role_bypasses_rls,
  (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS db_role_is_superuser,
  (SELECT count(*)::integer FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lumivey_v0_build_jobs') AS policy_count`);
    if (result.length !== 1 || result[0].ledger_exists !== true) return 'BLOCKED_LEDGER_MISSING';
    if (result[0].rls_enabled !== true || result[0].rls_forced !== true) return 'BLOCKED_RLS_NOT_ENFORCED';
    // FORCE ROW LEVEL SECURITY does NOT constrain superusers or BYPASSRLS roles.
    if (result[0].db_role_bypasses_rls !== false || result[0].db_role_is_superuser !== false) {
      return 'BLOCKED_PRIVILEGED_DB_ROLE';
    }
    // A policy count alone does NOT prove that the policy is owner-scoped.
    if (!Number.isInteger(result[0].policy_count) || result[0].policy_count < 1) return 'BLOCKED_NO_RLS_POLICY';
    return 'PASS_PRELIMINARY';
  } catch {
    // Driver errors may include secret connection details: never return them.
    return 'BLOCKED_DB_QUERY_FAILED';
  }
}
