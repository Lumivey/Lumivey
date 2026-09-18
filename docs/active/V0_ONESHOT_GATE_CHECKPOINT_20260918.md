# Checkpoint — v0 one-shot veiligheid en volledige route-inventaris

Datum: 18 september 2026. Alleen draft PR #49; niet gemerged, geen nieuwe v0-call, geen productie-uitrol.

## Norm en bewezen voorbereiding
- Plan v0.4 en de bestaande Golden Path blijven leidend. Dit werk beveiligt betaalde websitegeneratie, niet de creatieve Preview-kwaliteit.
- `lib/lumivey/v0-build-identity.ts` en `v0-build-gate.ts` bevatten een stabiele revisie-identiteit en een eenmalige-submit-orkestratie achter een nog te implementeren duurzaam databasecontract. GitHub-unit-tests met mock-ledger zijn geslaagd; dit is géén werkende databasebescherming.
- Ruud voerde `docs/architecture/sql/001_v0_build_jobs.sql` uit op Neon SQL Editor branch `lumivey-preview`; `to_regclass` bevestigde de tabel. De Vercel Preview `DATABASE_URL`-branch is NIET geverifieerd. FORCE RLS zonder passende policy kan schrijven blokkeren; geen RLS uitschakelen om tests groen te maken.

## Veiligheidsaudit — vijf muterende v0-routes op de draft branch afgesloten
1. `app/api/build/v0/route.ts`: algemene POST -> betaalde `createV0Build`.
2. `app/api/regression/adrie/build-v0/route.ts`: clientdata/approval -> betaalde `createV0Build`.
3. `app/api/regression/michael/build-clean/route.ts`: betaalde OpenAI-beeldcalls + v0-build.
4. `app/api/regression/michael/correct-latest-v0/route.ts`: GET met side effect; zocht recente chat en deed POST van betaalde correctie.
5. `app/api/regression/adrie/visual-reference/route.ts`: POST van betaalde v0-correctie, slechts same-origin/message-checks; geen geverifieerde owner of transactionele claim. De eerdere 'one-shot' marker is niet concurrerend veilig.

Alle vijf handlers antwoorden op de **PR-branch** HTTP 503, `V0_BUILD_SAFETY_GATE_CLOSED`, no-store; geen fetch, betaalde v0-call of ad-hoc bypass. Oude handlers blijven in Git-historie en mogen niet ongewijzigd worden teruggezet.

## Regressiecontrole
- `tests/v0-paid-route-closed.test.mjs` controleert nu alle vijf expliciete handlers.
- `tests/v0-route-inventory.test.mjs` scant recursief alle `app/api/**/route.*` op directe v0-adaptercalls of v0-HTTP-mutaties. Read-only v0-status/screenshot-GETs worden niet geblokkeerd; Firecrawl-POST in de mobiele screenshotroute is géén v0-mutatie.
- De eerste bredere scan faalde terecht: zes v0-API-gebruikende routes kwamen aan het licht. Audit onderscheidde read-only diagnostiek van `visual-reference`, die daadwerkelijk een betaalde v0-POST uitvoerde. Die vijfde route is afgesloten; scanregel aangepast om read-only HTTP GET niet als mutatie te classificeren.
- GitHub Actions run `35328809479`, unit-job `105548099513`: **success** na deze aanpassing. Source-level scan heeft beperkingen (dynamische dispatch, indirecte helpers); geen bewezen volledige security-audit of live-integratietest.

## Kritieke risico's en nog open
- PR is draft/niet gemerged. Bestaande `main` en reeds uitgebrachte deployments zijn niet aangepast en kunnen nog onbeveiligde betaalde routes bevatten. Een gecontroleerde remediatie-/deploybeslissing is nodig; blind mergen zou de huidige regressiebuilds stoppen.
- Andere AI-/beeld-/Firecrawl-kostenroutes vallen niet automatisch onder deze v0-mutatiescan en verdienen afzonderlijke toegangs-/budgetcontrole.
- Geen geverifieerde operator/account-auth, duurzame goedkeuring van Preview/Brief/assets, runtime Neon-branchbewijs, veilige database service-rol/RLS-policy, PostgreSQL-driver/ledgeradapter, echte multi-connection concurrency of SQL-smoke. Vercel connector gaf 403; niet vragen om credentials/connection strings.
- Geen nieuwe v0-generaties, geen merge/productiedeploy, geen bewezen bescherming op live omgeving, geen volledige E2E-meting of generieke Preview→site-QA.

## Exact vervolg
1. Controleren welke deployment publiek actief is; gecontroleerde live-remediatie afstemmen zonder ongewenste onderbreking van testflows.
2. Server-side operator-auth en persistente owner/approval-state vaststellen; nooit owner of `humanApproved` uit JSON als bewijs gebruiken.
3. Privé runtime branch-identiteit en DB rol/RLS veilig verifiëren. Vervolgens server-only databaseclient, transactionele ledgeradapter en echte twee-verbindingen-test.
4. Alleen één geautoriseerde v0-build-POST na duurzame committed claim openen; correcties via expliciete owner/chat/version-bound POST, nooit muterende GET of latest-chat-tekstsearch.

`docs/active/CURRENT_STATE.md` is ongewijzigd bewaard; dit bestand is het actuele delta-checkpoint.
