# Lumivey — guest Discovery, resume and deferred account checkpoint

Date: 2026-09-18. Status: DRAFT / NOT CONNECTED. Scope: PR #49 only; no production changes and no billable v0 calls.

## Ruud's explicit product decision (supersedes any earlier login-first interpretation)

1. Discovery starts **without an account**. The entrepreneur may provide a website, photos, brochures, documents and corrections at any point before Preview.
2. Lumivey persists the conversation, source provenance, raw-vs-confirmed facts, uncertainty, corrections, source asset references and stage in a temporary guest dossier, so returning users do not have to repeat their story.
3. On return, Lumivey recognizes possession of a secure dossier-specific resume credential, **not business ownership**. It asks naturally whether previously gathered information is still accurate. Never silently promote scraped observations to confirmed facts.
4. Preview remains part of Discovery. Clicking 'Deze klopt — ga door' is approval of the *creative direction*, not database proof of final build approval.
5. **Only after Preview acceptance** does the entrepreneur create/verify an account, confirm business ownership and final brief/assets. A single, authenticated server operation claims the guest dossier and writes a durable, immutable build approval; this cannot be performed by client-only localStorage or a forged ID/hash.
6. Only then may website production be considered, subject to the still-blocked one-shot/RLS/security gates.

## Implemented on draft branch now

- `docs/architecture/sql/004_guest_discovery_dossiers.sql`: proposed guest dossier, expiry, version and asset-metadata schema, ENABLE/FORCE RLS, no grants or policies. SQL migration has **NOT been applied**. Private blob bytes must live outside JSON/SQL; SQL cascade is not object-store deletion.
- `lib/lumivey/guest-discovery-core.ts`: server-side opaque resume credentials (32 random bytes), keyed digest, constant-time comparison, expiry rejection, proposed 30-day idle renewal and cleanup selection. This is **only a pure primitive**, not a deployed cookie, link, session, storage adapter or endpoint.
- `tests/guest-discovery-core.test.mjs`: issuance, wrong/claimed/expired token denial, retention and malformed settings. CI workflow includes it.

## Before enabling public persistence

- Confirm 30-day inactivity as an explicit privacy/retention choice, visitor notice and lawful basis. Define minimum data captured; do not indefinitely retain abandoned dossiers. Prefer storing photos and documents in private object storage with server-only access, limits and provenance metadata in Neon. Never log raw token, uploaded material or secrets.
- Implement atomic create/read/update with server-only authenticated-by-possession guest cookie: Secure, HttpOnly, SameSite, appropriate Path; CSRF/origin protections on mutation; never infer identity from email, business name, IP or device fingerprint. Do not put resumable secrets in URLs where referrer, logs or analytics can capture them; if link recovery is introduced, make it short-lived, one-time and rotated.
- A returning dossier is only resumed after verifying token and expiry. Extend 30 days only on verified meaningful activity, transactionally with state_version to prevent stale concurrent overwrite. Restore both text and source assets; preserve corrections and context quality. Ask confirmation of old facts without repeating the intake.
- Bind account to dossier only after verified Better Auth session + server-controlled owner membership, explicit claim authorization, and token rotation. Multi-owner identity is ambiguous until user explicitly selects an independently verified owner. Old guest token must no longer grant access after claim.
- Build a durable expiry/purge pipeline and deletion on request: block access at expiry, queue ALL associated private blobs for deletion with retries, remove SQL rows and track purge outcome; review backup retention separately. A plain SQL DELETE with ON DELETE CASCADE does NOT delete stored files.
- Prove with real Preview DB and two independent sessions: guest A cannot access B; wrong/expired/claimed token denied; resume preserves provenance/corrections/assets; browser restart works; stale updates conflict; claim is one-shot; deletion purges blob+DB and expiry does not resurrect. Do not use privileged `neondb_owner` as app connection.
- Existing `app/page.tsx` and `/prepare` rely on localStorage and are not yet wired to server persistence. Current `/api/chat` accepts client-supplied histories/source contexts. Do not claim these are authenticated or retained; design a separate server-owned state boundary before trusting persistence.

**Explicit gate:** no migration execution, public guest endpoint, Vercel environment changes, customer data capture or paid v0 enablement in this checkpoint. PR #49 stays draft; seven paid build mutation routes stay closed.
