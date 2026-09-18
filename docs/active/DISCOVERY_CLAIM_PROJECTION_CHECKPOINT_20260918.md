# Discovery-claims: projectie en werkelijke integratiegrens — 18 september 2026

Scope: uitsluitend draft PR #49; niet gemerged, geen productie-, Neon- of betaalde v0-wijzigingen.

## Wat is uitgevoerd

- `lib/lumivey/discovery-claim-projection.ts`: maakt uit reeds vertrouwd, dossiergebonden geladen bronclaims plus append-only correctie-events drie gescheiden weergaven: `confirmedFacts`, `sourceCandidates`, `rejectedClaims`. Het hergebruikt `replayTrustedCorrections` en `resolveSourceClaim`; een latere correctie/afwijzing verdringt de oude websiteclaim. Nieuwe expliciete feiten zonder oude bron blijven mogelijk. Ongeldige, dubbele of cross-dossier input blokkeert zonder gedeeltelijke resultaten.
- `tests/discovery-claim-projection.test.mjs`: geherlaad Adrie-dossier, gecorrigeerde dienst versus aparte onbevestigde locatie, afwijzing, nieuwe bevestiging, foutieve dossiermix en veel onbevestigde bronnen. CI-workflow aangepast.
- GitHub Actions run `35341241873`, job `105587382427`: unit-teststap en volledige job completed success. Dit bewijst uitsluitend pure code met testdata.

## Hard ontdekte integratieblokkade

`app/api/chat/route.ts` accepteert op dit moment het volledige `messages`-transcript en `sourceContexts` rechtstreeks uit de request body; `isSourceContextArray` controleert alleen `Array.isArray`. De browser is dus nog de drager van de context. Een geclaimde correctie, bron of bevestiging uit zo'n payload kan niet als geautoriseerd of persistent worden aangenomen. De app heeft momenteel ook geen Postgres-driver of geverifieerde account-/gast-dossieradapter in `package.json`. Migraties 004 en 005 staan als niet-uitgevoerde ontwerpen in de repo. De huidige `neondb_owner` is een BYPASSRLS-rol en mag niet als runtimeverbinding worden gebruikt.

**Verboden shortcut:** projectie direct op willekeurige `body.sourceContexts` of `body.messages` loslaten en vervolgens spreken van bevestigde ondernemersfeiten. Geen nieuwe schrijf-/hervatroute openen met onbetrouwbare clientsessies. De projectie wordt pas echt onderdeel van de keten wanneer deze op gecontroleerde, server-opgeslagen, dossiergebonden data draait.

## Precies volgende stap

1. Beoordeel de bestaande guest-retentie en privacy-/verwijderarchitectuur, inclusief opslag van echte bestandbytes, purge en de FK in 005 vóór migratie-uitvoering; geen automatische migratie/grants.
2. Configureer een server-only beperkt DB-login/driver plus runtimebewijs van de exacte Preview-branch zonder privileged owner en zonder secrets te tonen. Herbeoordeel auth-origins/e-mailverificatie en gast-resume-toegang.
3. Implementeer één transactiegebonden server-repository die dossieraccess bewijst, correctie-events als letterlijke uitingen opslaat, dossier-events in sequence-volgorde ophaalt en versie-/concurrentieconflicten afvangt. Echte DB-tests met twee gescheiden connecties voor A/B, CAS, onderbreking/hervatten, verlopen dossier en volledige gegevensverwijdering.
4. Pas dan pas de projectie toe op server-Understanding, Preview-readiness en vervolgketen, met Michael/Adrie-regressie. Preview-readiness blijft uitsluitend bij Discovery.

Status: projectie/code en unit-tests gereed; fysieke gegevensopslag, geverifieerde identiteit, live chat-integratie en end-to-end juistheid NIET gerealiseerd. Zeven betaalde v0-routes blijven 503, PR #49 draft.
