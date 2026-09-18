# Checkpoint — anti-dubbele v0-build, databasefundering (18 september 2026)

Status: concept-PR #49, niet gemerged of naar productie gebracht. Geen nieuwe v0-generatie.

## Wat gebouwd is
- `docs/architecture/sql/001_v0_build_jobs.sql`: PostgreSQL-jobledger met unieke combinatie eigenaar + goedgekeurde Preview-ID + Brief-hash + asset-hash, toestanden reserved/submitting/submitted/uncertain/completed/failed, tijdvelden en standaard geforceerde RLS.
- `docs/architecture/sql/001_v0_build_jobs.smoke.sql`: rollback-only SQL-rooktest voor sequentiële dubbele reservering/claim en onzekere status. Dit testbestand is NOG NIET uitgevoerd; twee gelijktijdige connecties zijn evenmin getest.
- Visual-reference-fasetiming en read-only build-status-tijdstempels in deze PR. Geen volledige E2E-meting.

## Nieuwe, door Ruud zichtbare bevestiging op 18 september
- Beheerde Neon PostgreSQL is via Vercel als `LUMIVEY_DB` aangemaakt, Frankfurt, Free; Vercel-project `lumivey` heeft DB-gerelateerde secret-variabelen voor **Preview**, waaronder `DATABASE_URL` en `DATABASE_URL_UNPOOLED`. De inhoud van die variabelen is niet ingezien.
- In Neon is een afzonderlijke branch `lumivey-preview` aangemaakt vanuit `main` en handmatig geselecteerd voor de SQL Editor, database `neondb`.
- Ruud heeft op die geselecteerde branch `001_v0_build_jobs.sql` uitgevoerd. Screenshot bevestigt vier succesvolle statements (CREATE, CREATE, ALTER, ALTER). Een daaropvolgende read-only `SELECT to_regclass('public.lumivey_v0_build_jobs') AS job_table;` geeft exact `lumivey_v0_build_jobs` terug. Dit bewijst het bestaan van de tabel in Neon `lumivey-preview`, NIET de feitelijke targetbranch achter de Vercel Preview `DATABASE_URL`.
- De verwijzing van Vercel Preview naar exact `lumivey-preview` blijft **onbewezen**; de Integration-weergave en variabelennamen tonen geen branchbinding. Nooit aannemen dat `DATABASE_URL` veilig de testbranch gebruikt zonder afzonderlijke niet-geheime DB-identiteitcontrole.

## Open technische veiligheidsvoorwaarden vóór betaald POST
1. Lees de bestaande `app/api/regression/adrie/build-v0/route.ts` en verifieer sessie-/operatorautorisatie; de gelezen route heeft geen expliciete server-side owner-check en roept `createV0Build` rechtstreeks aan. Niet als veilig multi-user systeem presenteren. Geen eigenaar uit body, browser of chat-ID accepteren.
2. Verifieer databasebinding op een niet-geheime manier vanuit Vercel Preview, en bevestig de benodigde DB-rol en RLS-rechten. Een sql-editor-query op Neon bewijst niet dat de applicatie dezelfde branch gebruikt.
3. Test de reeds voorbereide smoke SQL met rollback op de bedoelde Preview-branch en vervolgens echte parallelle claimtests via twee connecties; herstel testresultaten zonder credentials/loggeheimen in repo op te slaan.
4. Integreer via geautoriseerde server-only database-driver en transactionele reservering. Identiteit: geverifieerde eigenaar + expliciet goedgekeurde Preview-ID + canonieke definitieve Brief-/asset-hashes. Eén `reserved -> submitting` claim moet committen VOOR de enige v0 POST. Bij timeout of onduidelijke upstreamrespons nooit automatisch opnieuw versturen, eerst reconciliëren.
5. Bestaande job teruggeven bij duplicaat, daarna private owner/chat/exact-version screenshot-reuse en volledige gemeten E2E. Performance-dashboard toont partiële timing afzonderlijk van een gemeten volledige run.

## Waarom nog niet automatisch aangesloten
`package.json` bevat nog geen Neon/PostgreSQL-driver; de repo toont geen geverifieerde account-/operatorauth. Een nieuwe driver of extra env-binding zonder verificatie van rechten en branch zou de schijn van anti-dubbele-build-veiligheid geven terwijl de bestaande endpoint nog steeds v0 direct kan aanroepen. Geen ongeteste productieroute wijzigen of live credits gebruiken. Volgende kleine codewijziging vereist het vastleggen van een server-only auth- en database-accesspad, dan atomische ledgerintegratie met tests.
