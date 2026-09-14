# Lumivey — RECOVERY PLAN

Datum: 2026-09-14
Doel: de waardevolle bouwresultaten uit de vastgelopen/gesplitste chats samenbrengen zonder terugval, verlies of blind rollback.

## Uitgangspunt

- Niet opnieuw beginnen.
- Niet automatisch de nieuwste wijziging laten winnen.
- Niet automatisch terugrollen naar een oudere commit.
- Plan v0.4 + bewezen Michael-pad + vastgelegde non-negotiables zijn de toets.
- Huidige `main` is veiliggesteld in branch `recovery-2026-09-14-before-reconcile`.

## Bekende ontwikkellijn

1. Michael Golden Path en v0-handoff zijn opgebouwd en werkend gemaakt.
2. Daarna zijn regressie- en kwaliteitslagen toegevoegd.
3. Vervolgens is Adrie-regressie toegevoegd.
4. Firecrawl is uitgebreid van homepage scrape naar full-site crawl.
5. De huidige geschiedenis is lineair; geen onherstelbare branch-chaos.

## Wat behouden moet worden tenzij bewijs anders zegt

- Michael regression harness en evaluatie op betekenis in plaats van woordelijkheid.
- Understanding-preservation checks.
- Creative-direction checks.
- Preview image regression.
- Approved Preview als v0 design authority.
- Real image assets in Website Brief/v0 handoff.
- Production asset mapping/compositional roles.
- Full-site Firecrawl crawl als concept, mits datapad en timeouts betrouwbaar worden gemaakt.
- Adrie regression tooling als testmateriaal.

## Bekende probleemzones

### A. Websitebron → SourceContext
- Full-site Firecrawl vindt meer data en images.
- `analyze-website-source.ts` kapt gecombineerde tekst af op 24.000 tekens.
- contactpagina/details kunnen daardoor ontbreken in analyse.
- Firecrawl image URLs worden niet als first-class source assets bewaard.

### B. SourceContext / Understanding → Website Brief
- broninformatie is grotendeels typed, maar correcties/preference/decision zijn niet first-class.
- normale prepare-flow zet source contexts als `kind: other` in assets.
- echte beelden kunnen daardoor uit de productiehandoff verdwijnen.

### C. Preview feedback
- Preview is inhoudelijk een hypothesis/spiegel.
- afwijzing/correctie wordt technisch niet teruggeschreven naar Understanding.

### D. Website QA
- Michael heeft speciale regressie-evaluaties.
- generieke productieflow heeft nog geen harde >85%-gate tegen goedgekeurde Preview.

## Reconciliation-stappen

### Stap 1 — state vastleggen
Gereed:
- recovery snapshot branch aangemaakt;
- Current State, Non-Negotiables en Build Method in repo vastgelegd.

### Stap 2 — datapad herstellen
Doel:
- contactdata en echte beelden blijven aantoonbaar behouden van Firecrawl/upload tot Website Brief/v0.

Werk:
- bronassets first-class modelleren;
- websitecrawl analyseren zonder belangrijke contactpagina's te verliezen;
- normale prepare-flow image assets laten maken;
- test toevoegen die Adrie-contact + beelden controleert vóór v0.

### Stap 3 — correction propagation
Doel:
- expliciete ondernemer-correctie overschrijft eerdere interpretatie/hypothese en blijft zichtbaar in latere lagen.

Minimaal model:
- correctie + target/subject + evidence + timestamp/order + status/override.
- deterministische precedence: expliciete latere gebruikerscorrectie > AI-interpretatie > externe bronkandidaat.

### Stap 4 — Preview feedback loop
Doel:
- “Dit wil ik aanpassen” verzamelt reden/correctie;
- feedback gaat terug naar Discovery/Understanding;
- nieuwe Preview gebruikt gecorrigeerde state.

### Stap 5 — Adrie end-to-end acceptantie
Controlepoorten:
1. Discovery/Understanding
2. Context/provenance
3. Preview
4. Website/v0

Minimale PASS:
- contactdetails uit bron aanwezig of expliciet als onzeker gemarkeerd;
- echte bruikbare foto's aanwezig en correct gemapt;
- fotografie niet als dienst gepresenteerd;
- persoon niet onherkenbaar/cropped;
- goedgekeurde Preview blijft design authority;
- geen generieke content/beeldvervanging die betekenis wegdrukt.

### Stap 6 — generieke website-QA
- website-resultaat toetsen aan goedgekeurde Preview en Website Brief;
- >85% doel als productnorm operationaliseren zonder valse pixelprecisie;
- harde FAIL op ontbrekende geverifieerde contactgegevens, genegeerde kritische assets, verboden crops of geschonden correcties.

## Wat nu niet doen

- geen LangGraph/Mem0/Graphiti/CrewAI/Tavily toevoegen;
- geen nieuwe foundation model-migratie als oplossing voor procesdrift;
- geen nieuwe websitegenerator zoeken;
- geen nieuwe grote secondary-process featurebouw;
- geen nieuwe menselijke testcases voordat Golden Path/Adrie baseline betrouwbaar is;
- Plan v0.4 niet herschrijven alleen vanwege implementatiefouten.

## Succescriterium recovery

Na recovery kan een nieuwe korte bouwchat de repo lezen en zonder opnieuw uitleggen:
- zien waar Lumivey staat;
- harde regels kennen;
- juiste testcase kiezen;
- geen eerder opgeloste route opnieuw uitvinden;
- de volgende technische stap uitvoeren zonder betekenis/data te verliezen.
