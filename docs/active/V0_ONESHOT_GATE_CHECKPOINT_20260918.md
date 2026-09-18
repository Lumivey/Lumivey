# Checkpoint — eenmalige v0-aanroep achter databasecontract

Datum: 18 september 2026. Alleen concept-PR #49. Geen merge, geen nieuwe v0-call, geen productie-uitrol.

## Wat is toegevoegd
- `lib/lumivey/v0-build-gate.ts`: geïsoleerde, driver-onafhankelijke orchestratie die alleen na geverifieerde autorisatie/goedkeuring aangeroepen mag worden. Durable interface: reserveer op unieke identiteit, atomische eenmalige claim `reserved -> submitting`, commit vóór de betaalde v0-POST, sla chat-ID op, en behoud `uncertain` bij onduidelijke netwerkrespons of onzekere opslag. Een bestaande reservering wordt teruggegeven zonder opnieuw te genereren. Er is bewust GEEN in-memory, browser- of Blob-lock ingevoerd.
- `tests/v0-build-gate.test.mjs`: tests met een gesimuleerde ledger voor gelijktijdige oproepen, refresh, timeout, verloren claim, falende opslag en ontbrekende eigenaar/hash. Deze bewijzen alleen orchestratie onder de gesimuleerde interface, NIET PostgreSQL-concurrentie of auth.
- **Nieuw:** `.github/workflows/v0-build-safety.yml`: aparte PR-unitcheck op Node 22.18, zonder secrets, databaseverbinding of v0 API. Draait bestaande identity- en gate-tests bij relevante wijzigingen; workflow is gecommit, uitvoering/resultaat nog onafhankelijk te verifiëren. GitHub `fetch_commit_workflow_runs` gaf direct na de commit nog geen runs; dit mag niet als PASS worden genoteerd.

## Bevestigde handmatige databasevoorbereiding
- Neon Free Frankfurt en Vercel-project `lumivey` Preview secretvariabelen bestaan. Ruud heeft migratie 001 op de Neon SQL Editor branch `lumivey-preview` uitgevoerd en met `to_regclass` de tabel bevestigd.
- Dit bewijst NIET dat de Vercel Preview `DATABASE_URL` naar die exacte branch verwijst. Geen secretwaarden, screenshots met wachtwoorden of connection strings opvragen.

## Wat nadrukkelijk NIET gereed is
- Interfacecontract niet gekoppeld aan Neon; geen PostgreSQL-driver of atomische database-implementatie toegevoegd.
- Betaalde `app/api/regression/adrie/build-v0/route.ts` roept nog direct v0 aan. De nieuwe module blokkeert daar nog geen dubbele kosten.
- Vercel Preview -> exacte `lumivey-preview` branch niet geverifieerd; geen server-side operator-/accounteigenaar, duurzame Preview-approval store, geverifieerde DB-rol/RLS of echte twee-sessies-concurrencytest.
- Rollback SQL-smoketest is nog niet in Neon uitgevoerd. Geen betaalde E2E, geen merge, geen productie-uitrol. Vercel-buildstatus is geen DB-, auth- of unit-testbewijs.

## Exacte vervolgvolgorde
1. CI-resultaat controleren en falende tests daadwerkelijk repareren voordat verder wordt geïntegreerd.
2. Verifieer identity/approval-opslag en sessie-/operatorauth; kies passende server-only DB-rol met expliciete RLS-rechten.
3. Read-only branchidentiteit vanuit Vercel Preview controleren met private diagnostiek (geen credentials/host teruggeven). Niet per ongeluk Neon `main` gebruiken.
4. PostgreSQL-driver en lockfile toevoegen; transactionele ledgerimplementatie en echte multi-session tests. Koppel betaalde route pas daarna fail-closed aan `submitV0Once`.
5. Private screenshots per owner/chat/exacte versie en volledige E2E-metingen; partial metrics apart houden voor dashboard.
