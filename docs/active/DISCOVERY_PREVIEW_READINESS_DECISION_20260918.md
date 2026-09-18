# Besluit — Discovery bepaalt wanneer de Preview verschijnt (18 september 2026)

Status: expliciete correctie van Ruud op `OPTIONAL_EARLY_ACCOUNT_DISCOVERY_DECISION_20260918.md`, vastgelegd uitsluitend in draft PR #49. Productbesluit/acceptatiecriteria; geen geïmplementeerde readiness-gate of routewijziging.

## Harde regel

**Uitsluitend Lumivey's Discovery Engine bepaalt wanneer er voldoende begrip is om een persoonlijke Preview te tonen.** Dit geldt identiek voor gast, vroeg aangemaakt account en hervat dossier. De hoeveelheid aangeleverde informatie, aanwezigheid van website/foto's/documenten, een ingevuld profiel of accountaanmaak mogen nooit automatisch een Preview starten, Discovery als gereed markeren of een vaste vragenlijst overslaan ten gunste van een onmiddellijke Preview. Ook een knop of verzoek om een Preview is geen bypass van de readiness-beslissing. Indien al voldoende begrip bestaat, mag Discovery na een korte betekenisvolle toets meteen gereed zijn; geen kunstmatige vragen om tijd te rekken.

## Gebruik van vooraf aangeleverde context

- Sla brongegevens op met herkomst, bevestigingsstatus, correcties en onzekerheden; laad ze vóór het eerste bericht of bij veilig hervatten.
- Discovery gebruikt die gegevens om gerichte erkenning en maximaal één waardevolle natuurlijke vervolgvraag te formuleren; vraagt bekende feiten niet mechanisch opnieuw uit.
- Volledige of omvangrijke brondata is niet hetzelfde als begrepen identiteit, trots, motivatie en betekenis. Feiten uit oude websites of AI-interpretaties worden nooit stilzwijgend als ondernemerswaarheid behandeld.
- Als de ondernemer al een rijk en consistent verhaal inclusief herkenningsankers aanlevert, kan Discovery zonder extra vragen de Preview-readiness bereiken. Zo niet, blijft de menselijke ontdekking doorgaan.
- Preview is een artist impression en hypothese binnen Discovery; feedback/correcties moeten terugvloeien naar Understanding. Alleen na herkenning/instemming met de richting volgt afzonderlijke geverifieerde bouwgoedkeuring. Een account mag vrijwillig vóór Discovery bestaan, maar heeft geen invloed op readiness.

## Implementatie- en regressie-eisen

1. Eén centrale server-side readiness-beslissing voor alle instaproutes, op basis van actueel opgebouwde Understanding en herkenningskwaliteit; geen `hasAccount`, `hasUploads`, aantal ingevulde velden of tekstlengte als automatische vrijgave.
2. Gebruiker mag informatie blijven delen en een Preview wensen; de Engine beslist of tonen verantwoord is en legt bij onvoldoende begrip een waardevolle vervolgvraag voor, zonder intakebot.
3. Test: nieuw gastgesprek met weinig informatie; vroeg account met veel zakelijke maar geen persoonlijke context; vroeg account met voldoende betekenis; hervatte gast met eerdere correcties; aangeleverde verouderde website; expliciete grens tegen persoonlijke homepage-informatie.
4. Tests bewijzen dat vroeg account en grote hoeveelheid documenten geen Preview omzeilen, terwijl werkelijk voldoende begrip geen kunstmatige vertraging veroorzaakt. De kwaliteit van de persoonlijke Preview blijft getoetst aan Michael/Adrie en de vastgelegde WoW-norm.

Niet geïmplementeerd met dit besluit: echte account-/gastdossierflow, server-side Preview-readiness, gegevensopslag of QA. De zeven betaalde v0-routes blijven gesloten; PR #49 blijft draft en productie ongemoeid.
