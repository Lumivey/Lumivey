# Checkpoint — v0 statusfase en veilige vervolgontwikkeling

Datum: 18 september 2026. Scope: PR #49, testbranch; geen wijziging op `main` of nieuwe v0-generatie.

## Gebouwd

- `app/api/regression/adrie/build-status/route.ts` voegt bij dezelfde bestaande read-only v1 GET metadata toe: `lookupStartedAt`, `checkedAt`, `versionCreatedAt`, `versionUpdatedAt`, `versionId`, `statusLookupMs`, `generationMs`. Geen extra upstream verzoek, persoonsgegevens, prompt, screenshots of API-sleutels in de nieuwe logvelden.
- Ongeldige of ontbrekende upstream-versietijden worden expliciet `null`; `updatedAt - createdAt` blijft uitsluitend een versie-indicatie, niet de volledige Lumivey-doorlooptijd.
- Bij upstream HTTP-fout wordt het response-body niet meer geparsed of teruggegeven. Errorlogs bevatten alleen status/ID/timing; bij exceptions alleen errornaam. De bestaande API-response en statussemantiek blijven intact, met aanvullende velden.
- De bestaande `visual-reference`-faselogging uit deze PR maakt koppeling met statusregels mogelijk bij een volgende gecontroleerde run.

## Niet gebouwd of bewezen

Geen duurzame idempotency, geen render-cache, geen account-/owner-autorisatie, geen end-to-end-meting en geen live API-aanroep. Een succesvolle Vercel-build valideert de codebuild, niet de productiegedragingen. De gerapporteerde circa 10 minuten van AssetPouwer kan nog niet met één complete trace verklaard worden.

## Harde afhankelijkheid voor de volgende codewijziging

De huidige `build-v0` POST maakt direct een betaalde v0-chat; in de bestaande repository is geen transactionele gedeelde database of sessie/eigenaar-binding voor een betrouwbare idempotente reserveeractie aangetoond. Geen in-memory Map, browser-flag, IndexedDB of gewone Blob-write als garantie tegen dubbele kosten presenteren: die zijn niet atomair over Vercel-instanties en retries. Selecteer eerst een transactionele beheerde opslag en account-/operatorauth die bij de bestaande architectuur past. Voorzie unieke sleutel op eigenaar + goedgekeurde Preview-ID + definitieve Brief/asset-revisie, atomische reserveer-/statusovergangen, herstelpad bij onzekere upstream-POST (geen blinde retry), en alleen daarna de bestaande adapter onder deze gate aanroepen. Bewijs met gelijktijdigheidstest en refresh/retrytest.

Render-hergebruik daarna pas per eigenaar + chat-ID + **exacte versie-ID** met private opslag, vervaldatum, geldige screenshotcontrole en hergebruik door UI en QA. Geen publieke URL of cache op uitsluitend chat-ID. Veranderde versie of onvoldoende renderbewijs blokkeert QA/publicatie.

Vervolgvolgorde: CI voor deze commit → transactie/auth-voorziening kiezen en implementeren → veilige dubbele-create-test → versiegebonden capture reuse → één gecontroleerde complete proef → andere ondernemers → Michael-regressie. Plan v0.4, NON_NEGOTIABLES en PREVIEW_WOW_RETENTION blijven bindend.
