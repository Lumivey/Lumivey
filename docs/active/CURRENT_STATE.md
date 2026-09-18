# Lumivey — CURRENT STATE

Datum: 2026-09-18
Status: recovery/reconciliation; v0 eenmalige-build bescherming in concept-PR #49, nog niet operationeel.

## Inhoudelijke norm
- `Lumivey_Het_Plan_v0_4_leesbaar.docx` blijft leidend, zonder stille koerswijziging.
- Michael = Golden Path voor de complete keten. Adrie = acceptatie-/datapadtest; VoetGemak = broninterpretatie.
- Persoonlijke en professionele herkenning, echte assets, bronvolledigheid, Preview-signatuur, correcte feiten en responsief eindresultaat blijven verplicht; zie `docs/active/NON_NEGOTIABLES.md` en `docs/active/PREVIEW_WOW_RETENTION.md`.
- Discovery/Preview werkt in referenties, maar reproduceerbaarheid over ondernemers, volledige v0-Preview-retentie en generieke zelfstandige website-QA zijn niet aangetoond.

## Bewezen uit eerdere bouwlijn
- Michael bewijst menselijk Discovery → herkenbare Preview → sterke handmatige v0-overdracht; het is geen bewijs van volledige geautomatiseerde generieke productie.
- Bronbeelden en contactsignalen zijn in het datapad verbeterd; multi-upload, Adrie Run 2, visuele Preview-evaluator en website/status-/screenshot-routes bestaan.
- Adrie Preview met echte beelden was voldoende voor de v0-gate, maar latere websites behielden de Preview niet aantoonbaar >85%; geen generieke productieclaim.

## Nieuw checkpoint 18 september — PR #49
- De bestaande v0-statusroute registreert aanvullende metadata- en versietijden zonder extra upstream-aanroepen. Een volledige E2E-doorlooptijd is nog niet gemeten.
- `docs/architecture/sql/001_v0_build_jobs.sql` definieert een transactionele jobledger met unieke buildidentiteit en FORCE RLS. Ruud heeft migratie 001 in Neon Free Frankfurt op de handmatig geselecteerde `lumivey-preview` branch uitgevoerd; SQL Editor gaf vier succesvolle statements en `to_regclass` bevestigde de tabel.
- Vercel-project `lumivey` heeft Preview-geheimen waaronder `DATABASE_URL`. Dat bewijst NIET dat de Vercel runtime naar `lumivey-preview` wijst; exacte verbinding nog verifiëren zonder credentials openbaar te maken.
- `lib/lumivey/v0-build-identity.ts` definieert stabiele hashes voor definitieve Brief/asset-revisie en controleert PreviewSignature-ID.
- `lib/lumivey/v0-build-gate.ts` implementeert een driver-onafhankelijke eenmalige-submit-orchestratie met een durable-ledger-contract. De testledger is in-memory uitsluitend als unit-testmock; niet als productieopslag.
- `.github/workflows/v0-build-safety.yml` is toegevoegd. GitHub Actions run `35326640353`, job `105541112112`, unit-tests geslaagd (Node 22.18, geen secrets/DB/v0). Dit is geen bewijs van echte DB-concurrentie.

## Kritieke open punten
- Huidige `app/api/regression/adrie/build-v0/route.ts` roept nog rechtstreeks de betaalde v0 API aan; de gate is NIET aangesloten. Geen dubbele-kosten-garantie.
- Geen geverifieerde server-side eigenaar/operator-auth, duurzame goedkeuringsopslag, database-driver, passende DB-rol/RLS-policy of runtime-branchcheck.
- SQL smoke + twee sessies parallel zijn niet op echte DB uitgevoerd. Geen volledige gemeten E2E, geen screenshotcache eigenaar/chat/exacte versie, geen generieke website-QA, geen merge van PR #49 of productie-uitrol.

## Exacte volgende taak
1. Bepaal de al aanwezige authenticatie/approval-state of implementeer klein server-only operatorpad zonder identiteit uit HTTP-body te vertrouwen.
2. Verifieer Vercel Preview -> exacte Neon `lumivey-preview` branch en database-role/RLS op server zonder secretwaarden te loggen.
3. Voeg geteste DB-driver/lockfile en transactionele ledgeradapter toe; test twee onafhankelijke verbindingen, refresh en onzekere upstreamrespons.
4. Sluit pas dan betaalde buildroute fail-closed aan op `submitV0Once`; bestaande builds nooit blind retriggeren.
5. Daarna versiegebonden private screenshots, volledige kwaliteit/meting op één gecontroleerde case, andere ondernemers en Michael-regressie.

Referentie: `docs/active/V0_ONESHOT_GATE_CHECKPOINT_20260918.md`; PR #49 blijft draft en onmerged.
