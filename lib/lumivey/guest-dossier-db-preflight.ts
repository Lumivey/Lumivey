/* INTERNAL / CORE. Read-only operator preflight; NOT proof of authorization/isolation.
 * Preview endpoint independently verified by operator. App role has no table OR
 * column grants. A passing catalog audit never replaces real two-connection A/B tests.
 */
export type GuestDbPreflightResult = 'BLOCKED_NOT_PREVIEW' | 'BLOCKED_CONFIGURATION' |
  'BLOCKED_ENDPOINT' | 'BLOCKED_SCHEMA' | 'BLOCKED_RLS' | 'BLOCKED_PRIVILEGED_ROLE' |
  'BLOCKED_ROLE_CANNOT_LOGIN' | 'BLOCKED_DIRECT_TABLE_ACCESS' | 'BLOCKED_FUNCTIONS' |
  'BLOCKED_UNSAFE_FUNCTIONS' | 'BLOCKED_QUERY_FAILED' | 'PASS_PRELIMINARY';

type AuditRow = Readonly<{
  table_name: string; table_exists: boolean; rls_enabled: boolean | null; rls_forced: boolean | null;
  can_select: boolean | null; can_insert: boolean | null; can_update: boolean | null;
  can_delete: boolean | null; can_references: boolean | null;
  can_truncate: boolean | null; can_trigger: boolean | null;
  db_role_bypasses_rls: boolean | null;
  db_role_is_superuser: boolean | null; db_role_can_login: boolean | null;
  session_is_app_role: boolean | null; database_is_preview: boolean | null;
  api_schema_usage: boolean | null; api_schema_create: boolean | null;
  resume_function_exists: boolean; correction_function_exists: boolean;
  resume_execute: boolean | null; correction_execute: boolean | null;
  resume_public_execute: boolean | null; correction_public_execute: boolean | null;
  resume_owner: string | null; correction_owner: string | null;
  resume_definer: boolean | null; correction_definer: boolean | null;
  resume_search_path: string[] | null; correction_search_path: string[] | null;
}>;
const TABLES = ['lumivey_guest_discovery_dossiers', 'lumivey_guest_discovery_assets',
  'lumivey_discovery_correction_events'] as const;
const APP_ROLE = 'lumivey_discovery_app_preview';
const OWNER = 'lumivey_discovery_function_owner';
const PATH = 'search_path=pg_catalog, pg_temp';

export async function checkGuestDossierDbPreflight(input: {
  deployment: string | undefined; connectionUrl: string | undefined;
  expectedHostname: string | undefined; query: (sql: string) => Promise<readonly AuditRow[]>;
}): Promise<GuestDbPreflightResult> {
  if (input.deployment !== 'preview') return 'BLOCKED_NOT_PREVIEW';
  if (!input.connectionUrl || !input.expectedHostname || !/^[a-z0-9.-]+$/i.test(input.expectedHostname))
    return 'BLOCKED_CONFIGURATION';
  try {
    const url = new URL(input.connectionUrl);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
        url.hostname.toLowerCase() !== input.expectedHostname.toLowerCase() ||
        url.pathname !== '/neondb' || url.username !== APP_ROLE ||
        url.searchParams.get('sslmode') !== 'verify-full') return 'BLOCKED_ENDPOINT';
  } catch { return 'BLOCKED_ENDPOINT'; }
  try {
    const rows = await input.query(`SELECT expected.table_name,
  to_regclass('public.' || expected.table_name) IS NOT NULL AS table_exists,
  c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
  -- has_table_privilege alone misses grants on individual columns. Neon Preview
  -- demonstrated table SELECT=false while any-column SELECT=true for function owner.
  has_any_column_privilege(current_user, to_regclass('public.' || expected.table_name), 'SELECT') AS can_select,
  has_any_column_privilege(current_user, to_regclass('public.' || expected.table_name), 'INSERT') AS can_insert,
  has_any_column_privilege(current_user, to_regclass('public.' || expected.table_name), 'UPDATE') AS can_update,
  has_table_privilege(current_user, to_regclass('public.' || expected.table_name), 'DELETE') AS can_delete,
  has_any_column_privilege(current_user, to_regclass('public.' || expected.table_name), 'REFERENCES') AS can_references,
  has_table_privilege(current_user, to_regclass('public.' || expected.table_name), 'TRUNCATE') AS can_truncate,
  has_table_privilege(current_user, to_regclass('public.' || expected.table_name), 'TRIGGER') AS can_trigger,
  (SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user) AS db_role_bypasses_rls,
  (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS db_role_is_superuser,
  (SELECT rolcanlogin FROM pg_roles WHERE rolname=current_user) AS db_role_can_login,
  (session_user = current_user AND current_user = 'lumivey_discovery_app_preview') AS session_is_app_role,
  (current_database() = 'neondb') AS database_is_preview,
  has_schema_privilege(current_user, to_regnamespace('lumivey_discovery_api'), 'USAGE') AS api_schema_usage,
  has_schema_privilege(current_user, to_regnamespace('lumivey_discovery_api'), 'CREATE') AS api_schema_create,
  resume.oid IS NOT NULL AS resume_function_exists,
  correction.oid IS NOT NULL AS correction_function_exists,
  has_function_privilege(current_user, resume.oid, 'EXECUTE') AS resume_execute,
  has_function_privilege(current_user, correction.oid, 'EXECUTE') AS correction_execute,
  EXISTS (SELECT 1 FROM aclexplode(COALESCE(resume.proacl, acldefault('f',resume.proowner))) acl
          WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE') AS resume_public_execute,
  EXISTS (SELECT 1 FROM aclexplode(COALESCE(correction.proacl, acldefault('f',correction.proowner))) acl
          WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE') AS correction_public_execute,
  pg_get_userbyid(resume.proowner) AS resume_owner,
  pg_get_userbyid(correction.proowner) AS correction_owner,
  resume.prosecdef AS resume_definer, correction.prosecdef AS correction_definer,
  resume.proconfig AS resume_search_path, correction.proconfig AS correction_search_path
FROM (VALUES ('lumivey_guest_discovery_dossiers'), ('lumivey_guest_discovery_assets'),
             ('lumivey_discovery_correction_events')) AS expected(table_name)
LEFT JOIN pg_class c ON c.oid=to_regclass('public.' || expected.table_name)
LEFT JOIN pg_proc resume ON resume.oid=to_regprocedure('lumivey_discovery_api.rotate_guest_resume(uuid,text,text)')
LEFT JOIN pg_proc correction ON correction.oid=to_regprocedure('lumivey_discovery_api.record_guest_correction(uuid,text,bigint,text,text,text,text)')
ORDER BY expected.table_name`);
    if (!Array.isArray(rows) || rows.length !== TABLES.length ||
        new Set(rows.map(r => r?.table_name)).size !== TABLES.length ||
        rows.some(r => !TABLES.includes(r?.table_name as typeof TABLES[number]) || r.table_exists !== true))
      return 'BLOCKED_SCHEMA';
    if (rows.some(r => r.rls_enabled !== true || r.rls_forced !== true)) return 'BLOCKED_RLS';
    if (rows.some(r => r.session_is_app_role !== true || r.database_is_preview !== true ||
        r.db_role_bypasses_rls !== false || r.db_role_is_superuser !== false))
      return 'BLOCKED_PRIVILEGED_ROLE';
    if (rows.some(r => r.db_role_can_login !== true)) return 'BLOCKED_ROLE_CANNOT_LOGIN';
    if (rows.some(r => r.can_select !== false || r.can_insert !== false ||
        r.can_update !== false || r.can_delete !== false || r.can_references !== false ||
        r.can_truncate !== false || r.can_trigger !== false || r.api_schema_create !== false))
      return 'BLOCKED_DIRECT_TABLE_ACCESS';
    if (rows.some(r => r.api_schema_usage !== true || r.resume_function_exists !== true ||
        r.correction_function_exists !== true || r.resume_execute !== true || r.correction_execute !== true))
      return 'BLOCKED_FUNCTIONS';
    if (rows.some(r => r.resume_public_execute !== false || r.correction_public_execute !== false ||
        r.resume_owner !== OWNER || r.correction_owner !== OWNER ||
        r.resume_definer !== true || r.correction_definer !== true ||
        !Array.isArray(r.resume_search_path) || r.resume_search_path.length !== 1 ||
        r.resume_search_path[0] !== PATH ||
        !Array.isArray(r.correction_search_path) || r.correction_search_path.length !== 1 ||
        r.correction_search_path[0] !== PATH))
      return 'BLOCKED_UNSAFE_FUNCTIONS';
    // Preliminary only: no assurance of per-dossier isolation, safe bodies or cookie handoff.
    return 'PASS_PRELIMINARY';
  } catch { return 'BLOCKED_QUERY_FAILED'; }
}
