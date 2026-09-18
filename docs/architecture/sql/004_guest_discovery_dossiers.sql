-- INTERNAL / CORE. Design migration ONLY; NOT applied to any database by this commit.
-- Account-free Discovery requires an opaque, server-issued, high-entropy resume secret.
-- Never find a dossier by business name, email, IP, fingerprint or publicly supplied owner ID.
-- Store only HMAC-SHA256(token, server secret) or suitably keyed digest; never raw token.
-- Keep the HMAC key outside database, source control and logs. Rotate resume secret on recovery.
-- Anonymous users receive NO direct database access; all access is mediated by a
-- server endpoint validating the cookie or one-time resume link and expiry.
-- 30 days of inactivity is an MVP PROPOSAL pending policy/legal review, not a legal term.

CREATE TABLE IF NOT EXISTS public.lumivey_guest_discovery_dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_token_digest char(64) NOT NULL UNIQUE CHECK (resume_token_digest ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired')),
  state_version bigint NOT NULL DEFAULT 0 CHECK (state_version >= 0),
  -- Typed/validated Discovery snapshot. Source evidence, corrections, uncertainty,
  -- explicit boundaries and preview feedback MUST retain distinct provenance.
  discovery_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  claimed_owner_id text,
  claimed_at timestamptz,
  CONSTRAINT lumivey_guest_claim_consistent CHECK (
    (status = 'claimed' AND claimed_owner_id IS NOT NULL AND claimed_at IS NOT NULL)
    OR (status <> 'claimed' AND claimed_owner_id IS NULL AND claimed_at IS NULL)
  ),
  CONSTRAINT lumivey_guest_expiry_after_activity CHECK (expires_at > last_activity_at)
);

-- Files are stored in private object storage, NOT as data URLs inside JSON/SQL.
-- Blob keys are server-generated; a download requires separate dossier authorization.
CREATE TABLE IF NOT EXISTS public.lumivey_guest_discovery_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid NOT NULL REFERENCES public.lumivey_guest_discovery_dossiers(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  original_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  source_kind text NOT NULL CHECK (source_kind IN ('customer-upload', 'website-source', 'generated-preview', 'other')),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lumivey_guest_dossier_expiry_idx
 ON public.lumivey_guest_discovery_dossiers (expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS lumivey_guest_assets_dossier_idx
 ON public.lumivey_guest_discovery_assets (dossier_id);

ALTER TABLE public.lumivey_guest_discovery_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lumivey_guest_discovery_dossiers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lumivey_guest_discovery_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lumivey_guest_discovery_assets FORCE ROW LEVEL SECURITY;
-- Deliberately NO policies/grants for browser/PUBLIC or the existing NOLOGIN worker.
-- The current neondb_owner BYPASSRLS role MUST NOT become an application connection.
-- Before deployment: provision verified least-privilege server role, transactional
-- authorization, exact Preview DB host assertion, size/format limits, malware
-- checks as appropriate, audit, encrypted private blob storage and deletion worker.
-- Deleting SQL rows does not delete object-storage bytes: inventory and purge ALL
-- referenced blobs first or via a durable outbox with retries, plus backup policy.
-- Do not apply until documented visitor notice, consent/legal basis where needed,
-- retention policy, removal and access-recovery are reviewed and implemented.
