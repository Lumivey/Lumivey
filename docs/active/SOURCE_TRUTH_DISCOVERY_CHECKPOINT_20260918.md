# Discovery — oude website is bron, geen waarheid (18 september 2026)

Status: Ruuds expliciete aanscherping op draft PR #49. Deze checkpoint voegt een puur geteste contractfunctie toe; geen route, serveropslag, RLS-policy, Preview-readiness of productiegedrag is hiermee aangesloten.

## Onwrikbare productregel

Een oude website, social, folder, profiel, vooraf ingevuld account of Firecrawl-analyse kan verouderd/onjuist zijn. Lumivey bewaart elke waarneming inclusief bron-ID, bewijs en tijd; alleen een expliciete, in het gesprek vastgelegde uitspraak/correctie van de rechtmatig toegankelijke ondernemer kan een bronclaim bevestigen of verwerpen. De server moet identiteit of gastdossiertoegang en de herkomst van die uitspraak onafhankelijk vaststellen; een meegestuurde `confirmed: true` is nooit voldoende. Oude broninformatie blijft als historisch bewijs beschikbaar maar mag bij een latere correctie niet opnieuw als actuele waarheid worden gepubliceerd.

## Concrete code

`lib/lumivey/source-trust.ts`: pure `resolveSourceClaim` met `source-only` / `unknown` / `confirmed` / `corrected` / `rejected`. Een bron zonder herkomst/bewijs is `unknown`; een bron met bewijs blijft `source-only` zonder ondernemersbevestiging. De nieuwste valide, expliciete, vertrouwd geregistreerde ondernemersuitspraak wint van elke bron. Een afwijzing laat de oude bronclaim niet terugkeren. Unit-tests `tests/source-trust.test.mjs` en CI-workflow toegevoegd. Dit contract accepteert uitsluitend al vertrouwde statements; de functie zelf authenticeert niets en schrijft niets weg.

## Integratiepoort

1. Maak in het gast-/accountdossier append-only expliciete ondernemer-uitspraak-/correctie-events met dossier-id, doelclaim, herkomst (auth-sessie of bewezen gasttoegang), exacte uitspraak, servervolgorde, timestamp en eventuele vervanging; controleer rechtmatige toegang vóór iedere write. Een AI-conclusie of scrape mag geen ondernemers-event maken.
2. Laat SourceContext, Understanding, hervatten, Discovery-readiness, Preview, Website Brief en uiteindelijke site voor claims de centrale prioriteitsregel gebruiken. Bewaar bronherkomst en verworpen claims in het interne dossier, maar toon ze niet als actuele diensten/contactfeiten. Er is nog geen productieadapter: niet claimen dat propagatie werkt.
3. Echte regressie: oude website vermeldt projectmanagement; ondernemer zegt 'dat doe ik niet meer, ik focus op strategisch assetmanagement'; onderbreek en hervat, controleer dat de oude claim niet terugkeert in vraagstelling, Preview, Brief en site. Ook testen: later expliciete herbevestiging, tegenstrijdige bronnen, ontbrekend bewijs, onbereikbaar hervatdossier, andere ondernemer en expliciete privacygrens.
4. De Discovery Engine beslist zelf wanneer er voldoende begrip bestaat voor Preview; veel scrape-data of accountvelden is geen gereedheidsbewijs. Geen automatische vrijgave door deze bronresolver.

## Veiligheid/status

Uitsluitend PR #49; niet mergen vóór de afzonderlijke main-hotfix, zeven afgesloten betaalde v0-routes en runtime-isolatie zijn gewaarborgd. Geen betaalde upstream-aanroepen, geen productie-, Neon- of klantdatawijzigingen door deze commit. Werkelijke gast-/accountopslag, eigenaarsverificatie, correctiepropagatie en end-to-end tests blijven open.
