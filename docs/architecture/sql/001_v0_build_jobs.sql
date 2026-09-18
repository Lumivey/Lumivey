-- Lumivey v0 job ledger — PostgreSQL migration, NOT YET APPLIED.
-- This is infrastructure for a future authenticated server-side integration.
-- Never accept owner_id directly from client input; derive it from verified session/operator authorization.
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
  -- The immutable identity is owner + approved preview + final brief + final asset revision.
  -- A concurrent INSERT cannot create two billable jobs for this identity.
  CONSTRAINT lumivey_v0_build_once UNIQUE (owner_id, approved_preview_id, brief_sha256, assets_sha256),
  CONSTRAINT lumivey_v0_chat_after_submission CHECK (v0_chat_id IS NULL OR status IN ('submitted', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS lumivey_v0_build_jobs_owner_idx
  ON lumivey_v0_build_jobs (owner_id, reserved_at DESC);

-- Fail closed for browser-facing/database roles until explicit, audited owner-scoped policies exist.
-- A privileged backend service role must still perform its own authorization before every operation.
ALTER TABLE lumivey_v0_build_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumivey_v0_build_jobs FORCE ROW LEVEL SECURITY;

-- Reservation transaction (run as an authorized backend role, owner_id from verified auth):
-- BEGIN;
-- INSERT INTO lumivey_v0_build_jobs (owner_id, approved_preview_id, brief_sha256, assets_sha256)
-- VALUES ($1, $2, $3, $4)
-- ON CONFLICT ON CONSTRAINT lumivey_v0_build_once DO NOTHING
-- RETURNING id, status;
-- COMMIT;
-- If no row returned, SELECT the existing row WHERE owner_id=$1 AND preview/hash fields match;
-- respond with its state instead of creating another v0 chat.
-- Never treat a fresh HTTP request / browser refresh as authorization to issue POST /v1/chats.

-- Immediately before the sole upstream POST, atomically claim an existing RESERVED row:
-- UPDATE lumivey_v0_build_jobs
-- SET status='submitting', submitting_at=now(), updated_at=now()
-- WHERE id=$1 AND owner_id=$2 AND status='reserved'
-- RETURNING id;
-- Exactly ONE contender may receive a row. Commit BEFORE sending the v0 request.
-- A timeout/crash after claiming leaves SUBMITTING: do NOT auto-retry or expire a lease.
-- An ambiguous upstream result must be marked UNCERTAIN after investigation, and must
-- never silently return to RESERVED. Manual reconciliation with v0 account is required.
-- A confirmed response with chat ID moves SUBMITTING -> SUBMITTED, storing chat ID.
-- Polling can move SUBMITTED -> COMPLETED or FAILED for the SAME chat/version.
-- Separate authorization and exact-preview/signature checks are required BEFORE reservation.
-- Do not use this migration as proof that the existing build-v0 route is protected:
-- it is not wired to this table yet. Migration has not been executed.
