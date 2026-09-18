# Neon Preview — rol- en autorisatiecheckpoint

Peildatum: 18 september 2026. Scope: draft PR #49. Geen productie-DB, geen v0-call, geen wijziging van betaalde routes.

## Werkelijk geverifieerd op Neon

- Project `LUMIVEY_DB` (`odd-term-62838732`), Vercel-aangemaakte PR-branch `preview/test/v0-api-visibility-20260917` (`br-green-lake-b2xh1tni`), database `neondb`.
- Ledger `public.lumivey_v0_build_jobs` bestaat sinds afzonderlijk uitgevoerde migratie op deze PR-branch; RLS ENABLED + FORCED.
- Neon API toont op deze branch momenteel slechts de Postgres-rol `neondb_owner`.
- Read-only SQL als `neondb_owner` bewijst `rolbypassrls = true` en **0 policies**. FORCE RLS beveiligt niet tegen BYPASSRLS. De huidige verbinding mag niet als tenant-geïsoleerde applicatierol worden gebruikt. Er zijn geen klantrecords gelezen.
- De Neon-connectie via plugin is niet hetzelfde als de werkelijke Vercel `DATABASE_URL`: de runtime-host, geladen DB-rol en autorisatie zijn nog niet onafhankelijk vanuit de Vercel-runtime bewezen.

## Codewijziging in deze stap

`lib/lumivey/neon-preview-identity-core.ts` retourneert voortaan `BLOCKED_PRIVILEGED_DB_ROLE` voor `rolbypassrls`, superuser of onbekende rol-eigenschappen, en `BLOCKED_NO_RLS_POLICY` bij 0/ongeldig aantal policies. `PASS_PRELIMINARY` vergt een niet-geprivilegieerde rol en minimaal één policy naast de bestaande host-/ledger-/FORCE-RLS-checks. Dit is nog steeds geen bewijs dat de policy werkelijk eigenaarsscheiding afdwingt. Geïsoleerde mocktests zijn uitgebreid, GitHub Actions `v0 build safety` run 35334030560: success. De databasequery is nog niet vanuit Vercel uitgevoerd.

## Minimale veilige uitvoering (nog NIET aangebracht)

1. Kies expliciet en documenteer sessie-/operator-authenticatie. `owner_id` wordt uitsluitend server-side afgeleid van een geverifieerde identiteit én toegangsrecht tot de goedgekeurde Preview/Brief/assets; nooit uit browser-JSON of een vrij invulbare header.
2. Maak in **alleen deze PR Preview-branch** een afzonderlijke LOGIN-applicatierol zonder SUPERUSER/BYPASSRLS/CREATEROLE/CREATEDB, niet de tabel- of database-eigenaar. Verleen uitsluitend USAGE op `public` en SELECT/INSERT/UPDATE op de ledger; geen DELETE, TRUNCATE, ALTER, schema ownership of grant options. Verstrek de credentials alleen via beheerde server-only Preview-secrets, niet via GitHub/chat/logs. De bestaande `DATABASE_URL` mag niet stilzwijgend overschreven worden voordat de integratie gecontroleerd is.
3. Een audited eigenaarspolicy kan transaction-scoped `current_setting('app.verified_owner_id', true)` gebruiken, uitsluitend na verified server-auth en `SET LOCAL` in **dezelfde database-transactie** als de DML; bescherm SELECT/UPDATE USING en INSERT/UPDATE WITH CHECK. Bij ontbrekende ownercontext altijd DENY. Een app-role kan sessieparameters zelf zetten: dit is geen zelfstandige identiteit, dus server-auth en uitsluitend server-side DB toegang blijven verplicht. Geen sessie-`SET` in een pooled connection; geen hergebruik van een vorige eigenaar.
4. Verifieer rol en policies via metadata en voer vervolgens autorisatietests uit onder de echte app-rol: zonder ownercontext geen rijen/INSERT; eigenaar A kan A reserveren/lezen/claimen; A kan B niet lezen/updaten of B als owner inserten; afwezig/misvormde identiteit faalt dicht. Gebruik dummydata met ROLLBACK en controleer dat er na test geen rijen achterblijven. Test daarnaast twee onafhankelijke DB-connecties op één reservation/claim en timeout -> UNCERTAIN zonder tweede upstream request.
5. De juiste endpoint-host moet onafhankelijk bekend zijn en in de daadwerkelijk geladen server-only Vercel Preview-config worden vergeleken; alleen Neon branchmetadata of aanwezige tabel is daarvoor geen volledige runtimecontrole. Geen publiek diagnose-endpoint.

## Stopregels

PR #49 blijft draft/ongemerged; zeven gevonden betaalde v0-mutatie-ingangen blijven afgesloten op `main`. Geen betaalde route openen of v0 aanroepen vóór: geverifieerde Preview-branch + beperkte rol + bewezen owner-policy + geautoriseerde sessie + echte concurrerende DB-test. `PASS_PRELIMINARY` is nooit een vrijgave voor productie of betaalde generatie.

## Volgende concrete bouwopgave

Auth/owner-bron in bestaande Next.js-code vaststellen; daarna een aparte minimaal bevoegde rol en policy als reviewbare SQL-migratie voorbereiden en op uitsluitend de PR Preview-branch met echte rol testen. Geen credentials in de repository of terugkoppeling.
