# Owner membership and provider-session gate — 2026-09-18

Scope: draft PR #49 and explicitly selected Neon Preview branch `br-green-lake-b2xh1tni` / database `neondb` only. Production/main and seven paid v0 routes unchanged/closed.

## Verified changes

- Inspected actual Neon Better Auth `neon_auth.user` and `neon_auth.session` schemas; user ID is UUID, `emailVerified` exists, and provider session has expiry/user reference. Do not assume `users_sync` exists.
- Added `docs/architecture/sql/003_v0_owner_memberships.sql`, applied its CREATE TABLE/INDEX and ENABLE/FORCE RLS on the explicit Preview branch. Independent SQL confirms the membership table exists, ENABLE/FORCE RLS, zero policies, zero rows, and no SELECT/INSERT privileges for the NOLOGIN limited role. No account was granted business ownership.
- Added pure `lib/lumivey/v0-session-membership.ts`: consumes a *server-verified* provider session and *server-controlled* membership lookup; rejects unverified email, expired/banned/impersonated session, absent or ambiguous owner, cross-subject, inactive or no-build membership and backend errors. This is not connected to a live provider, API route, or database adapter. Unit tests in `tests/v0-session-membership.test.mjs` added to CI; CI test command passed on commit `4f386bc4` (workflow finalization may still be in progress at first check).

## Remaining blockers

- Email/password public sign-up is enabled without verification in existing Preview Neon Auth configuration. The gate rejects emailVerified=false; **do not expose authentication or approve any owner based on signup/email alone**. Review/secure provider settings and trusted origins, including CSRF handling, before wiring a browser flow.
- A verified session proves an account, not business ownership. Membership must be assigned only by a separately authorized operator after independent owner verification, with audit; no self-service owner grants. No privileged DB credentials or arbitrary client SQL.
- No live login, owner membership, approval write, tenant A/B test, real limited DB login, two-connection build idempotency or actual Vercel runtime endpoint proof yet. Do not claim production readiness or merge PR #49. Do not send paid v0 requests.
