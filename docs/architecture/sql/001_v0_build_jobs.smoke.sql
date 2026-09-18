-- Run ONLY in a disposable PostgreSQL database as a privileged migration/test role.
-- Requires 001_v0_build_jobs.sql to be applied. Rolls back all inserted test data.
-- This checks basic uniqueness and serial claim semantics, NOT concurrent multi-session
-- execution, auth isolation, application integration, or external v0 behavior.
BEGIN;
DO $$
DECLARE
  first_id uuid;
  claimed_id uuid;
  duplicate_count integer;
BEGIN
  INSERT INTO lumivey_v0_build_jobs (owner_id, approved_preview_id, brief_sha256, assets_sha256)
  VALUES ('_sql_smoke_owner_', '_sql_smoke_preview_', repeat('a',64), repeat('b',64))
  ON CONFLICT ON CONSTRAINT lumivey_v0_build_once DO NOTHING
  RETURNING id INTO first_id;
  IF first_id IS NULL THEN RAISE EXCEPTION 'Initial reservation unexpectedly conflicted'; END IF;

  INSERT INTO lumivey_v0_build_jobs (owner_id, approved_preview_id, brief_sha256, assets_sha256)
  VALUES ('_sql_smoke_owner_', '_sql_smoke_preview_', repeat('a',64), repeat('b',64))
  ON CONFLICT ON CONSTRAINT lumivey_v0_build_once DO NOTHING;
  SELECT count(*) INTO duplicate_count FROM lumivey_v0_build_jobs WHERE id=first_id;
  IF duplicate_count != 1 THEN RAISE EXCEPTION 'Duplicate reservation created'; END IF;

  UPDATE lumivey_v0_build_jobs SET status='submitting', submitting_at=now(), updated_at=now()
  WHERE id=first_id AND owner_id='_sql_smoke_owner_' AND status='reserved'
  RETURNING id INTO claimed_id;
  IF claimed_id IS DISTINCT FROM first_id THEN RAISE EXCEPTION 'First submit claim failed'; END IF;

  claimed_id := NULL;
  UPDATE lumivey_v0_build_jobs SET status='submitting', submitting_at=now(), updated_at=now()
  WHERE id=first_id AND owner_id='_sql_smoke_owner_' AND status='reserved'
  RETURNING id INTO claimed_id;
  IF claimed_id IS NOT NULL THEN RAISE EXCEPTION 'Duplicate submit claim succeeded'; END IF;

  UPDATE lumivey_v0_build_jobs SET status='uncertain', updated_at=now()
  WHERE id=first_id AND owner_id='_sql_smoke_owner_' AND status='submitting';
  UPDATE lumivey_v0_build_jobs SET status='submitting', updated_at=now()
  WHERE id=first_id AND owner_id='_sql_smoke_owner_' AND status='reserved'
  RETURNING id INTO claimed_id;
  IF claimed_id IS NOT NULL THEN RAISE EXCEPTION 'Uncertain request was reclaimed'; END IF;
  RAISE NOTICE 'Basic sequential SQL smoke assertions passed (transaction will roll back)';
END $$;
ROLLBACK;
-- To prove concurrency, use TWO independent connections issuing the reservation
-- and claim simultaneously, then assert exactly one insertion and one claim succeed.
