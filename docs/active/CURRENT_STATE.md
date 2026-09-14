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
- Een Lumivey Preview bevat normaal zowel een professioneel anker als een persoonlijk herkenningsanker op de homepage, tenzij Discovery expliciet aangeeft dat de ondernemer dit niet wil of er inhoudelijk een goede reden tegen is.

## Wat aantoonbaar werkt

1. Een menselijk Discovery-gesprek kan voldoende begrip en goudklompjes opleveren voor een sterke Preview. Michael (juni) bewijst dit.
2. Een sterke goedgekeurde Preview + goede overdracht kan door v0 worden omgezet in een werkende website die de Preview sterk benadert. Michael bewijst dit.
3. De primaire technische keten bestaat: Discovery/bronnen → Understanding → creatieve richting → Preview → goedkeuring → Website Brief → Build Readiness → v0.
4. Michael-regressie bestaat inmiddels voor gesprek, Understanding, creatieve richting en Preview.
5. Firecrawl is geïntegreerd en kan een volledige website crawl uitvoeren met fallback naar homepage scrape.
6. Recovery datapad-fix is op `main` gemerged en Vercel-build is geslaagd: bronbeelden worden nu first-class bewaard, deterministische contactsignalen uit de volledige crawl worden toegevoegd, door ondernemer geüploade echte beelden gaan als image-assets naar Website Brief, en niet-gevalideerde websitebeelden worden niet stilzwijgend naar v0 gestuurd.
7. De Adrie-regressie loopt technisch door tot en met Preview. Inhoudelijke Understanding was sterk, maar de eerste nieuwe Preview was te zakelijk/generiek ten opzichte van de referentie.
8. Preview-generator en Adrie-evaluator zijn aangescherpt: professioneel + persoonlijk anker, bronrijkdom behouden en een nette consultant-site is niet meer automatisch PASS.

## Wat nu NIET betrouwbaar genoeg is

- Dezelfde kwaliteit is nog niet reproduceerbaar voor iedere case.
- Correcties van de ondernemer zijn nog geen first-class state en hebben geen harde override/propagation-logica.
- Preview-feedback (“dit klopt niet omdat…”) vloeit nog niet terug naar Discovery/Understanding.
- De normale flow heeft nog geen generieke >85%-QA gate tegen de goedgekeurde Preview.
- Adrie moet opnieuw door de aangescherpte Preview-flow worden getest voordat v0 weer aan zet komt.
- Websitebeelden uit oude/externe bronnen zijn nu bewust `needs-owner-validation`; er is nog geen expliciete UI/flow om zulke beelden goed te keuren voor productie.
- De huidige Adrie-regressie gebruikt nog vaste referentie-antwoorden; dat test betekenisbehoud goed, maar conversationeel gedrag nog niet volledig eerlijk.

## Belangrijke codebevindingen / herstelde punten

- `lib/lumivey/source-context.ts` bewaart bronfeiten, evidence, goudkandidaten, deuren, onzekerheden én source image assets. First-class correcties/besluiten ontbreken nog.
- `lib/lumivey/understanding.ts` scheidt bevestigde data, humanSignals, sourceBacked, facts, interpretations en unknowns. Basis voor typed state is aanwezig.
- `lib/lumivey/analyze-website-source.ts` prioriteert relevante pagina's, analyseert een ruimer bronvenster en haalt e-mail/telefoon/social links deterministisch uit de volledige crawl zodat contactdata niet alleen van AI-samenvatting afhangt.
- `lib/lumivey/analyze-uploaded-source.ts` bewaart geüploade echte afbeeldingen als source assets met provenance.
- `app/prepare/page.tsx` zet source image assets nu om naar echte Website Brief image-assets; door ondernemer geüploade beelden worden als approved customer assets gemarkeerd, websitebeelden als needs-owner-validation.
- `lib/lumivey/v0-adapter.ts` verstuurt alleen goedgekeurde image-assets, respecteert validationStatus en bevat een expliciete regel om echte personen herkenbaar te houden en gezichten/hoofden niet onbedoeld af te snijden.
- `lib/lumivey/create-preview.ts` bevat nu expliciete homepage-balance: professioneel anker + persoonlijk herkenningsanker, human signals moeten zichtbaar de beeldtaal/compositie beïnvloeden en relevante source-backed rijkdom mag niet stil verdwijnen.
- Preview-afkeur reset momenteel nog alleen de impression in de UI; feedback wordt niet als Discovery-data opgeslagen.

## Huidige recovery-doel

Niet opnieuw Lumivey uitvinden. Niet nieuwe tooling toevoegen. Eerst beide recente bouwsporen inhoudelijk en technisch reconciliëren en de bewezen keten beschermen.

Prioriteit:
1. Hersteld: datapad voor contactdata en echte beelden.
2. Hersteld/aangescherpt: Preview-regel voor professionele + persoonlijke herkenning.
3. Nu: Adrie Preview opnieuw genereren en vergelijken met referentie + vorige technische Preview. Nog niet naar v0.
4. Daarna: adaptieve Adrie-gesprekstest zodat antwoorden werkelijk aansluiten op Lumivey's vragen.
5. Daarna pas correction propagation en Preview-feedback terug naar Discovery.
6. Daarna generieke website-QA (>85% t.o.v. goedgekeurde Preview) invoeren.

## Huidige Git-situatie

- `main` bevat de huidige lineaire bouwgeschiedenis plus de recovery/anti-drift documenten.
- Veilige snapshot vóór reconciliation: `recovery-2026-09-14-before-reconcile`.
- Datapad recovery is via PR #7 gemerged na succesvolle Vercel-check.
- Preview self-fetch/protected deployment fix is via PR #9 gemerged.
- Persoonlijk homepage-anker is vastgelegd via PR #10.
- Preview balance + strengere Adrie-evaluatie is via PR #11 gemerged na succesvolle Vercel-check.
- Niet blind terugrollen: wijzigingen na Michael bevatten waardevolle verbeteringen. Per wijziging beoordelen of hij behouden, aangepast of verwijderd moet worden.

## Eerstvolgende technische sessie

Doel: Adrie opnieuw door de aangescherpte Preview-flow laten lopen. De gewenste richting is een hybride van de juni-referentie (rust, natuur, fotografie, menselijkheid) en de recente technische Preview (assetmanagement, infra, strategie ↔ operatie, uitvoerbaarheid, bronrijkdom). Alleen als deze Preview duidelijk op niveau komt, gaat de keten door naar v0.

Definition of Done voor recovery:
- bron → Understanding → Preview → Website Brief → v0 is traceerbaar;
- relevante contactdata gaat niet verloren;
- echte geüploade beelden gaan niet verloren;
- correcties kunnen eerdere aannames overschrijven;
- Preview-feedback verandert Understanding;
- Adrie kan opnieuw worden getest zonder handmatig vergeten informatie terug te plakken;
- Michael Golden Path blijft intact.
