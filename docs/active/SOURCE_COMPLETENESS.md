# Lumivey — Source Completeness

Classificatie: INTERNAL

## Kernregel

**Firecrawl is vervangbare infrastructuur. Broncompleetheid is Lumivey-verantwoordelijkheid.**

Lumivey mag nooit aannemen dat één crawler, één crawlmodus of één samenvatting automatisch een volledige en betrouwbare bronweergave oplevert.

## Wat deze regel betekent

- De crawler is een commodity-component. Firecrawl kan worden vervangen door een andere crawler zonder dat de Lumivey-kern verandert.
- Lumivey is verantwoordelijk voor het vaststellen of relevante broninformatie voldoende compleet is voor Discovery, Understanding, Preview, Website Brief en websiteproductie.
- Een succesvolle HTTP/crawl-status is niet hetzelfde als inhoudelijke broncompleetheid.
- Relevante subpagina’s, profielinformatie, contactgegevens, bewijsstukken, kennisartikelen, referenties, certificeringen, beelden en andere betekenisvolle bronlagen mogen niet stil verdwijnen door limieten, time-outs, `onlyMainContent`, selectie, compressie of AI-samenvatting.
- Bij onvolledigheid moet Lumivey eerst de bronlaag herstellen of gericht aanvullen. Het systeem mag ontbrekende gegevens nooit verzinnen.
- Bronherkomst en evidence blijven waar relevant traceerbaar.

## Toolkeuze

Firecrawl blijft de huidige primaire crawler zolang hij in echte Lumivey-cases voldoende broncompleetheid, snelheid, kostenbeheersing en onderhoudsgemak levert.

Lumivey is niet loyaal aan Firecrawl als product. Als een andere crawler aantoonbaar beter past bij de kernketen, moet die serieus worden vergeleken en zo nodig gekozen.

Een crawlerwissel gebeurt op bewijs, niet op gevoel. Vergelijk op dezelfde testsites minimaal:

1. relevante broninformatie gevonden;
2. profiel- en persoonsinformatie gevonden;
3. contactgegevens gevonden;
4. kennis-/artikel-/referentiepagina’s gevonden;
5. relevante beelden gevonden;
6. bronherkomst behouden;
7. snelheid en foutgedrag;
8. kosten bij verwacht gebruik;
9. operationeel onderhoud en schaalbaarheid.

## Praktische kwaliteitsregel

Voor een bestaande website geldt vóór creatieve interpretatie:

> **Lumivey hoeft niet alles van een website te bewaren, maar moet aantoonbaar genoeg hebben gezien om bewust te kunnen kiezen wat relevant is.**

Selecteren mag. Onbewust missen niet.

## Relatie tot Quiet Web en CORE/COMMODITY

Crawlertechnologie is COMMODITY.

De beslissing wat relevant is, het onderscheid tussen bronfeit en interpretatie, het signaleren van ontbrekende broninformatie, provenance, bronkwaliteit en de vraag of er genoeg context is om door te gaan, vallen onder Lumivey-regie en raken de CORE.
