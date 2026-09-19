#!/usr/bin/env node
/* INTERNAL / CORE — operator-only, read-only connection identity smoke.
 * Not A/B dossier isolation, not a route, and not executable from CI with secrets.
 * The hostname below was independently read from Neon Preview compute metadata;
 * reverify that branch/host association in Neon before every operator run.
 * Authentication is supplied solely via an operator-managed PGPASSFILE outside repo.
 * Native Windows ACLs cannot be verified by the POSIX mode check: use Linux/WSL.
 */
import { spawn } from 'node:child_process';
import { stat, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep } from 'node:path';

const PREVIEW_HOST = 'ep-gentle-recipe-b29ex0vh.c-6.eu-central-1.aws.neon.tech';
const PREVIEW_BRANCH = 'br-green-lake-b2xh1tni';
const ROLE = 'lumivey_discovery_app_preview';
const DATABASE = 'neondb';
const SQL = `SELECT current_user, session_user, current_database(), pg_backend_pid(),
  COALESCE((SELECT ssl FROM pg_catalog.pg_stat_ssl WHERE pid=pg_backend_pid()),false)
  FROM pg_catalog.pg_sleep(3)`;
const OUT_LIMIT = 2048;

function refuse(code) {
  console.error(code); // Never print connection errors, SQL parameters or secrets.
  process.exitCode = 2;
}

async function checkPassfile(path) {
  // fs.stat().mode is not a native Windows ACL audit. Never silently accept it.
  if (process.platform === 'win32' || !path || !isAbsolute(path)) return false;
  const file = await realpath(path).catch(() => null);
  if (!file) return false;
  const rel = relative(resolve('.'), file);
  if (rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))) return false;
  const info = await stat(file).catch(() => null);
  return !!info?.isFile() && info.size > 0 && (info.mode & 0o077) === 0;
}

function oneConnection(env) {
  return new Promise(resolveResult => {
    const args = ['-X', '-w', '-A', '-t', '-F', '\t', '-v', 'ON_ERROR_STOP=1',
      '-h', PREVIEW_HOST, '-p', '5432', '-U', ROLE, '-d', DATABASE, '-c', SQL];
    const child = spawn('psql', args, { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let output = '';
    let rejected = false;
    const timer = setTimeout(() => { rejected = true; child.kill(); }, 18000);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', part => {
      if (output.length + part.length > OUT_LIMIT) {
        rejected = true;
        child.kill();
      } else output += part;
    });
    // Deliberately suppress psql stderr: could contain connection metadata.
    child.stderr.resume();
    child.on('error', () => rejected = true);
    child.on('close', code => {
      clearTimeout(timer);
      if (rejected || code !== 0) return resolveResult(null);
      const lines = output.trim().split(/\r?\n/);
      if (lines.length !== 1) return resolveResult(null);
      const fields = lines[0].split('\t');
      if (fields.length !== 5 || fields[0] !== ROLE || fields[1] !== ROLE ||
          fields[2] !== DATABASE || !/^[1-9]\d*$/.test(fields[3]) || fields[4] !== 't')
        return resolveResult(null);
      resolveResult(fields[3]);
    });
  });
}

async function main() {
  // No DATABASE_URL/owner credentials, no password in argv, and no inherited
  // PGHOSTADDR/PGSERVICE/PGOPTIONS that could redirect the test or SET ROLE.
  if (process.env.PGPASSWORD || process.env.DATABASE_URL ||
      !await checkPassfile(process.env.LUMIVEY_PGPASSFILE))
    return refuse('BLOCKED_MISSING_SAFE_CREDENTIAL_HANDOFF');
  if (process.env.LUMIVEY_CONFIRMED_PREVIEW_BRANCH !== PREVIEW_BRANCH ||
      process.env.LUMIVEY_CONFIRMED_PREVIEW_HOST !== PREVIEW_HOST)
    return refuse('BLOCKED_PREVIEW_IDENTITY_UNCONFIRMED');
  const env = {
    PATH: process.env.PATH || '',
    HOME: process.env.HOME || '',
    SystemRoot: process.env.SystemRoot || '',
    WINDIR: process.env.WINDIR || '',
    PGPASSFILE: process.env.LUMIVEY_PGPASSFILE,
    PGSSLMODE: 'verify-full',
    PGCONNECT_TIMEOUT: '8',
    PGAPPNAME: 'lumivey-preview-session-smoke',
  };
  if (process.env.LUMIVEY_PGSSLROOTCERT) env.PGSSLROOTCERT = process.env.LUMIVEY_PGSSLROOTCERT;
  const [a, b] = await Promise.all([oneConnection(env), oneConnection(env)]);
  if (!a || !b || a === b) return refuse('BLOCKED_INDEPENDENT_SESSIONS_NOT_PROVEN');
  console.log('PASS_TWO_INDEPENDENT_PREVIEW_SESSIONS_ONLY');
  console.log('NOT_A_B_DOSSIER_ISOLATION_PROOF');
}

main().catch(() => refuse('BLOCKED_SMOKE_UNEXPECTED_FAILURE'));
