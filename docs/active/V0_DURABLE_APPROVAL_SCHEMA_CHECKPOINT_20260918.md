# v0 Preview approval persistence checkpoint — 2026-09-18

Scope: draft PR #49 and independently verified Neon branch `preview/test/v0-api-visibility-20260917` (`br-green-lake-b2xh1tni`), database `neondb` ONLY. No main/production SQL, credentials or paid v0 API calls.

## Source finding

`app/api/preview/route.ts` currently accepts client-supplied `understanding` and returns `createLumiveyPreview(understanding)`. It does NOT persist a verified Preview approval or authenticate the owner. Thus the pure `v0-build-authorization.ts` contract cannot yet be wired safely: test fixtures are not a real session or approval record.

## Implemented and independently verified on Preview

Migration `docs/architecture/sql/002_v0_preview_approvals.sql` was committed, then executed as one explicit transaction against branch `br-green-lake-b2xh1tni` / `neondb`. It adds a stored approved Preview identity (`preview_id`, `owner_id`, final brief/assets SHA-256, approving subject, timestamp) and a separate append-only revocation record. Preview IDs are unique and the hashes have format checks; the revocation has a foreign key to an existing approval. No automatic grant, policy, website build, approval endpoint, or sign-in service was introduced.

Read-only PostgreSQL metadata checks confirmed BOTH new tables and the existing job table have ENABLE and FORCE RLS, zero policies, and the restricted NOLOGIN role `lumivey_v0_worker_limited` has no SELECT/INSERT/UPDATE on any of the three. Counts at verification: zero approvals, zero revocations and zero jobs; role remained NOLOGIN, NOBYPASSRLS, NOSUPERUSER, NOCREATEROLE and NOCREATEDB. These assertions show safe schema installation, NOT successful tenant A/B isolation; privileged `neondb_owner` still bypasses RLS.

## Remaining blocking work

1. Implement an independently verified server authentication/membership provider, and persist an explicit user approval against the final, immutable Preview/Brief/assets revision. Authenticate revocations separately. Never accept approval or `ownerId` merely from the browser payload or custom PostgreSQL session settings.
2. Provision an audited restricted LOGIN service role and use narrowly scoped grants and owner-scoped RLS. Verify the *effective* Vercel Preview connection and reset of transaction-local tenant context. No owner connection as customer-facing application credential.
3. Run real multi-connection tenant A/B denial/allow tests and concurrent duplicate reservation/claim tests without upstream calls; reconcile ambiguous outcomes without automatic re-POST.
4. Only then wire a single authorized paid build route. Seven paid routes stay 503; PR #49 stays draft/unmerged; production untouched.

This checkpoint does NOT imply that a real approval can be recorded, tenants are isolated, or v0 one-shot enforcement works end to end.
