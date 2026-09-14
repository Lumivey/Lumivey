# Lumivey — CURRENT STATE

Datum: 2026-09-14
Status: recovery/reconciliation vóór verdere featurebouw

## Waarom dit bestand bestaat

Dit bestand is de actuele projectwaarheid voor een bouwsessie. Chats zijn tijdelijke werkbanken en mogen niet als projectgeheugen worden gebruikt.

## Huidige norm

- `Lumivey_Het_Plan_v0_4_leesbaar.docx` blijft de inhoudelijke grondwet. Geen v0.5 maken alleen omdat uitvoering van het plan afweek.
- Michael is de Golden Path / bewezen referentie.
- Adrie Pouwer / AssetPouwer is de eerste acceptantie- en datapadtest.
- VoetGemak / Miranda is de broninterpretatietest zonder volledig Discovery-gesprek.

## Wat aantoonbaar werkt

1. Een menselijk Discovery-gesprek kan voldoende begrip en goudklompjes opleveren voor een sterke Preview. Michael (juni) bewijst dit.
2. Een sterke goedgekeurde Preview + goede overdracht kan door v0 worden omgezet in een werkende website die de Preview sterk benadert. Michael bewijst dit.
3. De primaire technische keten bestaat: Discovery/bronnen → Understanding → creatieve richting → Preview → goedkeuring → Website Brief → Build Readiness → v0.
4. Michael-regressie bestaat inmiddels voor gesprek, Understanding, creatieve richting en Preview.
5. Firecrawl is geïntegreerd en kan een volledige website crawl uitvoeren met fallback naar homepage scrape.

## Wat nu NIET betrouwbaar genoeg is

- Dezelfde kwaliteit is nog niet reproduceerbaar voor iedere case.
- Broninformatie en betekenis kunnen onderweg verdwijnen.
- Externe afbeeldingen uit Firecrawl worden wel gevonden maar niet betrouwbaar door het normale productiepad als echte image-assets naar v0 gedragen.
- Contactinformatie kan verdwijnen vóór of tijdens bronanalyse; volledige crawl-output wordt voor analyse afgekapt.
- Correcties van de ondernemer zijn nog geen first-class state en hebben geen harde override/propagation-logica.
- Preview-feedback (“dit klopt niet omdat…”) vloeit nog niet terug naar Discovery/Understanding.
- De normale flow heeft nog geen generieke >85%-QA gate tegen de goedgekeurde Preview.
- De normale prepare-flow en de speciaal gebouwde Michael-regressie/productie-assets zijn nog niet gelijkwaardig; Michael profiteert van explicietere asset mapping.

## Belangrijke codebevindingen

- `lib/lumivey/source-context.ts` bewaart bronfeiten, evidence, goudkandidaten, deuren en onzekerheden, maar geen first-class correcties/besluiten.
- `lib/lumivey/understanding.ts` scheidt bevestigde data, humanSignals, sourceBacked, facts, interpretations en unknowns. Basis voor typed state is dus aanwezig.
- `lib/lumivey/analyze-website-source.ts` krijgt Firecrawl image-URLs te zien maar geeft ze niet terug in `SourceContext`.
- `app/prepare/page.tsx` zet bronnen momenteel als `kind: "other"` in Website Brief assets.
- `lib/lumivey/v0-adapter.ts` verstuurt alleen assets met `kind === "image"` als beeldattachment. Hierdoor kunnen beschikbare echte beelden in de normale flow verdwijnen vóór v0.
- `analyze-website-source.ts` analyseert maximaal 24.000 tekens van de gecombineerde crawl-output. Contactdata op latere pagina's kan daardoor buiten analyse vallen.
- Preview-afkeur reset momenteel alleen de impression in de UI; feedback wordt niet als Discovery-data opgeslagen.

## Huidige recovery-doel

Niet opnieuw Lumivey uitvinden. Niet nieuwe tooling toevoegen. Eerst beide recente bouwsporen inhoudelijk en technisch reconciliëren en de bewezen keten beschermen.

Prioriteit:
1. Geen dataverlies van feiten, contactdata en echte beelden.
2. Correcties first-class maken en laten doorwerken.
3. Previewfeedback terug laten vloeien naar Discovery/Understanding.
4. Adrie opnieuw end-to-end testen tegen harde gates.
5. Daarna generieke website-QA (>85% t.o.v. goedgekeurde Preview) invoeren.

## Huidige Git-situatie

- `main` bevat de huidige lineaire bouwgeschiedenis.
- Veilige snapshot vóór reconciliation: `recovery-2026-09-14-before-reconcile`.
- Niet blind terugrollen: wijzigingen na Michael bevatten waardevolle verbeteringen (regressie, volledige Firecrawl-crawl, asset mapping). Per wijziging beoordelen of hij behouden, aangepast of verwijderd moet worden.

## Eerstvolgende technische sessie

Doel: één gecontroleerde recovery-branch maken waarop eerst datapad en kwaliteitsgates worden hersteld. Geen nieuwe productfeatures.

Definition of Done voor recovery:
- bron → Understanding → Preview → Website Brief → v0 is traceerbaar;
- relevante contactdata gaat niet verloren;
- echte beelden gaan niet verloren;
- correcties kunnen eerdere aannames overschrijven;
- Preview-feedback verandert Understanding;
- Adrie kan opnieuw worden getest zonder handmatig vergeten informatie terug te plakken;
- Michael Golden Path blijft intact.
