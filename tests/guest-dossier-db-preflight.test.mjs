import test from 'node:test';
import assert from 'node:assert/strict';
import { checkGuestDossierDbPreflight } from '../lib/lumivey/guest-dossier-db-preflight.ts';

const host = 'ep-example.c-6.eu-central-1.aws.neon.tech';
const url = `postgresql://lumivey_discovery_app_preview:placeholder@${host}/neondb?sslmode=verify-full`;
const tables = ['lumivey_discovery_correction_events', 'lumivey_guest_discovery_assets', 'lumivey_guest_discovery_dossiers'];
const ready = () => tables.map(table_name => ({
  table_name, table_exists:true, rls_enabled:true, rls_forced:true,
  can_select:false, can_insert:false, can_update:false, can_delete:false,
  can_references:false, can_truncate:false, can_trigger:false,
  db_role_bypasses_rls:false, db_role_is_superuser:false, db_role_can_login:true,
  session_is_app_role:true, database_is_preview:true,
  api_schema_usage:true, api_schema_create:false, resume_function_exists:true,
  correction_function_exists:true, resume_execute:true, correction_execute:true,
  resume_public_execute:false, correction_public_execute:false,
  resume_owner:'lumivey_discovery_function_owner', correction_owner:'lumivey_discovery_function_owner',
  resume_definer:true, correction_definer:true,
  resume_search_path:['search_path=pg_catalog, pg_temp'],
  correction_search_path:['search_path=pg_catalog, pg_temp'],
}));
const config = extra => ({ deployment:'preview', connectionUrl:url, expectedHostname:host, query:async () => ready(), ...extra });

test('only execute-only nonprivileged Preview configuration receives preliminary result', async () => {
  assert.equal(await checkGuestDossierDbPreflight(config()), 'PASS_PRELIMINARY');
});
test('wrong deployment, hostname, database, role, TLS and config refuse before querying', async () => {
  let calls=0;
  const query=async () => { calls++; return ready(); };
  for (const [extra, expected] of [
    [{deployment:'production'}, 'BLOCKED_NOT_PREVIEW'],
    [{expectedHostname:undefined}, 'BLOCKED_CONFIGURATION'],
    [{connectionUrl:'not-a-url'}, 'BLOCKED_ENDPOINT'],
    [{connectionUrl:url.replace('/neondb','/otherdb')}, 'BLOCKED_ENDPOINT'],
    [{connectionUrl:url.replace('lumivey_discovery_app_preview','neondb_owner')}, 'BLOCKED_ENDPOINT'],
    [{connectionUrl:url.replace('verify-full','require')}, 'BLOCKED_ENDPOINT'],
    [{expectedHostname:'another.example.neon.tech'}, 'BLOCKED_ENDPOINT'],
  ]) assert.equal(await checkGuestDossierDbPreflight(config({...extra,query})), expected);
  assert.equal(calls,0);
});
test('missing, duplicate and mismatched table audit fails closed', async () => {
  for (const rows of [[], ready().slice(0,2), [ready()[0],ready()[0],ready()[2]], ready().map((row,index) => index ? row : {...row,table_name:'another_table'})])
    assert.equal(await checkGuestDossierDbPreflight(config({query:async () => rows})), 'BLOCKED_SCHEMA');
});
test('RLS, switched sessions, missing routines and all direct table or column privileges independently block', async () => {
  for (const [field, value, code] of [
    ['rls_forced',false,'BLOCKED_RLS'], ['rls_enabled',null,'BLOCKED_RLS'],
    ['db_role_bypasses_rls',true,'BLOCKED_PRIVILEGED_ROLE'],
    ['db_role_is_superuser',true,'BLOCKED_PRIVILEGED_ROLE'],
    ['session_is_app_role',false,'BLOCKED_PRIVILEGED_ROLE'],
    ['database_is_preview',false,'BLOCKED_PRIVILEGED_ROLE'],
    ['db_role_can_login',false,'BLOCKED_ROLE_CANNOT_LOGIN'],
    ['can_select',true,'BLOCKED_DIRECT_TABLE_ACCESS'],
    ['can_insert',true,'BLOCKED_DIRECT_TABLE_ACCESS'],
    ['can_update',true,'BLOCKED_DIRECT_TABLE_ACCESS'],
    ['can_delete',true,'BLOCKED_DIRECT_TABLE_ACCESS'],
    ['can_references',true,'BLOCKED_DIRECT_TABLE_ACCESS'],
    ['can_truncate',true,'BLOCKED_DIRECT_TABLE_ACCESS'],
    ['can_trigger',true,'BLOCKED_DIRECT_TABLE_ACCESS'],
    ['can_select',null,'BLOCKED_DIRECT_TABLE_ACCESS'],
    ['api_schema_create',true,'BLOCKED_DIRECT_TABLE_ACCESS'],
    ['api_schema_usage',false,'BLOCKED_FUNCTIONS'],
    ['resume_function_exists',false,'BLOCKED_FUNCTIONS'],
    ['correction_function_exists',false,'BLOCKED_FUNCTIONS'],
    ['resume_execute',false,'BLOCKED_FUNCTIONS'],
    ['correction_execute',null,'BLOCKED_FUNCTIONS'],
    ['resume_public_execute',true,'BLOCKED_UNSAFE_FUNCTIONS'],
    ['correction_public_execute',true,'BLOCKED_UNSAFE_FUNCTIONS'],
    ['resume_public_execute',null,'BLOCKED_UNSAFE_FUNCTIONS'],
    ['resume_owner','neondb_owner','BLOCKED_UNSAFE_FUNCTIONS'],
    ['correction_owner','neondb_owner','BLOCKED_UNSAFE_FUNCTIONS'],
    ['resume_definer',false,'BLOCKED_UNSAFE_FUNCTIONS'],
    ['correction_definer',false,'BLOCKED_UNSAFE_FUNCTIONS'],
    ['resume_search_path',null,'BLOCKED_UNSAFE_FUNCTIONS'],
    ['correction_search_path',['search_path=public'],'BLOCKED_UNSAFE_FUNCTIONS'],
    ['resume_search_path',['search_path=pg_catalog, pg_temp','role=neondb_owner'],'BLOCKED_UNSAFE_FUNCTIONS'],
  ]) {
    const rows=ready(); rows[0][field]=value;
    assert.equal(await checkGuestDossierDbPreflight(config({query:async () => rows})), code, field);
  }
});
test('read-only SQL explicitly audits column grants, rejects a misleading table-only check', async () => {
  let count=0;
  assert.equal(await checkGuestDossierDbPreflight(config({query:async sql => {
    count++;
    assert.match(sql,/has_any_column_privilege\(current_user,[^\n]+\s*'SELECT'\)/);
    assert.match(sql,/has_any_column_privilege\(current_user,[^\n]+\s*'INSERT'\)/);
    assert.match(sql,/has_any_column_privilege\(current_user,[^\n]+\s*'UPDATE'\)/);
    assert.match(sql,/has_any_column_privilege\(current_user,[^\n]+\s*'REFERENCES'\)/);
    assert.match(sql,/has_table_privilege\(current_user,[^\n]+\s*'TRUNCATE'\)/);
    assert.match(sql,/has_table_privilege\(current_user,[^\n]+\s*'TRIGGER'\)/);
    return ready();
  }})), 'PASS_PRELIMINARY');
  assert.equal(count,1);
});
test('masked query failure, one read-only SQL statement, no secrets or writes', async () => {
  const failure=await checkGuestDossierDbPreflight(config({query:async () => {throw new Error('private password');}}));
  assert.equal(failure,'BLOCKED_QUERY_FAILED');
  assert.ok(!failure.includes('password'));
  let count=0;
  await checkGuestDossierDbPreflight(config({query:async sql => {
    count++; assert.match(sql,/^SELECT\b/);
    assert.doesNotMatch(sql,/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|GRANT)\s+(?:ON|TABLE|INTO|public\.)/i);
    assert.match(sql,/has_function_privilege/);
    assert.match(sql,/has_any_column_privilege/);
    assert.match(sql,/session_user = current_user/);
    assert.match(sql,/aclexplode/);
    assert.match(sql,/acl\.grantee = 0/);
    return ready();
  }}));
  assert.equal(count,1);
});
