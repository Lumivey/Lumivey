# Lumivey — BUILD METHOD

Doel: drift voorkomen en nieuwe bouwsessies snel, consistent en controleerbaar laten starten.

## 1. Chat is werkbank, repo is geheugen

- Geen enkele chat is de bron van waarheid.
- Chats worden kort gehouden en hebben één duidelijke bouwopgave.
- Besluiten, huidige status, harde regels en checkpoints staan in de repo.

## 2. Verplichte boot-check vóór bouwen

Iedere nieuwe bouwsessie leest vóór code of wijzigingen:
1. `docs/active/CURRENT_STATE.md`
2. `docs/active/NON_NEGOTIABLES.md`
3. `docs/active/BUILD_METHOD.md`
4. relevante passages uit Plan v0.4 / actieve documenten
5. relevante referentiecase of laatste checkpoint

Daarna geeft de sessie intern antwoord op:
- Wat is het echte functionele doel?
- Wat is de norm/referentie?
- Is dit CORE of commodity?
- Bestaat al een betere passende tool/oplossing?
- Welk risico bestaat op informatie-, betekenis- of kwaliteitsverlies?

Pas daarna bouwen.

## 3. Werkregel per bouwopgave

PLAN → REFERENTIE → DOEL → TOOLCHECK → RISICO → BOUW → CHECK → CHECKPOINT

### PLAN
Wat zegt Plan v0.4 al? Niet opnieuw theorie maken als de norm al bestaat.

### REFERENTIE
Welke bewezen case bepaalt kwaliteit? Michael, Adrie, VoetGemak of een andere vastgelegde referentie.

### DOEL
Formuleer functioneel. Niet: “generator aanpassen”. Wel: “goedgekeurde Preview en echte assets zonder verlies naar v0 brengen”.

### TOOLCHECK
Bij commodity eerst bestaande oplossing/tool beoordelen. Geen zelfbouw uit gewoonte.

### RISICO
Benoem vóór implementatie wat kan breken: waarheid, provenance, correcties, assets, gesprek, Preview, responsive gedrag, etc.

### BOUW
Zo klein mogelijk. Geen ongevraagde zijfeatures of herontwerp.

### CHECK
Niet alleen compileert/werkt, maar ook:
- Plan-conform?
- referentieniveau?
- feiten behouden?
- betekenis behouden?
- correcties gerespecteerd?
- assets behouden?
- geen nieuwe drift?

### CHECKPOINT
Aan het eind van één bouwopgave vastleggen:
- wat is gedaan;
- wat is bewezen;
- welke commits/bestanden zijn relevant;
- wat is veranderd in Current State;
- wat is nog open;
- exacte volgende stap.

## 4. Teststrategie

- Michael = Golden Path / regressie van volledig Discovery-pad.
- Adrie = acceptantie/datapadtest met echte bestaande website, Firecrawl, echte beelden en correcties.
- VoetGemak = broninterpretatietest zonder volledig gesprek; hoge eis aan bronbenutting, lagere eis aan emotionele diepte.
- Geen nieuwe menselijke testgesprekken om een oude baseline terug te winnen.

## 5. Wanneer een chat stoppen

Sluit een bouwchat af vóór drift ontstaat wanneer:
- één bouwopgave klaar is;
- een nieuw probleem een andere laag raakt;
- belangrijke koersbeslissing nodig is;
- de chat veel context begint te stapelen;
- meerdere correcties nodig waren om terug naar plan/referentie te komen.

Maak eerst checkpoint. Nieuwe chat start vanaf repo, niet vanuit herinnering.

## 6. Rol Ruud ↔ ChatGPT

Ruud bewaakt visie, ziel, Quiet Web, herkenning en grote strategische grenzen.
ChatGPT bewaakt technische uitvoering, planconformiteit, referentiecases, toolkeuze, build-vs-buy, regressie, datapad en eerdere afspraken.

Doel: Ruud hoeft steeds minder te zeggen “dit hadden we al afgesproken”.
