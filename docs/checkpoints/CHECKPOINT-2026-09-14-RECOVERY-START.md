# CHECKPOINT — Recovery start — 2026-09-14

## Aanleiding

De oorspronkelijke lange Bouwplan-chat liep vast. Een vervolgchat begon met onvoldoende continuïteit en week op punten af van eerder vastgelegde werkwijze. Hierdoor ontstond drift, dubbel uitlegwerk en twijfel over welke Vercel/GitHub-toestand leidend was.

## Wat nu veiliggesteld is

- Huidige `main` is gesnapshot in branch `recovery-2026-09-14-before-reconcile`.
- De Gitgeschiedenis is lineair; er is geen onherstelbare dubbele branchgeschiedenis.
- Michael Golden Path en latere Adrie/Firecrawl-wijzigingen zijn traceerbaar.
- Recovery-documenten zijn toegevoegd in `docs/active/`.
- `AGENTS.md` verplicht toekomstige agents eerst Current State, Non-Negotiables, Build Method en Recovery Plan te lezen.

## Belangrijke technische bevindingen

1. Firecrawl is uitgebreid van homepage scrape naar full-site crawl.
2. Websiteanalyse kapt gecombineerde broninhoud af; latere contactpagina's kunnen daardoor verdwijnen.
3. Firecrawl image URLs worden niet first-class doorgegeven in SourceContext.
4. De normale prepare-flow zet sources als `kind: other`; v0 verstuurt alleen `kind: image` als image attachment.
5. Preview-afkeur schrijft feedback nog niet terug naar Understanding.
6. Correcties zijn nog geen first-class state met harde override/propagation.
7. v0-adapter zelf bevat inmiddels sterke Preview-as-design-authority en asset-guardrails.

## Besluit

Geen blind rollback en geen nieuwe stack. Eerst bestaande datapad, correctiepropagatie en feedbacklus herstellen. Michael blijft Golden Path; Adrie wordt acceptantietest; VoetGemak broninterpretatietest.

## Volgende sessie

Eén taak: herstel datapad voor contactdata + echte beelden en voeg vóór v0 een harde Adrie-check toe die zichtbaar maakt wat uit Firecrawl/Understanding/Website Brief verdwenen is.
