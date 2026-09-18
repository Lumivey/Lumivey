import test from 'node:test';
import assert from 'node:assert/strict';
import { checkGuestDossierDbPreflight } from '../lib/lumivey/guest-dossier-db-preflight.ts';

const host = 'ep-example.c-6.eu-central-1.aws.neon.tech';
const url = `postgresql://limited:placeholder@${host}/neondb?sslmode=verify-full`;
const tables = ['lumivey_discovery_correction_events', 'lumivey_guest_discovery_assets', 'lumivey_guest_discovery_dossiers'];
const ready = () => tables.map(table_name => ({ table_name, table_exists:true, rls_enabled:true, rls_forced:true, policy_count:1, can_select:true, can_insert:true, db_role_bypasses_rls:false, db_role_is_superuser:false, db_role_can_login:true }));
const config = extra => ({ deployment:'preview', connectionUrl:url, expectedHostname:host, query:async () => ready(), ...extra });

test('only guarded nonprivileged Preview database receives preliminary result, never isolation PASS', async () => {
  assert.equal(await checkGuestDossierDbPreflight(config()), 'PASS_PRELIMINARY');
});
test('wrong deployment, hostname, database and config refuse before querying', async () => {
  let calls=0;
  const query=async () => { calls++; return ready(); };
  for (const [extra, expected] of [
    [{deployment:'production'}, 'BLOCKED_NOT_PREVIEW'],
    [{expectedHostname:undefined}, 'BLOCKED_CONFIGURATION'],
    [{connectionUrl:'not-a-url'}, 'BLOCKED_ENDPOINT'],
    [{connectionUrl:url.replace('/neondb','/otherdb')}, 'BLOCKED_ENDPOINT'],
    [{expectedHostname:'another.example.neon.tech'}, 'BLOCKED_ENDPOINT'],
  ]) assert.equal(await checkGuestDossierDbPreflight(config({...extra,query})), expected);
  assert.equal(calls,0);
});
test('missing, duplicate and cross-schema-mismatched table audit fails closed', async () => {
  for (const rows of [[], ready().slice(0,2), [ready()[0],ready()[0],ready()[2]], ready().map((row,index) => index ? row : {...row,table_name:'another_table'})]) {
    assert.equal(await checkGuestDossierDbPreflight(config({query:async () => rows})), 'BLOCKED_SCHEMA');
  }
});
test('RLS and database role independently block unsafe access', async () => {
  for (const [field, value, code] of [
    ['rls_forced',false,'BLOCKED_RLS'], ['rls_enabled',null,'BLOCKED_RLS'],
    ['db_role_bypasses_rls',true,'BLOCKED_PRIVILEGED_ROLE'],
    ['db_role_is_superuser',true,'BLOCKED_PRIVILEGED_ROLE'],
    ['db_role_can_login',false,'BLOCKED_ROLE_CANNOT_LOGIN'],
    ['policy_count',0,'BLOCKED_NO_POLICIES'],
    ['can_select',false,'BLOCKED_NO_PRIVILEGES'], ['can_insert',null,'BLOCKED_NO_PRIVILEGES'],
  ]) {
    const rows=ready(); rows[0][field]=value;
    assert.equal(await checkGuestDossierDbPreflight(config({query:async () => rows})), code, field);
  }
});
test('masked query failure, a single read-only statement and no leaked credentials', async () => {
  const failure=await checkGuestDossierDbPreflight(config({query:async () => {throw new Error('private password');}}));
  assert.equal(failure,'BLOCKED_QUERY_FAILED');
  assert.ok(!failure.includes('password'));
  let count=0;
  await checkGuestDossierDbPreflight(config({query:async (sql) => { count++; assert.match(sql,/^SELECT\b/); assert.doesNotMatch(sql,/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|GRANT)\b/i); return ready();}}));
  assert.equal(count,1);
});
