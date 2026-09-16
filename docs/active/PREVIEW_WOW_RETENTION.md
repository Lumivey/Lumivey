# Lumivey — WoW-behoud van Preview naar website

Status: bindende uitwerking van Het Plan v0.4; geen nieuwe filosofie, geen nieuwe planversie. Datum: 16 september 2026.

## Plan-toepassing / harde bouwregel

De ondernemer keurt in de Preview geen stapel feiten of een moodboard goed, maar een creatieve interpretatie waarin de ondernemer zich herkent. Na WoW mag de technische productiemotor inhoud, identiteit, woord-beeldrelaties, visuele vondsten, ritme en de reden voor de herkenning niet stilzwijgend verwijderen. De goedgekeurde Preview blijft design authority; de Website Brief maakt die overdraagbaar. Alleen aantoonbare feitelijke onjuistheid, veiligheid, privacy, toestemming of maakbaarheidsproblemen rechtvaardigen een afwijking; afwijkingen worden gedocumenteerd en opnieuw ter goedkeuring aangeboden. Een mooie technische website zonder de herkenningskern is geen geslaagd Lumivey-resultaat.

Herkomst: Het Plan v0.4 schrijft Discovery → betekenis → artist impression → WoW/herkenning → Website Brief met impression/echte assets/feiten → v0 → QA/fine-tuning → goedkeuring voor. Dit bestand specificeert DO/CHECK; het vervangt of herschrijft dat plan niet.

## Niet één stijl voor alle ondernemers

Per goedgekeurde Preview wordt een eigen `PreviewSignature` vastgelegd: (1) waarom de ondernemer zich herkent; (2) onderscheidende creatieve mechaniek; (3) werkelijke visuele motieven; (4) koppelingen tussen beeld en taal; (5) harde behoudpunten; (6) verboden verliezen; (7) bewijs en onzekerheden. Geen universele verplichte kaderlijnen of fotografie: Michael, Adrie en De Hippe Knip hebben verschillende herkenningsmechanismen. Visuele details worden uit de daadwerkelijke goedgekeurde afbeelding gelezen; niet afgeleid uit het beroep of verzonnen.

De goedgekeurde screenshot zelf wordt niet aan v0 als attachment gegeven: een eerdere build gebruikte die abusievelijk als full-page productieafbeelding. De signatuur wordt tekstueel/gestructureerd doorgegeven, samen met echte goedgekeurde productieassets; v0 moet echte HTML/CSS-componenten maken.

## Verplichte overdracht

- Koppel ieder essentieel creatief motief aan een concrete web-implementatie en een passende plaats (hero/proces/case/persoonlijke laag, naar de feitelijke Preview); copy en visuele vorm mogen elkaar niet loslaten.
- Bewaak doseerregels, niet slechts aanwezigheid: een subtiel persoonlijk moment mag niet tot herhaalde persoons-/hobbyfoto's uitgroeien. Een bestaande merkasset mag niet worden vervangen.
- Behoud de verhaalstructuur en relatieve nadruk; voorkom een generieke sectie-/kaart-normalisatie. Verander geen feit in een verzinsel.
- Een gecureerde foto blijft geloofwaardig: geen afgesneden hoofd/gezicht, zwevende lichaamsdelen of vervormde identiteit.
- Bij technische onmaakbaarheid: registreer de afwijking; wijzig niet stilzwijgend de goedgekeurde creatieve belofte.

## Website QA en publicatiegate (nog te automatiseren waar aangeduid)

Vergelijk de *gerenderde desktop- én mobiele website* met de vastgelegde signatuur en goedgekeurde Preview. QA kent aparte dimensies: feiten/brondata, bestaande merkassets, echte foto’s/crops, inhoud/structuur, creatief motief en woord-beeld-koppeling, herkenningskern, responsive gedrag. Een >85%-doel op relevante kenmerken mag een ontbrekend essentieel behoudpunt niet wegmiddelen. Creatieve signatuur verdwenen = FAIL, ook bij correcte content en nette code. FAIL → gerichte correctie van bestaande v0-build → opnieuw renderen en QA; geen volledige Discovery/Firecrawl/Preview opnieuw. Alleen ondernemer keurt eindpublicatie goed.

Niet te verwarren: een menselijke override op Preview-WARN is geen automatische vrijgave van de daarop gebouwde website. Deze krijgt haar eigen onafhankelijke QA.

## Regressies (acceptatie)

- **Adrie**: herkenbare solo-ondernemer eenmaal op home; strategie↔operatie, echte technische beelden, gefaseerde change-case; persoonlijke zondagochtend subtiel. Als de goedgekeurde Preview kader/vizier/focus/richting als eigen vondst toont, vertaalt v0 dat daadwerkelijk in webcomponenten. Geen technisch correcte maar generieke kaartenwebsite; geen hoofd-crop; bestaand logo behouden zodra beschikbaar.
- **Michael**: persoonlijk oorsprongsverhaal kan dominanter zijn als Discovery dat draagt; niet automatisch de subtiele Adrie-dosering toepassen.
- **De Hippe Knip**: bestaande uitgesproken ondernemers-/salonidentiteit is de signatuur; geen extra hobby of willekeurige focusmarkeringen forceren.
- **VoetGemak**: bronmateriaal is geen designblauwdruk; moeder/diabetes is geen kale tekstkaart maar een mogelijke creatieve betekenis, te valideren bij Discovery.

## Technisch contract / Definition of Done

1. `PreviewSignature` heeft expliciete getypeerde, gevalideerde velden en is verbonden aan een specifieke goedgekeurde Preview-ID.
2. Voor v0 wordt de werkelijke afbeelding visueel gelezen en wordt signatuur gelockt. Bij ontbrekend/ongeldig contract niet stilzwijgend doorschakelen naar een generieke build.
3. Website Brief en v0-aansturing dragen het contract gestructureerd over, zonder screenshot als productieasset.
4. Een onafhankelijke websitevergelijking toetst gerenderde output tegen gelockte signatuur en Preview. Geen zelfgerapporteerde v0-PASS als eindbewijs.
5. Falen geeft concrete per-item correctieopdracht en retest, zonder voorgaande stappen opnieuw te draaien.
6. Tests op Adrie + Michael + De Hippe Knip; zowel desktop als mobiel; daadwerkelijke buildresultaten en evaluatoruitslagen opslaan.

**Voortgangsgrens:** een vastgelegde contracttekst of scherpere v0-prompt is geen bewijs dat WoW-retentie al geautomatiseerd gegarandeerd is. Status moet expliciet onderscheid maken tussen geïmplementeerde pre-build bescherming en nog open post-build QA.