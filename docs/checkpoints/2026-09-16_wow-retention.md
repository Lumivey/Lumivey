# Checkpoint — WoW behouden van Preview naar website

Datum: 16 september 2026. Norm: Het Plan v0.4, niet vervangen of geüpgraded.

## Aanleiding

Adrie Preview kreeg menselijke WoW door rust, strategie↔operatie, echte vakkennis en een subtiele persoonlijke laag. Specifiek verdwenen in de v0-uitvoering: het creatieve kader-/vizier-/focusmotief en de woord-beeldrelatie rond kijken/begrijpen/richten. Vroege v0-iteraties gebruikten bovendien de Preview als grote plaat, herhaalden Adrie en sneden een hoofd af. Betekenis/facts alleen doorgeven is geen volledige ontwerp-overdracht.

## Deze branch

- `docs/active/PREVIEW_WOW_RETENTION.md`: korte harde bouwregel, plan-toepassing, acceptatiecriteria voor verschillende ondernemers en volledige technische Definition of Done.
- `AGENTS.md`: verplichte boot-check op deze regel; niet steeds opnieuw laten ontdekken.
- `lib/lumivey/preview-signature.ts`: visuele, getypeerde extractie van de echte goedgekeurde Preview in `PreviewSignature` met bewijs, motieven, woord-beeldrelaties, niet-onderhandelbare elementen en onzekerheden. Als extractie faalt, start v0 niet stilzwijgend als generieke website.
- `lib/lumivey/primary-flow.ts`: optioneel getypeerd veld aan Website Brief, met Preview-ID-integriteitscontrole.
- `lib/lumivey/v0-adapter.ts`: capture vóór handoff, contract in de Website Brief en expliciete verplichting om motieven als echte responsive HTML/CSS-componenten te realiseren; de screenshot blijft absoluut géén productieasset.
- `app/api/qa/preview-retention/route.ts`: onafhankelijke website-QA op basis van feitelijke gerenderde desktop- én mobiele screenshots versus de goedgekeurde Preview en de gelockte signatuur. Verlies van essentiële WoW, falende menselijke beelden of brand/facts geeft FAIL; gerichte correctieprompt wordt teruggegeven. `publishable` blijft false zonder aparte eindgoedkeuring.

## Wat wel en niet bewezen is

Een geslaagde Vercel-build bewijst compilatie/deployment, NIET dat v0 de motieven daadwerkelijk bewaart. De QA-route bestaat, maar moet nog gekoppeld worden aan het asynchrone v0-resultaat en een automatische screenshot-capture zodat de ondernemer geen screenshots hoeft te verzamelen. Deze branch is dus **implementatiefase 1, nog geen volledige end-to-end WoW-garantie**. De `PreviewSignature` zit in het geretourneerde Brief maar nog niet in duurzame klant-state/database. Regereren van de signatuur bij een nieuwe build kan variëren; persistente snapshot + goedkeurings-ID volgt.

## Exacte vervolgtaak

1. Verifiëren met één Adrie-build of de captured signature daadwerkelijk kader/focus + kijken/richten als bewijs registreert; toon het contract en de v0-output ter inspectie.
2. v0-buildstatus pollen tot preview echt klaar is; server-side browser/screenshot-capture van desktop én mobiel aansluiten.
3. QA-route automatisch aanroepen met dezelfde goedgekeurde Preview, gelockte signature en screenshots; resultaat opslaan; bij FAIL de bestaande chat gericht corrigeren en opnieuw QA, geen Discovery/Firecrawl-repeat.
4. Signature + Preview approval + Website Brief + QA-resultaten persistent bewaren; hergebruik exact dezelfde signature bij retries.
5. Michael, Adrie en De Hippe Knip regressietesten. WoW-signatuur is ondernemer-specifiek; geen Adrie-regels overal hardcoderen.
6. Alleen na werkelijke QA-PASS en afzonderlijke goedkeuring door de ondernemer aan publicatie denken.

Geen update van Word-plan v0.4 zolang een aanvullende technische uitwerking volstaat: DO/CHECK-probleem, geen filosofische PLAN-wijziging.