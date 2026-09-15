# Adrie preview-iteratie zonder rediscovery

Voor de huidige Adrie-regressie is Discovery + brononderzoek verworven projectstate.

Gebruik voor creatieve iteratie de route `/regression/adrie/preview`.

Deze route:
- hergebruikt een vastgelegde Adrie-checkpoint;
- start geen nieuwe Firecrawl-run;
- speelt het Discovery-gesprek niet opnieuw af;
- vraagt alleen opnieuw om de bestaande foto-bronpool wanneer die niet in de browsersessie staat;
- genereert daarna alleen Preview + evaluatie;
- laat bij WARN/FAIL opnieuw Preview genereren met dezelfde state;
- toont de v0-buildknop pas bij PASS.

De volledige `/regression/adrie` route blijft beschikbaar om bewust de hele keten opnieuw te testen, maar hoort niet meer gebruikt te worden voor iedere Preview-iteratie.
