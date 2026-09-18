# Checkpoint — eenmalige v0-aanroep achter databasecontract

Datum: 18 september 2026. Alleen concept-PR #49. Geen merge, geen nieuwe v0-call, geen productie-uitrol.

## Wat is toegevoegd en bewezen
- `lib/lumivey/v0-build-gate.ts`: driver-onafhankelijke orchestratie achter een toekomstig duurzaam transactioneel ledger-interface. Eén atomische claim moet zijn gecommit vóór een betaalde POST; timeout/onzekere opslag leidt niet tot blind opnieuw versturen. Noch auth noch DB-concurrentie wordt door deze module gegarandeerd.
- `tests/v0-build-gate.test.mjs`: gesimuleerde ledger met scenario's voor twee callers, refresh, timeout, verloren claim, opslagfout, ongeldige identiteit, onbeschikbare database en ontbrekend upstream chat-ID. GitHub Actions run `35327281566`, job `105543169187`, geslaagd op commit `7819a90125c50696e660f0c5174f7d7e9a6a0927`. Dit bewijst uitsluitend unit-logica met mocks.
- `.github/workflows/v0-build-safety.yml`: PR-tests op Node 22.18 zonder secrets, database of v0 API.
- `docs/architecture/sql/001_v0_build_jobs.smoke.sql` is gecorrigeerd: controleert de daadwerkelijke unieke identiteit. Nog niet in Neon uitgevoerd. FORCE RLS zonder passende policy kan de gewone DB-rol blokkeren: niet uitschakelen om test te laten slagen.
- **Nieuw:** `app/api/regression/adrie/build-v0/route.ts` op de PR-branch vervangen door expliciete fail-closed HTTP 503 `V0_BUILD_SAFETY_GATE_CLOSED`. Oude handler is terug te halen uit Git-historie maar mag niet zonder geverifieerde sessie/approval/ledger teruggezet worden. Geen betaalde v0-aanroep via deze nieuwe PR-handler; bestaand gedeployed main-verkeer is hiermee NIET gewijzigd.
- **Nieuw:** `tests/v0-paid-route-closed.test.mjs` en extra CI-pad controleren dat de PR-route niet stilzwijgend weer upstream aanroept. Dit is een source-level safety test, geen live HTTP-/auth-/DB-integratietest. CI-resultaat van de commit met deze wijziging nog afzonderlijk controleren.

## Bevestigde databasevoorbereiding
- Neon Free Frankfurt en Vercel-project `lumivey` Preview secretvariabelen bestaan. Ruud heeft migratie 001 op Neon SQL Editor branch `lumivey-preview` uitgevoerd en met `to_regclass` de tabel bevestigd.
- Dit bewijst NIET dat Vercel Preview `DATABASE_URL` naar die exacte branch verwijst. Vercel-connector gaf bij projectread 403; er is geen runtime DB-verificatie gelukt. Geen wachtwoorden, hosts of connection strings delen.

## Niet gereed
- Ledgercontract niet gekoppeld aan Neon; PostgreSQL-driver, transactionele adapter en werkende autorisatie ontbreken.
- De PR-route is bewust uitgeschakeld: hierdoor bestaat in de PR GEEN werkende v0-generator; de originele, nog gedeployde `main`-route kan nog steeds onbeschermd bereikbaar zijn. Zonder merge/deploy mag geen live bescherming worden geclaimd.
- Exacte Vercel Preview branchbinding, DB-rol/RLS, duurzame Preview approval, rollback SQL-smoke en echte twee-verbindingen-concurrency ontbreken.
- Geen betaalde E2E, merge of productie-uitrol. CI is geen DB-/auth-testbewijs.

## Volgende taak
1. Controleer of de bestaande deployment de betaalde handler publiek exposeert, en zorg voor een veilige deploy/remediatie zodra goedgekeurd. Een draft PR alleen beschermt bestaande deployments niet.
2. Verifieer sessie/operatorauth en goedgekeurde finale Brief/asset-opslag server-side.
3. Verifieer de exacte runtime DB-branch privé zonder connection string of credentials terug te geven, en DB-rol/RLS. Geen nieuwe paid API-call.
4. Voeg DB-driver/lockfile en transactionele ledgeradapter toe, test twee verbindingen en refresh/timeout; vervang de 503 pas na al deze gates door de geautoriseerde ledger-route.
5. Private screenshotcache per owner/chat/exacte versie en volledige doorlooptijdmetingen; partial metrics blijven apart.

Het volledige bestaande `docs/active/CURRENT_STATE.md` is behouden; deze datumupdate staat in dit checkpoint in plaats van eerdere recoverygeschiedenis te vervangen.
