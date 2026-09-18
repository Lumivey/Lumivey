# Neon Preview role creation — blocked and cleaned up

Date: 2026-09-18. Scope: Neon project `LUMIVEY_DB`, Vercel-generated PR #49 branch `preview/test/v0-api-visibility-20260917` (`br-green-lake-b2xh1tni`) ONLY. No production/main changes. No paid v0 requests.

## Experiment and verified result

- Connector action `create_postgres_role` was invoked for `lumivey_v0_worker_preview` with `no_login=true`.
- Neon returned `authentication_method: no_login`, but an independent `pg_roles` SQL read showed `rolcanlogin=true`, `rolbypassrls=true`, `rolcreaterole=true` and `rolcreatedb=true`. `pg_auth_members` also showed membership in `neon_superuser`.
- Attempt to restrict privileges via `ALTER ROLE ... NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB` and `REVOKE neon_superuser ...` failed with `permission denied to alter role`; transaction was not applied.
- The newly created experimental role was promptly deleted using the branch-specific Neon `delete_postgres_role` action. Subsequent `list_postgres_roles` returned only the preexisting `neondb_owner`, verifying cleanup. No credentials were copied, stored, deployed or used.

## Security decision

**BLOCKED:** Do not use the Neon connector's `create_postgres_role` as an audited least-privilege role provisioner, even with `no_login=true`. Do not deploy a password or Vercel variable for the experimental role. Do not treat a role's API metadata as proof of SQL permissions; verify `pg_roles` plus memberships independently. Do not weaken `FORCE ROW LEVEL SECURITY`, expose a public diagnostics route, or reactivate the seven disabled paid v0 routes.

The ledger exists on the Vercel-created Preview branch and has ENABLE/FORCE RLS with zero policies; the existing owner is BYPASSRLS. Neither owner-scoped customer access nor two-session idempotency has been proven. The preview build does not yet use the ledger.

## Next safe implementation

1. Determine a verified provisioning method for an unprivileged login/worker role, with actual SQL assertions `NOT rolbypassrls`, `NOT rolsuper`, `NOT rolcreaterole`, `NOT rolcreatedb`, no privileged memberships, and correct login state. Prefer an audited, dedicated migration path; test against Preview only.
2. Specify and review owner-scoped RLS policies, grants, server identity derivation and transaction-local tenant context. Note that user-settable custom PostgreSQL settings are not authentication by themselves: the server must verify owner identity and prevent arbitrary SQL access; pooled connection/session contamination must be tested.
3. Test tenant A/B isolation, unauthorized denial, rollback-only write smoke, and two separate concurrent connections. Commit a `reserved -> submitting` claim before any upstream POST; uncertain outcome remains blocked from retries.
4. Verify effective Vercel Preview DATABASE_URL host/role on server only. No secret values in GitHub, ChatGPT responses, logs or screenshots. Do not promote to main until authenticated end-to-end testing succeeds.

This is a safety checkpoint, **not** evidence of successful least-privilege integration.