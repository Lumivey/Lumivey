# Checkpoint — eenmalige v0-aanroep en volledige mutatieroute-audit

Datum: 18 september 2026. Alleen concept-PR #49. Geen merge, geen nieuwe v0-call, geen productie-uitrol.

## Bewezen voorbereiding
- `lib/lumivey/v0-build-gate.ts`: driver-onafhankelijke one-shot orchestratie achter toekomstig transactioneel databasecontract. Een claim moet committeren vóór de upstream-POST; timeouts veroorzaken geen blinde retry. Dit is nog GEEN operationele bescherming.
- `tests/v0-build-gate.test.mjs`: unit-tests met gesimuleerde ledger, niet met echte PostgreSQL-concurrentie.
- `docs/architecture/sql/001_v0_build_jobs.sql`: Ruud voerde migratie op Neon SQL Editor branch `lumivey-preview` uit; `to_regclass` bevestigde tabel. Vercel Preview runtime-branchbinding NIET geverifieerd; FORCE RLS zonder policy kan normale rollen blokkeren. SQL-smoke is nog niet uitgevoerd.

## Belangrijke ontdekking: vier v0-mutatie-ingangen
Audit van `app/api` vond **vier** routes die de v0 API konden muteren, niet alleen Adrie:
1. `app/api/build/v0/route.ts`: algemene onbeveiligde POST met client-Website Brief -> `createV0Build`.
2. `app/api/regression/adrie/build-v0/route.ts`: POST met client-Preview/evaluatie -> `createV0Build`.
3. `app/api/regression/michael/build-clean/route.ts`: POST met betaalde OpenAI-beeldgeneratie en `createV0Build`.
4. `app/api/regression/michael/correct-latest-v0/route.ts`: **GET met neveneffect** dat v0-chats doorzocht en een betaalde correctie via POST verstuurde; zonder geverifieerde eigenaar of exacte chat/versie.

Alle vier zijn op de **conceptbranch** vervangen door een fail-closed HTTP 503 met `V0_BUILD_SAFETY_GATE_CLOSED` en `Cache-Control: no-store`. De GET-correctieroute heeft geen side effects meer. Bestaande referentieimplementaties zijn via Git-historie herstelbaar maar mogen niet ongewijzigd terug.

`tests/v0-paid-route-closed.test.mjs` controleert de vier handlers op source-niveau, inclusief afwezigheid van bestaande v0- of OpenAI-imports en de GET zonder fetch/POST-alias. De CI-workflow trigger is voor alle vier routepaden ingesteld. GitHub Actions run `35328308906`, job `105546494749`: **success**, inclusief fingerprint-, one-shot- en vier route-tests. Dit bewijst niet dat de bestaande deployment beschermd is en ook geen DB-/auth-integratie.

## Kritiek/open
- De oude `main`/bestaande deployments zijn NIET gewijzigd. Daar kunnen betaalde routes nog bereikbaar zijn. Concept-PR samenvoegen beïnvloedt werking en vraagt gecontroleerde uitrol na expliciete afweging; niet stilzwijgend claimen dat de live site veilig is.
- Andere betaalde image/Preview-regressieroutes zijn geen v0-build maar vragen een aparte autorisatie- en kosten-audit. De `production-assets` Michael route genereert betaalde afbeeldingen; die is in deze v0-gerichte wijziging niet uitgeschakeld.
- Geen geverifieerde operator-/accountauth, duurzame Preview-goedkeuring, server-only PostgreSQL-driver/adapter, RLS/DB-rol of runtime-branchcheck. De Vercel-connector kreeg 403.
- SQL smoke, echte gelijktijdige verbindingen, complete E2E, versiegebonden screenshotcache en onafhankelijke website-QA ontbreken. Geen v0-credits ingezet.

## Exact vervolg
1. Bepaal de impact van veilig uitschakelen van de vier routes op bestaande gebruikers/testflows, en zet een gecontroleerde deployment/remediatie in gang; draft PR alleen is geen bescherming van reeds uitgerolde versies.
2. Verifieer operator-/accountauth, duurzame finale Preview-approval en de DB branch/rol/RLS zonder credentials openbaar te maken.
3. Voeg server-only driver + lockfile + transactionele Neon-ledgeradapter toe en test op echte parallelle connecties; pas daarna één geautoriseerd build-POST-pad openzetten en regressieroutes uitsluitend via datzelfde pad laten werken.
4. Voor correcties uitsluitend expliciete geautoriseerde POST op vooraf vastgelegde eigenaar/chat/versie, nooit muterende GET of 'latest matching chat'.

Historisch `docs/active/CURRENT_STATE.md` volledig behouden; dit bestand is het nieuwste delta-checkpoint.
