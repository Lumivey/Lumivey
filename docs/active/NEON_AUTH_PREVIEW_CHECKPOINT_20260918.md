# Neon Auth — Preview-only activation checkpoint (2026-09-18)

Scope: Neon project `odd-term-62838732`, database `neondb`, explicit Vercel-created Preview branch `br-green-lake-b2xh1tni` / `preview/test/v0-api-visibility-20260917`. PR #49 remains draft; no production/main changes or paid v0 requests.

## Verified action

1. `get_auth` on that explicit branch initially returned `Neon Auth is not enabled for this branch`.
2. With user approval, `provision_neon_auth` was called on that branch ONLY, provider `better_auth`, database `neondb`. It returned a branch-specific auth base URL and JWKS URL (no secret values recorded here).
3. An independent `get_auth` confirmed the provider `better_auth`, correct branch id and database. Redacted `get_neon_auth_config` also confirmed branch name and provider.
4. SQL catalog inspection confirmed `neon_auth` schema with tables `account`, `invitation`, `jwks`, `member`, `organization`, `project_config`, `session`, `user`, `verification`. The provisioning response's proposed `users_sync` table was NOT found: do not build code assuming it exists; inspect the provider's documented user/session model and schema first.
5. Existing approval and job ledger tables remain present; verified zero approval rows and zero build-job rows directly after activation. No customer user, verified session, stored approval, or tenant isolation has been tested or claimed.

## Important configuration blockers

At inspection, Neon Auth had `trusted_origins=[]`, `allow_localhost=true`, email/password enabled with sign-up allowed, and email verification disabled. Do NOT interpret sign-up or unverified email addresses as ownership of a business/Preview. Before exposing an auth UI or endpoint, configure narrow trusted Preview origins and an explicit, independently verified owner-membership/approval policy, and review sign-up/email verification settings. Do not create customers or enable public builds as a shortcut.

The existing site currently uses browser `localStorage` for `lumivey-approved-impression` and `lumivey-test-account`; these do not authenticate a person or prove a durable approval. `v0-build-authorization.ts` is a pure tested contract, NOT wired to a verified session, trusted membership lookup, approval DB adapter, or production build route.

## Next execution gate

Implement server-side session verification with a documented, branch-specific Better Auth integration; derive identity from a verified provider session, resolve membership from server-controlled storage, then bind immutable server-stored final brief/assets hashes to a trusted approval write. Do not accept client-provided owner ID, email, signature, GUC, or hashes as proof. Set and test permitted Preview origins and CSRF/session security before auth route exposure. Retain fail-closed build routes and unchanged least-privilege NOLOGIN DB role until real A/B isolation and two-connection idempotency tests succeed. Never expose credentials in GitHub, logs, chat, or screenshots.

**Status: authentication infrastructure provisioned on Preview; application authentication and build approval NOT yet implemented.**