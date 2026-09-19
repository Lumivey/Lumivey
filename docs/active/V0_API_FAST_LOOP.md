# v0 API — snelle, controleerbare Preview → Website-lus

Datum: 17 september 2026. Status: voorbereid, niet productiebewezen. Aanvulling op Plan v0.4, CURRENT_STATE, BUILD_METHOD en PREVIEW_WOW_RETENTION; geen nieuw productonderdeel.

## Besluit en doel

Ruud kiest v0 als primaire generator op basis van huidige kosten en bestaande OpenAI/Vercel/v0-integratie. De generator is NIET vrijgegeven op eindkwaliteit: de eerste AssetPouwer-site mist nog wezenlijke WoW-retentie (<80% is Ruuds menselijke inschatting, geen automatische meting). De Preview is een ontwerpbelo​fte. Niet opnieuw Lovable onderzoeken in dit werkspoor.

De handmatige AssetPouwer-test duurde volgens Ruud bijna 10 minuten; Michael/De Hippe Knip minder dan 2 minuten. Dit zijn gebruikerswaarnemingen, geen gemeten API-fasen. Niet poneren dat v0 zelf 10 minuten modeltijd gebruikte of dat een modelkeuze het oplost.

## Wat de huidige repo werkelijk doet

`lib/lumivey/v0-adapter.ts` roept `POST https://api.v0.dev/v1/chats` aan met `responseMode: async`, privéchat en uitsluitend goedgekeurde productie-assets. Het antwoord geeft chat-ID, eventuele preview-URL en drie timingwaarden terug: signatureMs, v0SubmissionMs en handoffTotalMs. Die laatste betreft alleen signatuur plus API-indiening. Er is nog geen gegarandeerde afhandeling tot eindstatus, render, screenshot of onafhankelijke QA. De goedgekeurde Preview-screenshot wordt bewust niet als productieasset meegestuurd om misbruik als vlakke afbeelding te voorkomen; de gelockte signatuur draagt het ontwerp over.

## API-feit / migratierisico

Officiële v0-v2-documentatie: `https://v0.app/docs/api/v2/guides/migrating-from-v1-to-v2`. v2 gebruikt `https://api.v0.dev/v2`; aparte create-async, GET-message, get-preview en get-files endpoints, inclusief creditsCost. V2 is op 17 september als beta gedocumenteerd en kan v1-chat-ID's niet lezen. De huidige v1-productieadapter niet stilzwijgend omzetten: eerst een geïsoleerde test op een nieuwe v2-chat, regressie van assets/privacy/kwaliteit en expliciete migratiebeslissing.

Read-only testhulpmiddel `scripts/v0-v2-inspect.mjs`: met een BESTAAND v2 chat-ID en assistant-message-ID leest het bericht en previewstatus, meldt finishReason, previewReady, eventueel creditsTotal en updatedAt; het verstuurt géén bouwopdracht. De code logt nooit token, signed preview-URL, klantbeelden, prompt of inhoud. Uitvoeren: `V0_API_KEY=... node scripts/v0-v2-inspect.mjs <chat-id> <message-id>`. Tests: `node --test scripts/v0-v2-inspect.test.mjs`. Geen bestaande v1-chat als input gebruiken.

## Fasemeting per run (pas implementeren op functionele v2- of v1-statusflow)

1. `t0`: goedgekeurde Preview-ID + ongewijzigde Website Brief opgeslagen.
2. `t1`: signatuur gereed / hergebruikt; `signatureMs`.
3. `t2`: upload/attachment prep; alleen toegestane, gebundelde images, daadwerkelijke byteomvang en failures zonder persoonsgegevens loggen.
4. `t3`: v0 createAsync ingediend; chat-ID, message-ID, HTTP-status; geen prompts in logs.
5. `t4`: eerste serverstatus/progress; vervolgens gecontroleerd poll-interval, geen herhaalde create-aanroepen bij pending.
6. `t5`: assistant finishReason; bij error stoppen, niet automatisch opnieuw betaald bouwen; creditsCost uit API waar beschikbaar.
7. `t6`: previewReady en eventuele preview token geldig, privé preview via serverproxy; géén URL of token openbaar in logging.
8. `t7`: desktop/mobiele render + onafhankelijke Preview-signatuur QA met bewijs per behoudpunt.

`totaleDoorlooptijd = t7 - t0`; rapporteer per fase en zet wachttijd van gebruikers apart. >2 minuten is onderzoekssignaal, NIET automatisch een time-out of kwaliteitsfout. Zichtbare progress voorkomt dat Ruud op een zwijgende chat hoeft te wachten; polling verandert de daadwerkelijke generatieduur niet.

## Voorwaarden voor snelheid én WoW

- Eén create per goedgekeurde Preview-ID en brief-fingerprint; een retry of browserrefresh mag geen tweede betaalde chat creëren. Durable idempotency/opslag vereist vóór productie; nog niet geïmplementeerd.
- Vóór create: preview-signatuur hergebruiken, assets en contactgegevens checken; geen herhaalde Firecrawl-/beeldgeneratieruns bij dezelfde ongewijzigde bronstate.
- Geen onnodige creatieve herinterpretatie door v0: exacte layoutmechaniek, woord-beeldkoppelingen en responsieve vertaling in bestaande Website Brief. Screenshot alleen als visuele referentie indien veilig ondersteund en technisch bewezen dat v0 deze niet als productieafbeelding gebruikt. Huidige harde regel van niet meesturen blijft van kracht totdat dit bewezen is.
- Harde QA-fout op verloren WoW-signatuur, verzonnen claims, afgesneden hoofd of verdwenen echte merkassets; geen score die de fout wegmiddelt.
- Een testomgeving met handmatige screenshotaanlevering is geen eindtoestand: preview en resultaten moeten vanuit Lumiveys eigen geautoriseerde backend beschikbaar zijn voor testautomatisering. V2-preview vereist short-lived token en server-side proxy; geen API-key in de browser.

## Wat nu concreet openstaat

- Read-only inspect-script tests draaien en PR reviewen. Geen productiecode aangepast door deze PR.
- Bevestig dat v0 v2 met bestaande account/keys én juiste assets werkt; v2-beta-risico expliciet afwegen.
- Integreer daarna pas async status, server-side previewproxy, idempotency en onafhankelijke screenshot-QA achter een gecontroleerde testroute. Geen autonome live-publicatie.
- Vergelijk twee of meer echte API-runs met dezelfde inputgrootte; rapporteer werkelijk gemeten fasetijden, bestandsgrootte, kosten en asset/Preview-retentie. Geen automatische belofte van <2 minuten.

## Zelfreferentie Lumivey

De publieke Lumivey-website kan een eigen referentiecase voor de bestaande cirkel worden, maar pas met goedgekeurde eigen Preview, merkassets, feitelijke inhoud, consent en dezelfde onafhankelijke QA. Niet verwarren met het bewijs dat de AssetPouwer-site WoW behoudt.
