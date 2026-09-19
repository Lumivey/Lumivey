# Checkpoint — v0 one-shot veiligheid en route-inventaris

Datum: 18 september 2026. Alleen draft PR #49, niet gemerged, geen nieuwe v0-call en geen productie-uitrol.

## Norm en bewezen voorbereiding
- Plan v0.4 en Michael Golden Path blijven leidend. Dit werk beveiligt betaalde websitegeneratie, niet de creatieve Preview-kwaliteit.
- `lib/lumivey/v0-build-identity.ts` en `v0-build-gate.ts`: stabiele revisie-identiteit en one-shot orchestratie achter een toekomstig transactioneel databasecontract. Unit-tests gebruiken mock-ledger; geen operationele databasebescherming.
- Ruud voerde `docs/architecture/sql/001_v0_build_jobs.sql` uit op Neon SQL Editor branch `lumivey-preview`; `to_regclass` bevestigde de tabel. Vercel Preview `DATABASE_URL`-branch is niet geverifieerd. FORCE RLS zonder passende policy kan normale rollen blokkeren. Geen RLS uitschakelen om een test groen te krijgen.

## Veiligheidsaudit — zeven v0-mutatie-ingangen op draft branch afgesloten
1. `app/api/build/v0/route.ts`: algemene POST → betaalde create.
2. `app/api/build/v0/correct/route.ts`: algemene POST accepteerde caller-chat-ID en vrije correctietekst → betaalde correctie via adapter.
3. `app/api/regression/adrie/build-v0/route.ts`: clientdata/approval → betaalde create.
4. `app/api/regression/adrie/correct-existing/route.ts`: same-origin + client-versie → betaalde correctie via adapter, geen eigenaar of concurrency-claim.
5. `app/api/regression/adrie/visual-reference/route.ts`: POST van betaalde correctie; same-origin/message-checks zijn geen owner-auth of transactionele claim.
6. `app/api/regression/michael/build-clean/route.ts`: betaalde OpenAI-imagecalls en v0-create.
7. `app/api/regression/michael/correct-latest-v0/route.ts`: GET met betaalde mutatie en recent-chat-tekstsearch.

Alle zeven handlers antwoorden op de PR-branch HTTP 503 met `V0_BUILD_SAFETY_GATE_CLOSED` en `Cache-Control: no-store`. Oude implementaties zijn via Git-historie herstelbaar maar mogen niet zonder herontwerp terug.

## Regressiecontrole en bewijslast
- `tests/v0-paid-route-closed.test.mjs` controleert alle zeven handlers; `tests/v0-route-inventory.test.mjs` scant recursief `app/api` op directe betaalde v0-mutaties én bekende adapterhelpers, maar is nadrukkelijk een source-level tripwire, geen volledige security-audit.
- De uitbreiding van de scan ontdekte `correct-existing` en daarna `build/v0/correct` die beide buiten de eerdere vijf vielen. Het CI-resultaat was eerst rood en is na beide route-afsluitingen groen: GitHub Actions run `35329971535`, job `105551817837`, success op commit `947281c7b0b01fec8b90d4603fd8cb63ed321d4b` vóór deze documentatiecommit.
- V0 GET/status/screenshot-routes worden niet als betaalde v0-mutaties gezien; Firecrawl/beeld- en andere AI-kostenroutes vallen buiten deze specifieke v0-test en blijven een afzonderlijke kosten-/toegangscontrole.

## Kritieke risico's en exact vervolg
- Draft PR is niet gemerged: bestaande `main`/deployments kunnen alle oude onbeschermde betaalde endpoints nog bevatten. Alleen repo-wijzigingen zijn geen live remediatie. Een merge zou regressie-generaties stoppen; deployment-impact en toestemming/rollout moeten eerst worden vastgesteld.
- Vercel-connector leverde 403; `list_teams` leverde geen teams op. Geen actieve deployment- of exacte runtime DB-branchverificatie mogelijk vanuit deze connector. Niet naar geheimen of connection strings vragen.
- Geen bewezen server-side operator-/owner-auth, persistente goedkeuring van exacte Preview/Brief/assetrevisie, juiste runtime Neon-branch en veilige rol/RLS, PostgreSQL-driver/adapter, SQL-smoke of echte twee-connecties-concurrencytest. Geen volledige E2E of generieke Preview→site-QA.
- Eerst deployment-/remediatie-impact bepalen, dan auth + durable approval en branch/RLS vaststellen, daarna één transactionele geautoriseerde build-POST en version-bound correcties veilig testen. Geen muterende GET of laatstgevonden chat.

Historisch `docs/active/CURRENT_STATE.md` volledig behouden; dit bestand is de actuele delta.
