# Checkpoint — eenmalige v0-aanroep achter databasecontract

Datum: 18 september 2026. Alleen concept-PR #49. Geen merge, geen nieuwe v0-call, geen productie-uitrol.

## Wat is toegevoegd
- `lib/lumivey/v0-build-gate.ts`: geïsoleerde, driver-onafhankelijke orchestratie die alleen na geverifieerde autorisatie/goedkeuring aangeroepen mag worden. Durable interface: reserveer op unieke identiteit, atomische eenmalige claim `reserved -> submitting`, commit vóór de betaalde v0-POST, sla chat-ID op, en behoud `uncertain` bij onduidelijke netwerkrespons of onzekere opslag. Een bestaande reservering wordt teruggegeven zonder opnieuw te genereren. Er is bewust GEEN in-memory, browser- of Blob-lock ingevoerd.
- `tests/v0-build-gate.test.mjs`: tests met een gesimuleerde ledger voor gelijktijdige oproepen, refresh, timeout, verloren claim, falende opslag en ontbrekende eigenaar/hash. Deze tests bewijzen alleen de orkestratielogica onder de gesimuleerde interface en NIET de PostgreSQL-concurrentie of auth.

## Wat nadrukkelijk NIET gereed is
- Het interfacecontract is nog niet gekoppeld aan Neon; geen PostgreSQL-driver of atomische database-implementatie toegevoegd.
- Bestaande betaalde `app/api/regression/adrie/build-v0/route.ts` roept nog direct v0 aan; deze nieuwe module wordt daar nog niet gebruikt en blokkeert dus nog geen dubbele kosten.
- Vercel Preview DATABASE_URL -> exacte Neon-branch `lumivey-preview` nog niet geverifieerd; Neon SQL Editor op die branch bewijst de runtimebinding niet.
- Geen geverifieerde server-side operator-/accounteigenaar of duurzame Preview-approval store; geen RLS-/rolrechtencheck; geen echte twee-sessies-concurrencytest.
- Unit-testresultaten moeten apart worden vastgesteld door CI of lokale Node-testuitvoering; een Vercel-build is geen DB-test.

## Volgende concrete taak
1. Kies verifieerbare operator-/sessieauth zonder eigenaar uit de body te vertrouwen; haal de goedgekeurde finale Brief+assets server-side uit betrouwbare opslag.
2. Read-only branchidentiteit uit Vercel Preview controleren via private serverdiagnostiek (geen credentials/host teruggeven) en rolrechten verifiëren; niet op Neon `main` migreren.
3. Voeg passend beheerd PostgreSQL-clientpakket toe met lockfile en geteste transactionele ledgerimplementatie; let op FORCE RLS: service-rol moet een expliciet veilige policy/recht hebben, niet blind aannemen dat eigenaar alles mag.
4. Koppel de route fail-closed aan `submitV0Once`, test twee gelijktijdige databaseconnecties, refresh, timeout en statusreconciliatie. Pas na bewijs een gecontroleerde betaalde E2E.
5. Houd partiële statustijden afzonderlijk voor toekomstig dashboard; verzin geen volledige doorlooptijden.
