-- PR #49 only. Apply to the independently verified Vercel-created Preview Neon branch;
-- never implicitly target main/production. No public, browser, worker or anonymous grants.
-- This schema is only persistence infrastructure: no session provider or approval writer exists yet.
-- Approval MUST be inserted by an independently authenticated server operation that
-- verifies the actor may approve this exact owner, preview, final brief and assets.
-- Never interpret a client POST, checkbox, preview signature, hash or custom GUC as approval.

CREATE TABLE IF NOT EXISTS public.lumivey_v0_preview_approvals (
  preview_id text PRIMARY KEY CHECK (length(preview_id) BETWEEN 1 AND 256),
  owner_id text NOT NULL CHECK (length(owner_id) BETWEEN 1 AND 256),
  brief_sha256 char(64) NOT NULL CHECK (brief_sha256 ~ '^[0-9a-f]{64}$'),
  assets_sha256 char(64) NOT NULL CHECK (assets_sha256 ~ '^[0-9a-f]{64}$'),
  approved_by_subject text NOT NULL CHECK (length(approved_by_subject) BETWEEN 1 AND 256),
  approved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lumivey_v0_approval_owner_preview UNIQUE (owner_id, preview_id)
);

-- Revocation is append-only, not mutation of the immutable approval fingerprint.
CREATE TABLE IF NOT EXISTS public.lumivey_v0_preview_revocations (
  preview_id text PRIMARY KEY REFERENCES public.lumivey_v0_preview_approvals(preview_id),
  revoked_by_subject text NOT NULL CHECK (length(revoked_by_subject) BETWEEN 1 AND 256),
  revoked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lumivey_v0_preview_approvals_owner_idx
  ON public.lumivey_v0_preview_approvals(owner_id, approved_at DESC);

-- No policies and no application role grants yet: ordinary database roles fail closed.
ALTER TABLE public.lumivey_v0_preview_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lumivey_v0_preview_approvals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lumivey_v0_preview_revocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lumivey_v0_preview_revocations FORCE ROW LEVEL SECURITY;

-- Future trusted lookup MUST join revocations, require stored owner_id == verified
-- session membership, and compare both stored hashes to the server-stored final
-- artifact revision. The owner DB role has BYPASSRLS, so no isolation claim yet.
-- No route may create approval/revocation or billable v0 work from this migration alone.
