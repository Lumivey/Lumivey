# v0 API-lus — feitelijke reconciliatie (18 september 2026)

Status: audit en kleine diagnosereparatie in concept-PR #49. Geen nieuwe v0-generatie of live API-proef uitgevoerd. Plan v0.4 blijft leidend.

## Al bestaand op main (niet opnieuw bouwen)

- `lib/lumivey/v0-adapter.ts`: async `POST /v1/chats`; handoff-tijd meet niet v0-generatie/QA.
- `app/api/regression/adrie/build-status/route.ts` + `app/regression/adrie/build-status/page.tsx`: bestaande v1-status, versie, tijden en polling om de vijf seconden.
- `app/api/regression/adrie/build-screenshot/route.ts`: officiële desktop-screenshot, gecontroleerd via v0-versie.
- `app/api/regression/adrie/mobile-screenshot/route.ts`: echte 390px Firecrawl-render, met inhoudscheck; kost extra tijd en credits.
- `app/api/regression/adrie/qa-existing/route.ts`: bestaande onafhankelijke QA met goedgekeurde Preview/signatuur en version check vóór/na capture. Niet generiek productiebewezen.
- `lib/lumivey/build-snapshot.ts`: goedkeuringsdossier alleen in browser-IndexedDB, niet als duurzaam accountdossier.

## Wat logscherm van Ruud liet zien

16 september: Adrie-build pending → completed, gerapporteerde v0-versietijd circa 62,5 s, desktop-ophalen circa 16,3 s, mobiel-ophalen circa 6,9 s. Apart: 502/timeout bij `POST /api/regression/adrie/visual-reference`. Dit is screenshotbewijs van deelstappen, geen end-to-end-trace; tien minuten zijn nog niet verklaard.

## Concrete codewijziging in deze PR

`app/api/regression/adrie/visual-reference/route.ts` is in de PR beperkt instrumenteerd. De route gebruikt nu fasegerichte, inhoudsvrije logregels voor beeldverificatie, bestaande chat ophalen en correctiebericht indienen. Bij een onbevestigde verzendpoging blijft de uitkomst expliciet onzeker; nooit blind opnieuw versturen. De upstream-timeouts konden in het oude maximale scenario circa 15 + 20 + 90 = 125 seconden innemen, langer dan de ingestelde function maxDuration van 120 seconden. De functiegrens is in de PR naar 180 seconden gebracht, uitsluitend om fouten binnen de route te kunnen afhandelen, niet als snelheidswinst. Verifieer Vercel-plan/runtime-ondersteuning en echte resultaten via preview-CI en een afzonderlijk toegestane test voordat merge of productiegebruik volgt.

De PR bevat daarnaast optionele read-only v1/v2-CLI-inspectors. Deze vervangen de al bestaande statusroute niet. Geen v2-migratie.

## Openstaande gaten en volgorde

1. Uit bestaande logdata totale fasetijd reconstrueren: start, signatuur, upload, create, pending, completed, desktop, mobiel, QA. Ontbrekende tijden blijven `onbekend`.
2. Duurzame idempotency en eigenaarstoets vóór volgende betaalde E2E-run. Browser-refresh/retry mag niet dubbel `POST /v1/chats` veroorzaken.
3. Desktop/mobiel capturen per versie en toegangsgebonden hergebruiken; UI en QA vragen momenteel afzonderlijke beelden op.
4. Adrie-specifieke QA generaliseren met Preview/signatuur/version-gates intact.
5. Eén gecontroleerde totale proef, daarna verschillende ondernemers en Michael-regressie.

## Veiligheidsgrenzen

In de gelezen regression-GET-handlers geen expliciete auth-/owner-check aangetroffen. Browser-IndexedDB is geen account-dossier. Geen klantdata via onbeveiligde generieke routes, geen publieke site zonder eigenaarsgoedkeuring. De nieuwe fase-logs bevatten geen beeld-URL's, prompts, persoonsgegevens of API-secrets. Diagnostische code op PR-branch is geen bewijs dat de oude timeout is opgelost. PR #49 blijft draft totdat tests/CI en inhoudelijke review zijn afgerond.
