# Neon Preview — dossier-access gate (18 september 2026)

Scope: `LUMIVEY_DB` project `odd-term-62838732`, Vercel-created Preview branch `br-green-lake-b2xh1tni`, database `neondb`, draft PR #49 only. Main, production, Vercel variables, Neon Auth config, database credentials, grants and paid v0 routes unchanged.

## Evidence from read-only inspection

- Previous checkpoint `NEON_GUEST_DISCOVERY_SCHEMA_APPLIED_20260918.md` records the three real Preview tables and FORCE RLS with **zero policies** and no app grants. It explicitly does NOT verify zero rows or actual A/B isolation.
- `Neon.list_postgres_roles` returns only `lumivey_v0_worker_limited` (no_login) and `neondb_owner` (password).
- Explicit Preview-only pg_roles query: `lumivey_v0_worker_limited` has `rolcanlogin=false`, `rolbypassrls=false`, `rolsuper=false`, `rolcreatedb=false`, `rolcreaterole=false`; `neondb_owner` has `rolcanlogin=true`, `rolbypassrls=true`, `rolcreatedb=true`, `rolcreaterole=true`. Neither is an acceptable runtime dossier connection at present: the former cannot log in or read/write, the latter bypasses isolation. Never use the owner's credentials in the app.
- Official Neon docs `docs/auth/reference/nextjs-server.md` document `@neondatabase/auth/next/server`, `createNeonAuth`, `auth.getSession()` and secure signed cookies; this is a supported candidate for optional early accounts, NOT guest token authorization or verified business ownership. The production checklist notes email verification is off by default and custom SMTP/allowed domains are needed for launch. Do not expose signup before configuration review.
- Preview branch object storage reports `enabled=true`, but NO private bucket, scoped upload authorization or byte-deletion behavior was tested. This is not proof of usable secure dossier uploads.

## Implementation in PR #49

`lib/lumivey/guest-dossier-db-preflight.ts`: read-only, dependency-injected **preliminary** guard for Preview deployment, expected branch hostname (operator-verified), `neondb` DB, presence of all three tables, FORCE RLS, nonprivileged LOGIN role, nonzero policies and minimum required privileges. Fail closed on absence/unknown value, query failure or endpoint mismatch without leaking DB errors. The role must be an actual restricted connection; never run this with owner credentials and call its result authorization. A preliminary PASS alone NEVER enables a route and cannot prove per-dossier RLS quality or A/B isolation.

`tests/guest-dossier-db-preflight.test.mjs` covers Preview-only gating, wrong host/db, missing/duplicate tables, RLS, privileged or NOLOGIN roles, absent policies/grants, error masking and read-only SQL. `v0-build-safety.yml` now runs tests. GitHub Actions run `35342512883`, job `105591441770`: completed success on commit `0bc03536` (unit mocks only, no real DB query from workflow).

## Unblocked vs blocked

Schema presence and baseline deny-by-default are verified. **Actual write/read/hervat test blocked:** there is no safe LOGIN role with reviewed per-dossier RLS policies and no verified server runtime binding. Never test A/B with `neondb_owner`, no fabricated accounts, no grants or security config based on a guessed Vercel URL. The Neon create-role API previously ignored `no_login=true` and produced a privileged role (deleted); do not repeat it.

Next security design/review: decide least-privilege server connection method, validate real Preview runtime endpoint without password exposure, review exact SELECT/INSERT policies and per-request proof of guest-token/account access, verify guest→account ownership, and deletion of correction rows plus private object bytes. This changes security/credentials and needs explicit informed authorization. Then run real independent two-connection A/B isolation, expiration, concurrent CAS and retention tests; connect `/api/chat` only afterwards. PR stays draft and seven paid v0 routes remain HTTP 503.
