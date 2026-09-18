/* INTERNAL / CORE. Read-only preflight, NOT a database adapter or proof of isolation.
 * Call only from a server-only operator path after the expected Neon Preview host
 * has been independently established. Never expose diagnostics or credentials to visitors.
 */
export type GuestDbPreflightResult =
  | 'BLOCKED_NOT_PREVIEW' | 'BLOCKED_CONFIGURATION' | 'BLOCKED_ENDPOINT'
  | 'BLOCKED_SCHEMA' | 'BLOCKED_RLS' | 'BLOCKED_PRIVILEGED_ROLE'
  | 'BLOCKED_ROLE_CANNOT_LOGIN' | 'BLOCKED_NO_POLICIES'
  | 'BLOCKED_NO_PRIVILEGES' | 'BLOCKED_QUERY_FAILED'
  | 'PASS_PRELIMINARY';

type TableAudit = Readonly<{
  table_name: string;
  table_exists: boolean;
  rls_enabled: boolean | null;
  rls_forced: boolean | null;
  policy_count: number;
  can_select: boolean | null;
  can_insert: boolean | null;
}>;
type AuditRow = TableAudit & Readonly<{
  db_role_bypasses_rls: boolean | null;
  db_role_is_superuser: boolean | null;
  db_role_can_login: boolean | null;
}>;
const TABLES = [
  'lumivey_guest_discovery_dossiers',
  'lumivey_guest_discovery_assets',
  'lumivey_discovery_correction_events',
] as const;

export async function checkGuestDossierDbPreflight(input: {
  deployment: string | undefined;
  connectionUrl: string | undefined;
  expectedHostname: string | undefined;
  query: (sql: string) => Promise<readonly AuditRow[]>;
}): Promise<GuestDbPreflightResult> {
  if (input.deployment !== 'preview') return 'BLOCKED_NOT_PREVIEW';
  if (!input.connectionUrl || !input.expectedHostname || !/^[a-z0-9.-]+$/i.test(input.expectedHostname)) {
    return 'BLOCKED_CONFIGURATION';
  }
  try {
    const url = new URL(input.connectionUrl);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
        url.hostname.toLowerCase() !== input.expectedHostname.toLowerCase() ||
        url.pathname !== '/neondb' || !url.username) return 'BLOCKED_ENDPOINT';
  } catch { return 'BLOCKED_ENDPOINT'; }
  try {
    const rows = await input.query(`SELECT expected.table_name,
  to_regclass('public.' || expected.table_name) IS NOT NULL AS table_exists,
  c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
  (SELECT count(*)::integer FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=expected.table_name) AS policy_count,
  has_table_privilege(current_user, to_regclass('public.' || expected.table_name), 'SELECT') AS can_select,
  has_table_privilege(current_user, to_regclass('public.' || expected.table_name), 'INSERT') AS can_insert,
  (SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user) AS db_role_bypasses_rls,
  (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS db_role_is_superuser,
  (SELECT rolcanlogin FROM pg_roles WHERE rolname=current_user) AS db_role_can_login
FROM (VALUES ('lumivey_guest_discovery_dossiers'), ('lumivey_guest_discovery_assets'),
             ('lumivey_discovery_correction_events')) AS expected(table_name)
LEFT JOIN pg_class c ON c.oid=to_regclass('public.' || expected.table_name)
ORDER BY expected.table_name`);
    if (!Array.isArray(rows) || rows.length !== TABLES.length ||
        new Set(rows.map(r => r?.table_name)).size !== TABLES.length ||
        rows.some(r => !TABLES.includes(r?.table_name as typeof TABLES[number]) || r.table_exists !== true)) {
      return 'BLOCKED_SCHEMA';
    }
    if (rows.some(r => r.rls_enabled !== true || r.rls_forced !== true)) return 'BLOCKED_RLS';
    if (rows.some(r => r.db_role_bypasses_rls !== false || r.db_role_is_superuser !== false)) {
      return 'BLOCKED_PRIVILEGED_ROLE';
    }
    if (rows.some(r => r.db_role_can_login !== true)) return 'BLOCKED_ROLE_CANNOT_LOGIN';
    // Existence of policies is necessary, NEVER sufficient proof of per-dossier isolation.
    if (rows.some(r => !Number.isInteger(r.policy_count) || r.policy_count < 1)) return 'BLOCKED_NO_POLICIES';
    if (rows.some(r => r.can_select !== true || r.can_insert !== true)) return 'BLOCKED_NO_PRIVILEGES';
    return 'PASS_PRELIMINARY';
  } catch { return 'BLOCKED_QUERY_FAILED'; }
}
