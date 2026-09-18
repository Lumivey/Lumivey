# Checkpoint — eenmalige v0-aanroep achter databasecontract

Datum: 18 september 2026. Alleen concept-PR #49. Geen merge, geen nieuwe v0-call, geen productie-uitrol.

## Wat is toegevoegd en bewezen
- `lib/lumivey/v0-build-gate.ts`: driver-onafhankelijke orchestratie achter een toekomstig duurzaam transactioneel ledger-interface. Eén atomische claim moet zijn gecommit vóór een betaalde POST; timeout/onzekere opslag leidt niet tot blind opnieuw versturen. Noch auth noch DB-concurrentie wordt door deze module gegarandeerd.
- `tests/v0-build-gate.test.mjs`: gesimuleerde ledger met scenario's voor twee callers, refresh, timeout, verloren claim, opslagfout en ongeldige identiteit.
- `.github/workflows/v0-build-safety.yml`: nieuwe gescheiden PR-test op Node 22.18, zonder secrets, database of v0 API. **GitHub Actions run 35326640353 unit-job 105541112112 is geslaagd**, inclusief de stap 'One-shot and fingerprint unit tests'. Dit bewijst alleen dat de twee testbestanden tegen de gesimuleerde contracten slagen, niet dat de echte Neon-koppeling werkt.

## Bevestigde handmatige databasevoorbereiding
- Neon Free Frankfurt en Vercel-project `lumivey` Preview secretvariabelen bestaan. Ruud heeft migratie 001 op de Neon SQL Editor branch `lumivey-preview` uitgevoerd en met `to_regclass` de tabel bevestigd.
- Dit bewijst NIET dat de Vercel Preview `DATABASE_URL` naar die exacte branch verwijst. Nooit secretwaarden, wachtwoorden of connection strings delen.

## Wat nadrukkelijk NIET gereed is
- Interfacecontract niet gekoppeld aan Neon; geen PostgreSQL-driver of atomische database-implementatie toegevoegd.
- Betaalde `app/api/regression/adrie/build-v0/route.ts` roept nog direct v0 aan. De nieuwe module blokkeert daar nog geen dubbele kosten.
- Vercel Preview -> exacte `lumivey-preview` branch niet geverifieerd; geen server-side operator-/accounteigenaar, duurzame Preview-approval store, geverifieerde DB-rol/RLS of echte twee-sessies-concurrencytest.
- Rollback SQL-smoketest is nog niet in Neon uitgevoerd. Geen betaalde E2E, geen merge, geen productie-uitrol. Vercel-build is geen DB-/auth-testbewijs.

## Exacte vervolgvolgorde
1. Verifieer identity/approval-opslag en sessie-/operatorauth; kies passende server-only DB-rol met expliciete RLS-rechten.
2. Read-only branchidentiteit vanuit Vercel Preview controleren met private diagnostiek (geen credentials/host teruggeven). Niet per ongeluk Neon `main` gebruiken.
3. PostgreSQL-driver en lockfile toevoegen; transactionele ledgerimplementatie en echte multi-session tests. Koppel betaalde route pas daarna fail-closed aan `submitV0Once`.
4. Private screenshots per owner/chat/exacte versie en volledige E2E-metingen; partial metrics apart houden voor dashboard.
