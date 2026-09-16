# Lumivey — twee kwaliteitsvragen in bestaande primaire keten

Besluit: 16 september 2026. Bindende, beperkte uitwerking van Het Plan v0.4 en `PREVIEW_WOW_RETENTION.md`; geen nieuw product, model, intakeblok of planversie.

## De twee vragen (Preview én website)

1. **Herkent de ondernemer zichzelf?** Identiteit, persoonlijkheid, vakmanschap, verhaal, creatieve signatuur en erkende grenzen blijven zichtbaar. De reden voor de WoW van de goedgekeurde Preview mag in de website niet verdwijnen. Essentiële signatuur verloren = FAIL, ook wanneer vraag 2 slaagt.
2. **Begrijpt en vertrouwt een potentiële klant hem?** Is voldoende duidelijk wat de ondernemer aanbiedt, voor wie/relevante vraagstukken, waarom dit geloofwaardig is op basis van werkelijk beschikbare feiten/bewijzen en hoe contact werkt? Een visueel persoonlijke website zonder begrijpelijk aanbod of betrouwbaar contact voldoet evenmin. Dit is geen verplicht conventioneel landingpageformat of marketingdruk.

Deze checks zijn onafhankelijk: mooie feiten compenseren geen verlies aan karakter; creatieve WoW compenseert geen misleiding of onbegrijpelijk aanbod. Bestaand doel >85% Preview-websiteovereenkomst blijft gelden naast de harde behoudpunten. Het oordeel van een evaluator is voorlopig; echte ondernemers en eerste bezoekers valideren beide vragen.

## IST (gecontroleerd in repo)

- `NON_NEGOTIABLES.md`, `PREVIEW_WOW_RETENTION.md`, `primary-flow.ts` en `v0-adapter.ts` borgen herkenning, feiten, assets, responsiviteit, contact en creatieve signatuur al in diverse mate.
- `understanding.ts` kent al `business.services`, `business.audience`, `website.purpose`, `sourceBacked` met herkomst, `facts`, `interpretations`, `unknowns`, `humanSignals`. `source-context.ts` bewaart bronbewijs. Geen nieuw contextmodel nodig voor deze aanvulling.
- `site-description.ts` en `create-preview.ts` focussen sterk op herkenning en vermijden verzinsels; bezoekersbegrip en geverifieerde vertrouwensankers stonden niet expliciet als tweede afzonderlijke controle geformuleerd.
- `/api/qa/preview-retention` verifieert signatuur, woord-beeld, fidelity, mensen, feiten/merk en responsive, maar heeft nog geen expliciete afzonderlijke bezoekerbegrip/vertrouwen-check. De QA is bovendien nog niet automatisch verbonden met de v0-build.

## GAP → minimale SOLL

- Gebruik bestaand gesprek en bronmateriaal eerst voor klantperspectief: `business.audience`, aanbod, reële werkwijze, bewezen cases, diploma's/reviews alleen indien geverifieerd, vindbare geverifieerde contactgegevens en een begrijpelijke vervolgstap. Stel alleen een extra natuurlijke Discovery-vraag bij een werkelijk essentieel hiaat; geen vragenlijst. Geen emotionele diepgang forceren.
- Preview-instructie benoemt bezoekerbegrip en bewijs als lichte tweede toets, zonder artist impression terug te brengen tot een template of bewijs op de homepage te stapelen. Feiten en interpretaties blijven gescheiden; persoonlijke beelden en verhalen vereisen passende toestemming.
- Website Brief en v0-opdracht houden beide criteria vast. Bij ontbrekend bewijs geen verzonnen credential/testimonial, maar aantoonbare werkwijze of bescheiden feitelijke copy; bij ontbrekend contact signaleren, nooit fabriceren.
- Bestaande website-QA krijgt één aparte `visitor-clarity-and-trust`-check op daadwerkelijk gerenderde desktop en mobiel. Controleer aanbod/doelgroep, concreet geloofwaardig bewijs voor belangrijke claims, duidelijk pad naar contact en kwaliteit/waarheid van zichtbare gegevens. De check mag geen standaard commerciële lay-out voorschrijven; ontbrekende of twijfelachtige essentiële informatie is WARN/FAIL en krijgt een gerichte correctie. Signature FAIL blijft FAIL, ongeacht bezoekersscore.
- Gebruik normale correctie-/goedkeuringsroute; geen CMS, CRM, dashboards of nieuwe agentarchitectuur. Correcties propagateren zonder nieuwe Discovery/crawl/Preview wanneer dat niet nodig is.

## Verificatie en stopgrens

Adrie: identiteit en creatieve focus/kader/kijken-richten behouden én helder strategisch assetmanagement, technische achtergrond, relevante opdrachten, casus, echt bewijs en contact. Geen tweede grote persoonsfoto of afgesneden hoofd. Michael: oorsprongsverhaal én helder detailing-aanbod en vertrouwen. Hippe Knip: uitgesproken eigenheid én begrijpelijk aanbod/contact. Test op bestaande referenties; geen nieuwe uitgebreide simulaties. Na betrouwbare ronde naar eerste echte ondernemers.

**Nog geen bewezen eindacceptatie:** daadwerkelijke automatische asynchrone v0-rendercapture, desktop/mobiel-QA, herstelronde, persistente signatuur/goedkeuring en een herstelde Adrie-build moeten nog aantoonbaar slagen. Zonder die stappen geen PASS claimen. De ongeveer acht minuten wachttijd moet per stap worden gemeten vóór optimalisatie.
