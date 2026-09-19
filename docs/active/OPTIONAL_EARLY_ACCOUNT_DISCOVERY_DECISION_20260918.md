# Besluit — vrije instap Lumivey: gast of vrijwillig vroeg account (18 september 2026)

Status: productbesluit van Ruud, vastgelegd op draft PR #49. Ontwerp en acceptatiecriteria; GEEN geimplementeerde login, dossierkoppeling of routevrijgave. Plan v0.4 blijft norm voor het menselijke Discovery-gesprek en de Preview. Nieuw expliciet gebruikersbesluit verduidelijkt dat accountaanmaak na Preview de standaard is, GEEN verplicht exclusief moment.

## Twee gelijkwaardige instappen

**A. Begin met gesprek (standaard).** Geen accountplicht, onmiddellijk Discovery; tijdelijk gastdossier slaat gesprek, bronnen, correcties en voortgang op met veilige hervatmogelijkheid en bewaartermijn. Na herkenning/goedkeuring Preview mag account volgen; gastdossier pas na bewijs van rechtmatige toegang aan geverifieerd account koppelen.

**B. Maak direct vrijwillig account.** De ondernemer mag bij de start een account maken, zelf bedrijfsgegevens invullen, een bestaande website-URL, foto's, documenten en andere bronnen toevoegen en daarna Discovery starten. Geen verplicht compleet profiel, vragenlijst of wachtrij vóór het gesprek. De verstrekte context is beschikbaar voor Lumivey vóór de eerste Discovery-reactie, met provenance, toestemming en status 'door ondernemer aangeleverd', niet automatisch 'geverifieerd' of 'waar'. Onbevestigde broninterpretatie mag niet als ondernemersuitspraak worden gepresenteerd. Gebruik deze startinformatie om iets persoonlijks te herkennen, relevante ontbrekende betekenis te onderzoeken en overbodige herhaalvragen over te slaan; hooguit één natuurlijke vraag per keer.

## Eén dossier, verschillende toegangsmodellen

Het dossier kan ontstaan als gast of onder geverifieerd account; dezelfde Discovery/Understanding/Preview-pijplijn en datarepresentatie gelden. Aparte, geautoriseerde transactie voor gast→account-koppeling nadat zowel veilige gasttoegang als geverifieerde accountsessie zijn aangetoond. Nooit samenvoegen op bedrijfsnaam, browserfingerprint of alleen opgegeven e-mailadres. Account met bestaand dossier hervat die context na sessieverificatie. Een gebruiker kan zijn gegevens wijzigen; expliciete correcties overschrijven bronhypothesen en blijven first-class. Beperkte dataretentie gastdossier en passend apart klantdossierbeleid; veilige bestandsopslag plus verwijdering van bytes en metadata. Ondertekening van goedgekeurde Preview/bouw blijft apart beveiligd en vindt nooit uitsluitend plaats door aanmelden, invullen of een lokale knop.

## UX acceptatie

- Landing biedt gesprek direct en optioneel 'Ik wil eerst mijn gegevens invullen' / 'Account aanmaken', zonder account te promoten als voorwaarde.
- Beide paden blijven omkeerbaar en leiden naar dezelfde menselijke Discovery: geen intakebot, geen gegevens dubbel uitvragen.
- Vroege informatieverrijking gebeurt binnen redelijke wachttijd; mocht Firecrawl haperen, gesprek start door met reeds beschikbare context en status van nog niet verwerkte bron, zonder een onbevestigd feit te verzinnen.
- Terugkerende gast ziet alleen eerder dossier met geldig hervatbewijs; terugkerend account alleen na geverifieerde sessie.
- De accountkeuze verandert de betekenis van Preview-'Deze klopt' niet: instemming met richting vóór definitieve geautoriseerde bouwgoedkeuring.

## Bouwvolgorde en veiligheidsgrens

1. Implementeer server-side gastdossier + gepaste opslag van uploads, veilige hervatting, verwijderen en TTL; test werkelijk, niet alleen unit-mocks.
2. Implementeer Preview-only geverifieerde accountflow en server-controlled eigenaarstoewijzing; configureer verificatie/origins voordat deze route extern beschikbaar is.
3. Voeg optionele invoer vóór gesprek toe; laad server-side bronnen, breng ze naar de bestaande SourceContext/Understanding met herkomst en onzekere status. Geen verzonnen bevestiging.
4. Implementeer geautoriseerde gast→account-dossieroverdracht en regressietests (gelijke mens, andere browser, gestolen/ongeldige hervatlink, account A/B, dubbel indienen, vervallen dossier, broncorrectie en retentie).
5. Preview-goedkeuring, tenant-isolatie, ledger en v0 eenmalige bouw afzonderlijk aantonen voordat betaalde routes ooit open gaan.

Geen productiewijziging, geen DB-migratie of betaalde v0-aanroep door dit document. PR #49 blijft draft; zeven betaalde mutatieroutes blijven gesloten.
