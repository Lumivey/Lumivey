# Checkpoint — eenmalige v0-aanroep achter databasecontract

Datum: 18 september 2026. Alleen concept-PR #49. Geen merge, geen nieuwe v0-call, geen productie-uitrol.

## Wat is toegevoegd en bewezen
- `lib/lumivey/v0-build-gate.ts`: driver-onafhankelijke orchestratie achter een toekomstig duurzaam transactioneel ledger-interface. Eén atomische claim moet zijn gecommit vóór een betaalde POST; timeout/onzekere opslag leidt niet tot blind opnieuw versturen. Noch auth noch DB-concurrentie wordt door deze module gegarandeerd.
- `tests/v0-build-gate.test.mjs`: gesimuleerde ledger met scenario's voor twee callers, refresh, timeout, verloren claim, opslagfout, ongeldige identiteit, onbeschikbare database en ontbrekend upstream chat-ID. Laatste GitHub Actions run `35327281566`, job `105543169187`, geslaagd op commit `7819a90125c50696e660f0c5174f7d7e9a6a0927`. Dit bewijst uitsluitend unit-logica met mocks.
- `.github/workflows/v0-build-safety.yml`: aparte PR-test op Node 22.18 zonder secrets, database of v0 API.
- `docs/architecture/sql/001_v0_build_jobs.smoke.sql` is gecorrigeerd: de eerdere duplicate-check telde alleen het oorspronkelijke id en kon een tweede rij missen. De nieuwe test controleert de daadwerkelijke unieke identiteit en vereist dat een tweede INSERT geen id teruggeeft. Verder wordt expliciet gewaarschuwd dat `FORCE RLS` zonder geautoriseerde policy een gewone DB-rol blokkeert. **Dit SQL-bestand is nog niet uitgevoerd.** Geen RLS uitschakelen om de test te laten slagen.

## Bevestigde databasevoorbereiding
- Neon Free Frankfurt en Vercel-project `lumivey` Preview secretvariabelen bestaan. Ruud heeft migratie 001 op Neon SQL Editor branch `lumivey-preview` uitgevoerd en met `to_regclass` de tabel bevestigd.
- Dit bewijst NIET dat Vercel Preview `DATABASE_URL` naar die exacte branch verwijst. De Vercel-connector gaf bij `get_project(lumivey, ruud-s-lumivey1)` opnieuw 403; er is geen runtime DB-verificatie gelukt. Geen wachtwoorden, hosts of connection strings delen.

## Niet gereed
- Ledgercontract niet gekoppeld aan Neon; PostgreSQL-driver, transactionele adapter en werkende autorisatie ontbreken.
- `app/api/regression/adrie/build-v0/route.ts` roept nog direct v0 aan. Gate blokkeert daar nog GEEN dubbele kosten.
- Exacte Vercel Preview branchbinding, DB-rol/RLS, duurzame Preview approval, rollback SQL-smoke en echte twee-verbindingen-concurrency ontbreken.
- Geen betaalde E2E, merge of productie-uitrol. Vercel-build is geen DB-/auth-testbewijs.

## Volgende taak
1. Verifieer sessie/operatorauth en goedgekeurde finale Brief/asset-opslag server-side.
2. Verifieer de exacte runtime DB-branch privé zonder connection string of credentials terug te geven, en DB-rol/RLS. Geen nieuwe paid API-call.
3. Voeg DB-driver/lockfile en transactionele ledgeradapter toe, test twee verbindingen en refresh/timeout; sluit route pas daarna fail-closed aan.
4. Private screenshotcache per owner/chat/exacte versie en volledige doorlooptijdmetingen; partial metrics blijven apart.

Het volledige bestaande `docs/active/CURRENT_STATE.md` moet behouden blijven; deze datumupdate staat in dit checkpoint in plaats van eerdere recoverygeschiedenis te vervangen.
