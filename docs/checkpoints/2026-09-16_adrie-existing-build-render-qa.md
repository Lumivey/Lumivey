# Checkpoint — Adrie bestaande v0-build render/QA

Datum: 16 september 2026. Deze checkpoint behoort uitsluitend bij de primaire bouwcirkel. Plan v0.4 en de goedgekeurde Preview blijven leidend.

## Daadwerkelijk gebouwd

- `app/api/regression/adrie/build-screenshot/route.ts`: read-only; haalt van de bestaande v0-chat de voltooide nieuwste versie en diens officiële `screenshotUrl` op via de v0-API. Screenshot gaat via serverproxy, v0-key wordt niet naar de browser verstuurd. Geen nieuwe generatie.
- `app/api/regression/adrie/mobile-screenshot/route.ts`: gebruikt de bestaande Firecrawl API voor een **echte** mobiele screenshot op 390x844, fullPage; doel-URL komt uitsluitend van de bestaande v0 API, geen arbitrary URL uit de gebruikerinput. Geen nieuwe v0-generatie, wel Firecrawl screenshotcredits.
- `app/regression/adrie/build-status/page.tsx`: toont bestaande buildstatus, indicatieve generatieduur, officiële desktop-screenshot en mobiele screenshot (indien beschikbaar). Fail states laten mislukte screenshot zien en noemen het niet PASS.
- `app/api/regression/adrie/qa-existing/route.ts`: georkestreerde independent QA. Eist bestaande chat-ID, goedgekeurde Preview, matching gelockte `PreviewSignature`. Vraagt twee **echte** screenshots op; bij ontbrekende screenshot wordt QA geblokkeerd. Roept de bestaande onafhankelijke QA aan (ondernemersherkenning en bezoekerbegrip/vertrouwen) en geeft controlebevindingen, gerichte correctieprompt en uitsplitsing capture/QA-duur terug. Start geen nieuwe v0-build.

## Getest / niet bewezen

- Vercel compile/deployment status voor de code is geslaagd. **Er is geen echte end-to-end Adrie QA uitgevoerd.** Het v0-chat-ID uit de web-interface kan buiten de API-account vallen; toegang moet via de live read-only route worden aangetoond. De Vercel-connector gaf 403 voor projectscope; runtime-API is daardoor niet door de assistent getest.
- De mobiele Firecrawl-screenshot kan worden geblokkeerd door bescherming van de private v0-demo. Dat levert expliciete fout en nooit een nep-PASS op.
- De QA-orchestrator is nog niet automatisch aangeroepen vanuit de bestaande Adrie Preview/build UI. De goedgekeurde Preview en signatuur waren bij de vorige run alleen client-state + geretourneerde Brief en zijn niet persistent opgeslagen; het verleden kan niet betrouwbaar uit een v0-link worden gereconstrueerd.
- Gerichte correctie op dezelfde v0-chat via `correctV0Build` bestaat als adapterfunctie, maar is nog niet veilig gekoppeld aan QA-uitkomst en geautoriseerde gebruikersactie.
- Geen claim dat de Adrie-site hersteld is of >85% overeenkomt. De eerder afgekeurde website blijft FAIL.

## Directe vervolgopgave

1. Controleer live of de v0-webchat via de ingestelde API-key leesbaar is en of desktop/mobile captures werken. Geen nieuwe v0-generatie voor deze check.
2. Bewaar Preview approval + gelockte signature + Brief bij de originele build, privacybewust en met versie-ID; voer de QA-route automatisch uit na completion. Zonder die artifacts geen eerlijke QA van het oude werk: vraag ze niet opnieuw te genereren, maar herstel alleen de originele approval snapshot indien nog beschikbaar.
3. Zorg dat FAIL de **bestaande** v0-chat maximaal gericht corrigeert met de gegenereerde correctionPrompt, daarna screenshot opnieuw en QA opnieuw. Beperk herhaalde generaties, log afzonderlijke latenties, blokkeer publicatie tot feitelijke QA PASS én eigenaar-goedkeuring.
4. Regression Adrie, Michael en De Hippe Knip; de ontwerp-signatuur blijft specifiek per ondernemer.

Geen extra websitegenerator, Discovery, Firecrawl broncrawl, theoretisch kwaliteitsmodel of nieuwe planversie.
