# Checkpoint — Adrie build doorlooptijd (16 september 2026)

## Scope van deze wijziging

`lib/lumivey/v0-adapter.ts` meet nu afzonderlijk de werkelijk verstreken tijd van visuele PreviewSignature-extractie, indienen van de v0 API-request, en de totale server-side handoff. Deze drie velden worden in `build.timing` geretourneerd en zonder klantgegevens in de serverlogs vastgelegd. Een al aanwezige signatuur wordt hergebruikt; `signatureReused` toont of dat gebeurde. Geen nieuwe Discovery, Firecrawl of v0-build is uitgevoerd om deze wijziging te testen.

## Belangrijke grens

De v0 API wordt asynchroon aangeroepen. `handoffTotalMs` is daarom NIET de doorlooptijd tot de website klaar is. De gemelde circa acht minuten bij de Adrie-test zijn gebruikerswaarneming, geen technisch uitgesplitste meting. We mogen deze gedeeltelijke telemetry niet als volledige verbetering of regressie verkopen.

## Volgende bouwopgave — geen extra volledige test zonder meet- en QA-koppeling

- Bestaande v0-chat-id van de afgekeurde Adrie-build veilig hergebruiken.
- v0-versiestatus en `createdAt`/`updatedAt` via de officiële GET chat/version API uitlezen. Deze versie is pas gereed bij `latestVersion.status=completed`, niet zodra het async aanmaken terugkeert.
- De door v0 verstrekte geauthenticeerde `screenshotUrl` server-side ophalen; deze URL niet ongeautoriseerd naar de browser doorgeven. Voor echte mobiele QA is nog een aparte mobiele render nodig; de v0-screenshot mag niet worden gedupliceerd als fictief mobiel bewijs.
- De bestaande onafhankelijke QA automatisch aansluiten zodra echte desktop- en mobiele renders beschikbaar zijn. FAIL betekent correctie in dezelfde v0-chat plus een nieuwe gerenderde beoordeling; geen nieuwe Discovery/Firecrawl/Preview.
- Meet apart: beeldcompressie/upload, signatuurextractie, v0-submit, async generatie tot completed, screenshotrender, QA en correctie. Historische circa twee minuten (Michael/Hippe Knip) is vergelijkingspunt, geen garantie.
- Accepteer Adrie pas met daadwerkelijk behouden kader-/vizierconcept, één herkenbare verschijning, een kleine persoonlijke knipoog, correcte bronassets en ongeschonden hoofden én helder aanbod/contact.

## Status

Dit is een smalle observability-fix, niet de oplossing voor de nog afgekeurde Adrie-site. Geen claim van end-to-end QA of snellere generatie voordat de feitelijke metingen en screenshots bestaan.
