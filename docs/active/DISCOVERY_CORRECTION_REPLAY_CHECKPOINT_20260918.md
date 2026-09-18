# Discovery correction replay — checkpoint 18 september 2026

Scope: uitsluitend draft PR #49 (`test/v0-api-visibility-20260917`), geen main/prod/Neon-mutatie of betaalde v0-aanroep.

## Doel en norm

Een oude website is bron, niet waarheid. Een expliciete ondernemerscorrectie moet behouden blijven na pauzeren/hervatten en een eerdere websiteclaim mag niet als actuele waarheid terugkeren. De Discovery Engine blijft als enige verantwoordelijk voor Preview-readiness. Een account, veel uploads en brondata zijn geen automatische Preview-vrijgave.

## Gebouwd en getest

- `lib/lumivey/discovery-correction-journal.ts`: pure, deterministische replay van reeds door de server geautoriseerde en per dossier geladen events. Controleert dossier-ID, oplopende unieke serversequence, claim-key, expliciete uitspraak, eventsoort, toegangstype en tijd. Corruptie of cross-dossier input geeft een vaste fout en geen gedeeltelijke replay. Behoudt oorspronkelijke uitspraken en historische events; geeft events per claim door aan de bestaande `resolveSourceClaim`.
- `tests/discovery-correction-journal.test.mjs`: simulatie van opslag/hervatten via serialisatie, oude projectmanagementclaim → gecorrigeerd strategisch assetmanagement, expliciete afwijzing en latere herbevestiging, andere-dossier-event, verkeerde volgorde, dubbele sequence, AI-event, ontbrekend bewijs en lege geschiedenis.
- `docs/architecture/sql/005_discovery_correction_events.sql`: REVIEWBAAR ontwerp voor append-only correction events, FK naar gastdossier, globale volgorde, herkomst van geverifieerde gast/accountsessie en FORCE RLS zonder enige policy of app-grant. NIET uitgevoerd. Bewuste grens: de uiteindelijke writer moet toegang/auth, eigenaarschap, exacte door de ondernemer gedane uitspraak, append-only rechten en transacties werkelijk afdwingen. Geen model mag events uitvinden.
- GitHub Actions v0 build safety run `35340601701` unit job `105585378381`: completed success, inclusief nieuwe replay-, source-trust- en betaalde-route-afsluittests. Geen echte DB, auth, blob, build of deployment getest.

## Huidige technische grens

Correcties worden nog NIET in Neon opgeslagen; de guest-dossiertabellen in migration 004 zijn slechts ontwerp; 005 is eveneens alleen ontwerp. Er is nog geen geauthenticeerde route, server-only limited DB adapter, transactie/CAS voor state_version of werkende blob-purge. De huidige webapp bewaart onderdelen in browser localStorage. Replay-tests bewijzen logica op fixtures, niet dat de echte chat, Understanding, Preview, Website Brief en site correcties meenemen. Productieroutes mogen niet worden geopend vanwege deze unit-tests.

## Exact eerstvolgend werk

1. Beoordeel beschikbare veilige server DB-driver en branch-specifieke runtimeconfig zonder secrets op te vragen of privileged owner-role voor de app te gebruiken. Verifieer daadwerkelijke Preview host en beperkt bereikbare rol; stop bij ontbrekende toegang.
2. Onder review: schema 004/005, rechtmatig dossieraccess, app-role SELECT/INSERT zonder UPDATE/DELETE voor events, FORCE RLS, fail-closed tenancy, retentie en durable blob purge. Geen autonome grants/credentials/policies.
3. Pas dan werkelijk: writer captureert exacte ondernemersuitspraak na verificatie; laad events per geautoriseerd dossier bij hervatten; materialiseer claims bij SourceContext/Understanding met CAS op dossier.state_version; test two-connection ondernemer A/B, verloren update, oude site-correctie en wissen van alle gegevens.
4. Pas na dat bewijs propagatie naar Preview/Brief/site en inhoudelijke regressie Michael/Adrie. De zeven betaalde v0-routes blijven 503, draft PR niet mergen.
