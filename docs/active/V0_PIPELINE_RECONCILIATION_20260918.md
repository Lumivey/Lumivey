# v0 API-lus — feitelijke reconciliatie (18 september 2026)

Status: read-only code-audit, concept-PR #49. Aanvulling op Plan v0.4, niet de projectwaarheid van `main`. Geen nieuwe v0-generatie en geen live API-test verricht.

## Wat al bestaat op `main` (niet opnieuw bouwen)

| Stap | Bestaande implementatie | Grenzen |
| --- | --- | --- |
| Start | `lib/lumivey/v0-adapter.ts`: `POST /v1/chats`, async, private. `app/api/regression/adrie/build-v0/route.ts` gebruikt de adapter. | `handoffTotalMs` telt signatuurbereiding en indienen, NIET volledige generatietijd. POST heeft geen aantoonbaar duurzaam idempotency-slot. |
| Status | `app/api/regression/adrie/build-status/route.ts`: `GET /v1/chats/{chatId}`, status, versie, server-versie-tijd, lookup-tijd, preview-URL. | Versie-tijd `updatedAt - createdAt` is een indicatie, niet totaal van intake tot QA; geen persistente per-run-tijdlijn. |
| Polling-UI | `app/regression/adrie/build-status/page.tsx`: bestaande chat-ID, 5s-polling zolang pending/unknown, versie-ID en timing zichtbaar. | Bij fout wordt niet opnieuw gepolld; pagina heeft chat-ID handmatig nodig; geen universele run-UI. |
| Desktop | `app/api/regression/adrie/build-screenshot/route.ts`: officiële screenshot via v0 version endpoint, type/grootte/host gecontroleerd. | Een extra API- en image-fetch; alleen voltooid chat; bewijs van visuele retentie is dit niet. |
| Mobiel | `app/api/regression/adrie/mobile-screenshot/route.ts`: echte 390px Firecrawl-render met inhoudsvalidatie. | Kost Firecrawl-credits en extra tijd. UI vraagt screenshot automatisch via image-src en QA vraagt opnieuw, zonder bewezen gedeelde cache. Geen blanco afbeelding als PASS toelaten. |
| Onafhankelijke QA | `app/api/regression/adrie/qa-existing/route.ts`: desktop+mobiel, version check vóór/na capture, gelockte PreviewSignature, onafhankelijke QA. `app/regression/adrie/build-status/page.tsx` kan QA starten. | QA blijft correct geblokkeerd zonder goedkeuringsdossier; is nog Adrie-specifiek, niet generiek. Screenshots worden opnieuw opgehaald bij QA. |
| Bewijsopslag | `lib/lumivey/build-snapshot.ts`: browser-lokale IndexedDB per chatId met goedgekeurde Preview, signatuur, brief en QA. | Geen serverdurable opslag; niet overdraagbaar naar andere browser/medewerker; geen idempotency-lock. |

## Nieuwe waarneming van Ruud: Vercel Logs van 16 september

De screenshot laat herhaalde `GET /api/regression/adrie/build-status` zien, een `completed`-melding met `generationMs` rond 62,5 seconden, een desktop screenshot-fetch rond 16,3 seconden en een mobiele rond 6,9 seconden. Ook staat er afzonderlijk een `502` bij `POST /api/regression/adrie/visual-reference` met timeout. Dit is een handmatige lezing uit een aangeleverde screenshot, GEEN complete verifieerbare trace en geen bewijs dat de timeout de volledige tien minuten verklaart. De statuslog met `completed` en beide screenshots bewijzen dat status/screenshotroutes in die run daadwerkelijk gebruikt zijn; er is geen nieuwe statusfunctie nodig. De 502 hoort bij een andere voorbereidingsroute en moet afzonderlijk onderzocht worden.

## Reconciliatie met PR #49

De PR bevat optionele CLI-inspectors voor bestaande v1- en nieuwe v2-chats. De v1-CLI is een veilig read-only diagnosehulpmiddel, NIET een nieuw product-onderdeel of vervanging voor de reeds werkende v1-route en UI. De v2-CLI mag niet worden gebruikt voor oude v1-chat-ID's. Geen v2-migratie op basis van deze audit.

## Exacte volgende uitvoeringsopgave, in deze volgorde

1. **Meet- en hergebruikaudit zonder betaalde build**: herleid in bestaande run waar `t0` (start), signatuur, assetcompressie, `/api/uploads/v0-assets`, visuele referentie, create-response, eerste pending, completed, desktop, mobiel, QA vallen. Leg alleen metadata en fase-tijden vast; geen tokens, URLs met geheimen, persoonsgegevens of beelden. Bij ontbrekende timestamps noteer `onbekend`; niet reconstrueren uit aannames.
2. **Geen dubbele betaalde creatie**: idempotente start per goedgekeurde Preview-ID + brief/assetversie vóór een nieuwe betaalde E2E-run, duurzame opslag en veilige eigenaarsbinding. Een browserrefresh of retry mag geen tweede `POST /v1/chats` triggeren. Eerst testbaar maken.
3. **Render éénmaal per versie**: bewijs gecontroleerde (toegangsgebonden) reuse van desktop/mobiele captures voor UI en QA, zodat de huidige afzonderlijke UI- en QA-aanroepen niet telkens Firecrawl en download opnieuw doen. Verifieer privacy, freshness en versie-binding; gebruik niet onveilig publieke screenshot-URL's.
4. **Status/QA generiek**: verplaats de gevalideerde Adrie-specifieke workflow pas ná regressie naar een case-onafhankelijke Lumivey-testlus. Behoud approval/PreviewSignature/version guards; geen QA-PASS zonder renders.
5. **Eén gemeten gecontroleerde API-proef**, pas na punten 1–3: totaaltijd, fase-tijden, Firecrawl/v0/OpenAI-kosten, foutlocaties, menselijke minuten en Preview-WoW-retentie. Daarna andere ondernemers en Michael regressie.

## Open veiligheidscontrole vóór klantdata

In de gelezen regression-GET-handlers is geen expliciete sessie-/eigenaarstoets zichtbaar; toegang berust zichtbaar op een chat-ID en server-API-key. Vóór generieke klantinzet auth en owner-binding controleren, niet aannemen dat een onraadbaar chat-ID voldoende toegangscontrole is. De huidige browser-IndexedDB is alleen testbewijs, geen accountdossier. Geen live-publicatie vóór toestemming en aparte eindgate.

## Correcte voortgangstaal

Reeds aanwezig en op 16 september zichtbaar gebruikt: v1-status, polling, desktop, mobiel. Aanwezig in code maar niet als algemeen productieproces bewezen: Adrie-variant onafhankelijke QA. Nog open: totale trace, hergebruik van captures, duurzame opslag, anti-dubbele-build, generieke beveiligde workflow, reproduceerbare WoW. Vercel-geslaagde build of mocktests zijn geen bewijs van een volledig geslaagde end-to-end klantreis.
