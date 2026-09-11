# Lumivey Checkpoint 002 — Websitegenerator als onderzoekslijn

**Datum:** 11 september 2026

---

## Doel van dit checkpoint

Dit checkpoint markeert een bewuste koerscorrectie in de bouwfase van Lumivey.

De complete cirkel bestaat inmiddels als werkende keten, maar de kwaliteit van de visuele vertaling van gesprek naar preview blijft het kritieke punt. De eigen generator heeft aantoonbaar vooruitgang geboekt, maar het onderzoek van de afgelopen dagen laat ook zien dat veel ontwikkeltijd kan verdwijnen in compositie, beeldregie, typografie, art direction en samenhang op paginaniveau.

Daarom wordt niet automatisch verdergegaan met het steeds verder uitbouwen van een volledig eigen websitegenerator.

Dit checkpoint past binnen Het Plan v0.3: Lumivey mag technologie en leveranciers wijzigen zolang de reden waarom Lumivey bestaat overeind blijft. Het eerdere uitgangspunt van controlled generative composition blijft een mogelijke route, maar is vanaf dit moment geen onomkeerbare architectuurkeuze.

---

## Wat blijft VAST

- Discovery is het hart van Lumivey.
- De ondernemer moet zich gehoord en begrepen voelen voordat techniek leidend wordt.
- De preview moet de ondernemer menselijk raken.
- De WoW-factor ontstaat uit **plaatje + praatje + vooral de combinatie daarvan**.
- Lumivey moet begrijpen wie de ondernemer is en dat begrip vertalen naar de juiste website-opdracht.
- De ondernemer bewaakt herkenning; Lumivey bewaakt identiteit, waarheid, context en richting.
- Technologie blijft dienend en uitwisselbaar.
- Een externe websitegenerator mag nooit bepalen wie de ondernemer is.

De mogelijke moat van Lumivey blijft dus niet "betere HTML" of een eigen builder, maar:

**Discovery → begrip → herkenning → goede vertaling → passende uitvoering → correctie → ontzorging.**

---

## Nieuwe onderzoekshypothese

Misschien hoeft Lumivey de technische websitebouw niet volledig zelf uit te voeren.

Bestaande AI-websitegenerators ontwikkelen snel en kunnen mogelijk de technische en visuele bouwrol beter, sneller of goedkoper uitvoeren dan een volledig zelfgebouwde generator.

Lumivey kan dan de **regisseur** zijn in plaats van per definitie ook de volledige renderer/builder.

De onderzoeksketen wordt:

**Discovery → interpretatie → websitebrief → externe generator → kwaliteitscontrole → correctieronde → preview**

Daarna blijft de rest van de Lumivey-cirkel relevant: goedkeuring, publicatie, beheer, wijzigingen en continuïteit.

---

## Kandidaten voor onderzoek

Eerste focus:

1. **v0 van Vercel**
2. **Lovable**

Daarnaast meenemen:

3. **Framer**
4. **Bolt**

De eigen Lumivey-generator blijft onderdeel van de vergelijking en wordt niet weggegooid. Hij vormt zowel een kandidaat als een referentie voor kosten, controle, snelheid en integratiemogelijkheden.

---

## Rolgrens: wat blijft van Lumivey en wat mag extern

### Lumivey bepaalt

- wie de ondernemer is;
- welke feiten bevestigd zijn;
- wat interpretatie is en wat nog onzeker is;
- identiteit, motivatie, verhaal en herkenningsankers;
- doelgroep en zakelijke richting;
- inhoudelijke prioriteiten;
- wat prominent of juist terughoudend moet worden getoond;
- visuele richting en beeldmateriaal;
- welke onderdelen absoluut behouden moeten blijven;
- welke pagina's / functies nodig zijn;
- welke claims niet mogen worden verzonnen;
- kwaliteits- en Quiet Web-randvoorwaarden.

### De externe generator mag uitvoeren

- visuele compositie;
- layout;
- technische websitebouw;
- responsive gedrag;
- componentopbouw;
- styling;
- technische iteraties binnen de opdracht.

### Niet toegestaan

De externe generator mag niet zelfstandig de identiteit van de ondernemer invullen, het verhaal herschrijven tot marketingfantasie of bronmateriaal vervangen omdat een generiek alternatief makkelijker te genereren is.

---

## Te onderzoeken ondernemerprofielen

Het onderzoek wordt niet op één mooie demo gebaseerd. Minimaal deze profielen moeten afzonderlijk worden getest:

### 1. Starter

Nog geen bestaande website en mogelijk nog zoekend naar richting.

Te toetsen:
- kan Lumivey vanuit gesprek, identiteit en eventueel foto's een sterke websitebrief maken;
- kan de generator voldoende eigenheid creëren zonder bestaand merkanker;
- blijft het resultaat menselijk en geloofwaardig.

### 2. Ervaren ondernemer zonder website

Ondernemer kent zijn vak, klanten en werkwijze goed maar heeft geen bestaande website.

Te toetsen:
- kan gesprek alleen voldoende richting geven;
- worden goudklompjes uit Discovery visueel vertaald;
- ontstaat een site die duidelijk van deze ondernemer is.

### 3. Ervaren ondernemer met oude website

Complexere migratiecase waarbij bestaande inhoud, logo, foto's, historie, projecten en praktische informatie behouden moeten blijven.

Firecrawl krijgt hier een grote rol.

Te toetsen:
- volledige relevante site-inventaris;
- verschil tussen bronfeit en ondernemer-bevestigd feit;
- behoud vóór vervangen;
- moderniseren zonder onbedoeld te rebranden;
- omgaan met grote hoeveelheden inhoud en meerdere vervolgpagina's.

### 4. Ondernemer met visuele inspiratie

Later toevoegen als aparte onderzoekslijn.

De ondernemer kan bestaande websites, foto's of andere voorbeelden aanwijzen als inspiratie.

Te toetsen:
- begrijpt Lumivey *waarom* iets aanspreekt;
- kan die inspiratie worden vertaald zonder kopiëren;
- blijft de uiteindelijke site herkenbaar van de ondernemer zelf.

---

## Eerste referentiecases

We starten met bestaande cases waarvoor al menselijk beoordeeld referentiemateriaal bestaat.

Minimaal:

- **Adrie / AssetPouwer**
- daarna andere bestaande referentiecases zoals Michael en De Hippe Knip waar dat onderzoek waarde toevoegt.

Adrie is geschikt als eerste test omdat er al een menselijke referentiepreview bestaat waarmee herkenning, sfeer en ontwerpkwaliteit kunnen worden vergeleken.

Het doel is niet dat een externe generator de referentie pixel voor pixel kopieert. Het doel is vaststellen of Lumivey's begrip kan worden omgezet in een resultaat dat minstens dezelfde menselijke herkenning en ontwerpkwaliteit benadert.

---

## Beoordelingscriteria

Per generator/case onderzoeken we minimaal:

- kwaliteit van de eerste website;
- WoW / herkenning;
- visuele samenhang;
- eigenheid tussen verschillende ondernemers;
- omgang met echte foto's en bestaande branding;
- kwaliteit van AI-beelden indien nodig;
- snelheid van genereren;
- aantal benodigde correctierondes;
- mogelijkheid om correcties gericht door te voeren;
- API- en automatiseringsmogelijkheden;
- exporteerbaarheid / eigenaarschap van code en assets;
- hostingmogelijkheden en kosten;
- kosten per gegenereerde website;
- kosten van correcties / regeneraties;
- kosten en beperkingen bij meerdere klanten;
- mogelijkheid om elders te hosten en later aan te passen;
- betrouwbaarheid en schaalbaarheid;
- risico op lock-in;
- aansluiting op Lumivey's publicatie- en beheerproces.

Kosten en snelheid horen dus expliciet bij de kwaliteitsafweging; niet alleen het mooiste resultaat telt.

---

## Besluit voor de bouwfase

**PAUZE OP GROTE ARCHITECTUURKEUZES ROND DE EIGEN GENERATOR.**

Totdat dit onderzoek voldoende duidelijkheid geeft:

- geen grote nieuwe architectuurlagen bouwen die Lumivey onnodig vastzetten aan een volledig eigen websitegenerator;
- bestaande generatorcode bewaren als werkend experiment en kandidaat;
- alleen wijzigingen doen die nodig zijn voor het onderzoek, koppeling of behoud van leerresultaten;
- Discovery, Understanding, bronnen, Firecrawl, websitebrief en kwaliteitscontrole mogen juist verder worden ontwikkeld, omdat deze waarde houden ongeacht welke generator uiteindelijk bouwt.

De kernvraag is vanaf nu niet:

> **Hoe maken we onze eigen generator goed genoeg?**

maar:

> **Welke bouwroute levert, onder regie van Lumivey, de beste combinatie van menselijke herkenning, visuele kwaliteit, snelheid, kosten, controle en schaalbaarheid?**

---

## Beslispunt na onderzoek

Na voldoende vergelijkende tests kiezen we bewust uit ten minste deze scenario's:

1. **Eigen generator** — als die aantoonbaar de beste totaalscore geeft.
2. **Externe generator** — als die de bouwrol beter uitvoert en voldoende programmeerbaar/controleerbaar is.
3. **Hybride model** — Lumivey maakt begrip, websitebrief, assets en kwaliteitscontrole; één of meerdere externe generators bouwen; eigen code verzorgt delen die strategisch belangrijk zijn.
4. **Meerdere generators als capability** — later mogelijk per type opdracht de best passende bouwmotor kiezen, zolang de ondernemer één Lumivey ervaart.

Geen voorkeur wordt nu vooraf als eindarchitectuur vastgezet.

---

## Wat verandert NIET aan Het Plan

Dit checkpoint verandert niet de strategische kern van Het Plan v0.3.

Het concretiseert juist eerdere principes:

- technologie is gereedschap, geen identiteit;
- Lumivey moet provider- en modelonafhankelijk kunnen denken;
- de mens komt vóór systeemlogica;
- begrijpen komt vóór maken;
- herkenning blijft de menselijke toets;
- geen 95% component perfectioneren wanneer een betere route mogelijk bestaat;
- snel genoeg bouwen om te leren + zorgvuldig genoeg kiezen om niet vast te lopen.

De bouwmotor mag veranderen.

**De ziel niet.**
