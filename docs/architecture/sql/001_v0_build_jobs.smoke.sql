-- Run ONLY on verified lumivey-preview with a deliberately authorised test role.
-- Never run on production/main. Requires 001_v0_build_jobs.sql already applied.
-- The migration uses FORCE ROW LEVEL SECURITY with no policies: ordinary roles
-- MUST fail closed. Do not grant BYPASSRLS or add an allow-all policy for this test.
-- If the current role is denied, STOP: set up and audit a dedicated backend role
-- and narrowly scoped policies before running the DML assertions. Do not work around
-- a permission error by disabling RLS.
-- Every test insertion/update below is inside a transaction that rolls back.
-- This proves sequential SQL constraints only, NOT true two-session concurrency,
-- session authorisation, the application wiring, or external v0 behaviour.
BEGIN;
DO $$
DECLARE
  first_id uuid;
  second_id uuid;
  claimed_id uuid;
  identity_count integer;
BEGIN
  INSERT INTO lumivey_v0_build_jobs (owner_id, approved_preview_id, brief_sha256, assets_sha256)
  VALUES ('_sql_smoke_owner_', '_sql_smoke_preview_', repeat('a',64), repeat('b',64))
  ON CONFLICT ON CONSTRAINT lumivey_v0_build_once DO NOTHING
  RETURNING id INTO first_id;
  IF first_id IS NULL THEN RAISE EXCEPTION 'Initial reservation unexpectedly conflicted'; END IF;

  INSERT INTO lumivey_v0_build_jobs (owner_id, approved_preview_id, brief_sha256, assets_sha256)
  VALUES ('_sql_smoke_owner_', '_sql_smoke_preview_', repeat('a',64), repeat('b',64))
  ON CONFLICT ON CONSTRAINT lumivey_v0_build_once DO NOTHING
  RETURNING id INTO second_id;
  IF second_id IS NOT NULL THEN RAISE EXCEPTION 'Duplicate reservation returned a second job'; END IF;

  SELECT count(*) INTO identity_count FROM lumivey_v0_build_jobs
  WHERE owner_id='_sql_smoke_owner_' AND approved_preview_id='_sql_smoke_preview_'
    AND brief_sha256=repeat('a',64) AND assets_sha256=repeat('b',64);
  IF identity_count != 1 THEN RAISE EXCEPTION 'Expected one row for immutable build identity'; END IF;

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
  claimed_id := NULL;
  UPDATE lumivey_v0_build_jobs SET status='submitting', updated_at=now()
  WHERE id=first_id AND owner_id='_sql_smoke_owner_' AND status='reserved'
  RETURNING id INTO claimed_id;
  IF claimed_id IS NOT NULL THEN RAISE EXCEPTION 'Uncertain request was reclaimed'; END IF;
  RAISE NOTICE 'Sequential SQL assertions passed; test transaction will roll back';
END $$;
ROLLBACK;
-- For concurrency proof use two independently authenticated connections to the
-- same verified preview database and show exactly one reservation and claim.
