# Adrie timeout recovery

De volledige regressieroute kan bij stap 1 lang blokkeren omdat volledige website-crawl en Discovery-reactie in dezelfde gebruikersflow zitten. Voor Preview-iteratie is dat ongewenst en onnodig.

Besluit:
- volledige crawl/Discovery alleen bewust draaien wanneer die lagen opnieuw getest moeten worden;
- voor Preview-iteratie een checkpoint gebruiken;
- Preview-iteratie mag niet afhankelijk zijn van een nieuwe volledige Firecrawl-run;
- time-outs in de volledige route mogen het creatieve vervolgtraject niet blokkeren.
