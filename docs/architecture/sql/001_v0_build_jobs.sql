-- Lumivey v0 job ledger — PostgreSQL migration.
-- Deployment state 2026-09-18: applied manually to persistent lumivey-preview
-- and Vercel-created preview/test/v0-api-visibility-20260917; NOT applied on main.
-- These existing objects are NOT a working app integration or owner-authorized ledger.
-- Never accept owner_id directly from client input; derive from verified session/operator authorization.
-- Do not expose this table to anonymous or browser clients.

CREATE TABLE IF NOT EXISTS lumivey_v0_build_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL CHECK (length(owner_id) BETWEEN 1 AND 256),
  approved_preview_id text NOT NULL CHECK (length(approved_preview_id) BETWEEN 1 AND 256),
  brief_sha256 char(64) NOT NULL CHECK (brief_sha256 ~ '^[0-9a-f]{64}$'),
  assets_sha256 char(64) NOT NULL CHECK (assets_sha256 ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'submitting', 'submitted', 'uncertain', 'completed', 'failed')),
  v0_chat_id text UNIQUE,
  v0_version_id text,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  submitting_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_error_code text,
  -- Immutable identity is owner + approved preview + final brief + final asset revision.
  CONSTRAINT lumivey_v0_build_once UNIQUE (owner_id, approved_preview_id, brief_sha256, assets_sha256),
  CONSTRAINT lumivey_v0_chat_after_submission CHECK (v0_chat_id IS NULL OR status IN ('submitted', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS lumivey_v0_build_jobs_owner_idx
  ON lumivey_v0_build_jobs (owner_id, reserved_at DESC);

-- Fail closed for ordinary roles until explicit, audited owner-scoped policies exist.
-- WARNING: the currently available neondb_owner has BYPASSRLS, so these flags
-- DO NOT enforce tenant isolation on that privileged role. Never use it as
-- the app's owner-isolated ledger credential.
ALTER TABLE lumivey_v0_build_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumivey_v0_build_jobs FORCE ROW LEVEL SECURITY;

-- Reservation transaction (only as a verified owner-scoped backend DB role):
-- BEGIN;
-- INSERT INTO lumivey_v0_build_jobs (owner_id, approved_preview_id, brief_sha256, assets_sha256)
-- VALUES ($1, $2, $3, $4)
-- ON CONFLICT ON CONSTRAINT lumivey_v0_build_once DO NOTHING
-- RETURNING id, status;
-- COMMIT;
-- If no row returned, SELECT existing row under the SAME verified owner scope;
-- respond with its state instead of creating another v0 chat.
-- Never treat a fresh HTTP request / browser refresh as authorization to POST /v1/chats.

-- Immediately before the sole upstream POST, atomically claim RESERVED row:
-- UPDATE lumivey_v0_build_jobs
-- SET status='submitting', submitting_at=now(), updated_at=now()
-- WHERE id=$1 AND owner_id=$2 AND status='reserved'
-- RETURNING id;
-- Exactly ONE contender may receive a row. Commit BEFORE sending the v0 request.
-- A timeout/crash after claiming leaves SUBMITTING: do NOT auto-retry or expire a lease.
-- An ambiguous upstream result must be marked UNCERTAIN after investigation, and must
-- never silently return to RESERVED. Manual reconciliation with v0 account required.
-- A confirmed chat ID moves SUBMITTING -> SUBMITTED, storing chat ID.
-- Polling can move SUBMITTED -> COMPLETED or FAILED for the SAME chat/version.
-- Verified auth, owner-specific RLS policy and exact-preview/signature checks
-- MUST be proven before a paid mutation route can be reopened. Not wired yet.
