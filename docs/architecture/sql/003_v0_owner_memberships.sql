-- INTERNAL / CORE. PR #49 Preview branch only; NEVER apply to default/main implicitly.
-- An email, sign-up, client ownerId, session token passed in JSON, or JWT claim
-- does not establish ownership. Provision memberships only after independent
-- operator verification. No application grants/policies until session integration.
CREATE TABLE IF NOT EXISTS public.lumivey_v0_owner_memberships (
  subject_id uuid NOT NULL,
  owner_id text NOT NULL CHECK (length(owner_id) BETWEEN 1 AND 256),
  can_approve boolean NOT NULL DEFAULT false,
  can_build boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT false,
  verified_by_subject uuid NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_id, owner_id)
);
CREATE INDEX IF NOT EXISTS lumivey_v0_owner_memberships_owner_idx
  ON public.lumivey_v0_owner_memberships (owner_id, subject_id);
ALTER TABLE public.lumivey_v0_owner_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lumivey_v0_owner_memberships FORCE ROW LEVEL SECURITY;
-- Deliberately zero RLS policies and no grants to worker, browser or PUBLIC.
-- Future server flow: verify real Better Auth session with provider, reject expired,
-- banned/impersonated sessions, independently confirm membership.active and
-- requested capability in trusted server-side lookup. Never pick an arbitrary
-- owner from a browser-provided ID. Require an explicit single owner context if
-- a subject belongs to multiple owners. Fail closed on ambiguous membership.
-- The owner-role connection is BYPASSRLS: do not deploy it as runtime identity.
-- This migration alone is NOT authentication or A/B isolation.
