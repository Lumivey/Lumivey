# Guest Discovery hervatten — checkpoint 18 september 2026

Scope: uitsluitend draft PR #49 / `test/v0-api-visibility-20260917`. Geen Neon-mutatie, Vercel-variabelen, productie, login, public route, privileges of betaalde v0-call in deze stap.

## Gedaan

- `lib/lumivey/guest-dossier-access.ts`: kleine dependency-injected, fail-closed serverlogica om een aangevraagd dossier-id met de 256-bit gastcode, server-HMAC, status en vervaltijd te vergelijken. Geeft geen credential/digest of bestaan van een dossier prijs. Ontbrekende secret of opslagfout levert uitsluitend UNAVAILABLE op; ongeldige, verlopen, claimed of verkeerde codes DENIED. Een onjuist teruggegeven dossier-id of negatieve versie wordt afgewezen.
- `tests/guest-dossier-access.test.mjs`: twee onafhankelijke gesimuleerde gastdossiers A en B; eigen codes werken, A-code geeft B geen toegang; ontbrekend dossier, fout ID, expired/claimed en verkeerd gescopeerde loader zijn afgewezen; misconfiguratie en databasefout geven geen secrets prijs.
- `.github/workflows/v0-build-safety.yml` bevat nieuwe test. GitHub Actions run `35344120396`, unit job `105596595772`, completed SUCCESS op commit `5da0b8e`; shutdown run `35344120417`, job `105596595672`, completed SUCCESS. Dit zijn unit/static tests, NIET echte Neon-database- of A/B-test.

## Cruciale grenzen

De nieuwe functie is een voorbereidend applicatiecontract, **niet** een echte beveiligingsgrens of database-autorisatie: loader is geïnjecteerd, er is geen server-route/cookie, geen veilige LOGIN-applicatierol, geen gereviewde uitvoerbare SQL-routines, geen verleende functieprivileges en geen twee onafhankelijke verbindingen. Bij iedere latere write moeten token, status, TTL en `state_version` in dezelfde DB-transactie opnieuw geverifieerd worden. `neondb_owner` (BYPASSRLS) is uitsluitend voor beheer en nooit een runtimeverbinding. RLS FORCE met nul policies en nul applicatiegrants blijft intact. Geen toezegging dat klantdata al worden opgeslagen.

## Volgende beslispoort

Voor de echte Preview-A/B-test expliciet goedkeuren: uitsluitend op Neon Preview branch `br-green-lake-b2xh1tni` een nieuwe strikt beperkte database-LOGIN-rol en per-operatie streng geauditeerde EXECUTE-only routines/privileges instellen, inclusief veilige credential-handoff buiten GitHub/chat. Geen onbeperkte tabelrechten, geen eigenaarcredentials, geen standaard GUC als bewijs; review SECURITY DEFINER, zoekpad, PUBLIC revoke en RLS/BYPASS-beperkingen. Pas na toestemming en veilige uitvoeringsroute wijzigingen aan rollen/policies/grants doen. Daarna testen met twee echte verbindingen, verlopen/wisselende codes, CAS, account-claim en duurzame bestandsverwijdering; dan pas chat aansluiten. Discovery beslist wanneer Preview gereed is. Betaalde v0-routes blijven afgesloten.
