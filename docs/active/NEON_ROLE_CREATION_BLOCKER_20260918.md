# Neon Preview role creation — API blocker resolved through SQL for a NOLOGIN role

Date: 2026-09-18. Scope: Neon project `LUMIVEY_DB`, Vercel-generated PR #49 branch `preview/test/v0-api-visibility-20260917` (`br-green-lake-b2xh1tni`) ONLY. No production/main changes. No paid v0 requests.

## Initial API experiment, rejected and cleaned up

- Connector action `create_postgres_role` for `lumivey_v0_worker_preview` with `no_login=true` returned `authentication_method: no_login`, but direct `pg_roles` inspection showed `rolcanlogin=true`, `rolbypassrls=true`, `rolcreaterole=true`, `rolcreatedb=true`, and membership in `neon_superuser`.
- Attempted `ALTER ROLE` and membership revocation failed; Neon branch-specific deletion then succeeded and was verified. That role was never used or deployed. **Do not use the Neon create_postgres_role API as evidence of least privilege.**

## New direct-SQL experiment: verified role, no application access yet

- Connected explicitly to `br-green-lake-b2xh1tni` / `neondb`, and ran `CREATE ROLE lumivey_v0_worker_limited NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS` via SQL.
- Queried `pg_roles` and `pg_has_role` afterward: role exists; `rolcanlogin=false`, `rolsuper=false`, `rolcreatedb=false`, `rolcreaterole=false`, `rolinherit=false`, `rolbypassrls=false`, `neon_superuser` membership=false.
- Independently checked privileges: schema `public` USAGE=true (default); build ledger SELECT=false, INSERT=false, UPDATE=false; RLS policy count=0.
- This role has NOLOGIN, no password, no ledger grants and no policies; it is **not a working Vercel credential**. Do not add it as DATABASE_URL, change Vercel variables or claim tenant isolation yet.

## Security decision and next steps

- Keep seven paid v0 routes disabled; PR #49 remains draft/unmerged. `main` database and production unchanged.
- Before making a LOGIN account or issuing credentials: define verified server authentication, immutable owner binding, narrow grants and explicit RLS. A session setting like `app.owner_id` is caller-settable and cannot authenticate a tenant on its own. Design transaction-scoped context for pooled connections, and never let browser/anonymous users connect with shared DB credentials or submit arbitrary SQL.
- Review and test strict no-owner denial, tenant A/B isolation, privilege grants and denial of DDL. Verify role and RLS using *actual application DB connection*, not only the Neon admin console; inspect actual Vercel Preview endpoint without printing secrets.
- Only then implement durable ledger reserve/claim in the one authenticated build route and run two-session concurrency tests. Claim must be committed before upstream POST; ambiguous v0 response stays uncertain and is never automatically retried.
- The Preview ledger has FORCE RLS, but currently no policies. The existing `neondb_owner` connection has BYPASSRLS; its existence must not be misreported as tenant isolation.

Current checkpoint: a demonstrably nonprivileged NOLOGIN role exists on the correct Neon Preview branch. **Production readiness and v0 idempotency are still blocked.**