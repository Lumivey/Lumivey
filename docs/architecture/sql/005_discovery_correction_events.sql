-- INTERNAL / CORE. DRAFT migration ONLY, not applied to Neon or production.
-- Build on 004_guest_discovery_dossiers.sql. An event is an explicitly confirmed
-- entrepreneur utterance captured by an authenticated/authorized server writer,
-- never an LLM inference, scrape, checkbox or client-supplied verified flag.
-- App must validate a verified guest resume credential or a verified account
-- membership and dossier access inside a suitable transaction BEFORE insert.
-- NO direct INSERT/SELECT/UPDATE grants to browsers, PUBLIC or NOLOGIN worker.
CREATE TABLE IF NOT EXISTS public.lumivey_discovery_correction_events (
  sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dossier_id uuid NOT NULL REFERENCES public.lumivey_guest_discovery_dossiers(id),
  claim_key text NOT NULL CHECK (claim_key ~ '^[a-z][a-z0-9_.:-]{0,127}$'),
  kind text NOT NULL CHECK (kind IN ('confirmation', 'correction', 'rejection')),
  value text NOT NULL CHECK (
    (kind = 'rejection' AND value = '') OR
    (kind <> 'rejection' AND length(btrim(value)) BETWEEN 1 AND 4000)
  ),
  -- Verbatim message. Never generate a speaker quote from model output.
  utterance text NOT NULL CHECK (length(btrim(utterance)) BETWEEN 1 AND 20000),
  access_kind text NOT NULL CHECK (access_kind IN ('verified-guest', 'verified-account')),
  subject_id uuid,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lumivey_correction_access_consistent CHECK (
    (access_kind = 'verified-guest' AND subject_id IS NULL) OR
    (access_kind = 'verified-account' AND subject_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS lumivey_discovery_correction_dossier_seq_idx
  ON public.lumivey_discovery_correction_events(dossier_id, sequence);
ALTER TABLE public.lumivey_discovery_correction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lumivey_discovery_correction_events FORCE ROW LEVEL SECURITY;
-- Zero policies / zero app grants = fail closed until a reviewed least-privilege
-- read/write adapter exists. No public endpoint, no blanket owner BYPASSRLS.
-- The replay function reads ordered events for ONE authorized dossier. A global
-- sequence provides stable append order with gaps allowed (rolled-back inserts).
-- Never UPDATE a prior statement: a later correction/rejection is another row.
-- Before deploying, design DB-enforced append-only privileges (no UPDATE/DELETE),
-- a deletion worker that also handles correction rows and private blobs, and
-- real tests for account A/B and guest access. CAS snapshot state_version or
-- transactional locking must prevent lost updates when materializing Understanding.
-- Do not keep old events beyond dossier retention/deletion; FK intentionally
-- omits ON DELETE CASCADE until deletion/outbox behavior is reviewed.
