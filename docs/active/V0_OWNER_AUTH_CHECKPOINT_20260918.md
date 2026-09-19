# v0 one-shot — owner authorization checkpoint (2026-09-18)

Scope: Draft PR #49 only. Production and the seven paid v0 routes remain unchanged/closed.

## Implemented in code, unit tested

`lib/lumivey/v0-build-authorization.ts` is a pure fail-closed boundary. Its trusted server dependencies must authenticate a session/operator and independently retrieve an immutable durable approved Preview record. It derives `ownerId` from the authenticated actor, never request JSON. It blocks anonymous/unauthorized actors, cross-owner previews, missing/revoked approvals, mismatched brief/assets hashes, malformed input and lookup errors. `tests/v0-build-authorization.test.mjs` exercises these cases; the v0 build safety CI workflow includes the test.

**This contract is NOT connected to a real session provider, approval database, build route or real Neon connection. Unit-test fixtures do not prove tenant isolation or genuine identity verification.** A client-supplied ID/hash is never proof of approval. The current `app/api/build/v0/route.ts` remains HTTP 503.

## Verified Neon status

The Vercel-created PR #49 Preview branch has the job ledger with FORCE RLS. The `lumivey_v0_worker_limited` NOLOGIN role has no BYPASSRLS/admin privileges but also no table grants, policies, password or login. The `neondb_owner` role bypasses RLS. The experimental overprivileged Neon API role was deleted. Do not expose the owner connection to browser users or treat the existing database as isolated per tenant.

## Next gates, in order

1. Identify and implement a real server session/operator provider and durable approval persistence; owner must be derived from independently verified membership, and hashes from immutable stored approval. Reject any client-controlled tenant context. Avoid public diagnostics.
2. Design least-privilege DB login and narrowly scoped SQL permissions/RLS with audited transaction-local owner context. Custom PostgreSQL GUC is not authentication and can be forged by anyone with arbitrary SQL access; disallow direct browser SQL and test pooled connection context reset. Provision/test on verified Preview only. Do not deploy privileged `neondb_owner` as application role.
3. Run real separate-session tenant A/B reads/writes and anonymous-denial tests with the actual limited DB role, plus two independently connected concurrent reservation/claim requests. Roll back synthetic data. No paid upstream calls.
4. Verify actual Vercel Preview branch/hostname and effective role server-side without logging credentials; wire a single authenticated route only after all checks pass and upstream uncertainty handling is proven. Never bypass the seven-route shutdown or merge PR #49 prematurely.

No production changes, v0 charges or customer data operations made in this checkpoint.
