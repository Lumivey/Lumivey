# Neon Preview — execute-only preflight reconciled (18 september 2026)

Scope: draft PR #49, `test/v0-api-visibility-20260917`; read-only Neon catalog audit exclusively `odd-term-62838732` / `br-green-lake-b2xh1tni` / `neondb`. No production/default-branch mutation, credentials, SQL functions, RLS policy, table grants, app route or paid v0 call.

## Concrete defect found and fixed

Previous `lib/lumivey/guest-dossier-db-preflight.ts` incorrectly required direct app SELECT and INSERT on all three dossier tables and nonzero RLS-policy count on each, contradicting approved EXECUTE-only design (`006`, `007`, `008`). Thus an appropriately hardened deployment would fail preflight and granting rights to satisfy it would weaken isolation. Changed guard to require **no direct app SELECT/INSERT/UPDATE/DELETE on ANY of the three tables**, no CREATE on API schema, verified preview-only hostname/database/expected restricted role and `sslmode=verify-full`, forced RLS, nonprivileged LOGIN role, and both correctly named SECURITY DEFINER functions owned by the separate NOLOGIN function owner with fixed search_path and signature-specific app EXECUTE plus API schema USAGE. Fail closed if missing/unknown. `PASS_PRELIMINARY` is ONLY catalog preflight, not authorization/isolation proof. It does not yet review function bodies, PUBLIC function EXECUTE, role memberships, session binding or real A/B behavior; those remain mandatory independent checks before runtime enablement.

## Evidence

Neon read-only catalog queries confirm the API schema owner is `neondb_owner`, there are currently **zero routines**, app role has no API USAGE/CREATE, function owner has USAGE but no CREATE; restricted roles have no password, no superuser/BYPASSRLS, no memberships and no public-schema CREATE. The new preflight MUST currently block, by design. No live database query has been executed by the new app-role preflight; CI uses mock rows only.

Updated `tests/guest-dossier-db-preflight.test.mjs` covers direct grants of each kind, function absence, wrong owner, unsafe search_path, non-definer function, missing EXECUTE/schema USAGE, wrong role, TLS, hostname, RLS, privileged roles and masked errors. GitHub Actions on code commit `6cbe93cd6a140750be3e34f92658af16cbe574ab`: v0 build safety run `35351399253`, job `105620147827` success; v0 emergency shutdown run `35351399285`, job `105620148272` success. Both are static/mocked CI, not real Neon A/B.

## Next actual implementation gate

Review SQL 007/008 for valid Postgres privilege semantics, PUBLIC EXECUTE/default privileges, SECURITY DEFINER creation and safe owner transfer, rollback, token delivery and retention before applying. Provision a restricted runtime credential via secret manager outside GitHub/chat, without making owner URL available to app. Audit live functions and function ACL independently (not only preflight), then run two independent restricted connections with A/B, wrong/reused/expired token, CAS and rollback, correction replay; only after this connect Discovery. Seven paid v0 routes remain closed; PR remains draft.
