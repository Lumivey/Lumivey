# Checkpoint — anti-dubbele v0-build, databasefundering (18 september 2026)

Status: concept-PR #49, niet gemerged of naar productie gebracht. Geen nieuwe v0-generatie.

## Wat gebouwd is
- `docs/architecture/sql/001_v0_build_jobs.sql`: PostgreSQL-jobledger met unieke combinatie eigenaar + goedgekeurde Preview-ID + Brief-hash + asset-hash, toestanden reserved/submitting/submitted/uncertain/completed/failed, tijdvelden en standaard geforceerde RLS.
- `docs/architecture/sql/001_v0_build_jobs.smoke.sql`: rollback-only SQL-rooktest voor sequentiële dubbele reservering/claim en onzekere status. Dit testbestand is NOG NIET uitgevoerd; twee gelijktijdige connecties zijn evenmin getest.
- Visual-reference-fasetiming en read-only build-status-tijdstempels in deze PR. Geen volledige E2E-meting.
- `lib/lumivey/v0-build-identity.ts`: pure, deterministische SHA-256-identiteit voor definitieve Brief en assets, ongeacht JSON-keyvolgorde; weigert ontbrekende/afwijkende PreviewSignature en niet-JSON/circulaire input. Geeft GEEN owner-identiteit of approval; die moeten server-side uit geverifieerde duurzame staat komen. Nog NIET in de betaald-startende route geïntegreerd.
- `tests/v0-build-identity.test.mjs`: 4 lokale Node 22 type-strip unit-tests zijn geslaagd op dezelfde broninhoud: canonieke sleutelvolgorde, separate brief-/assetrevision, PreviewSignature-validatie en ongeldige input. Nog geen database-, API- of concurrencytest.

## Nieuwe, door Ruud zichtbare bevestiging op 18 september
- Beheerde Neon PostgreSQL is via Vercel als `LUMIVEY_DB` aangemaakt, Frankfurt, Free; Vercel-project `lumivey` heeft DB-gerelateerde secret-variabelen voor **Preview**, waaronder `DATABASE_URL` en `DATABASE_URL_UNPOOLED`. De inhoud van die variabelen is niet ingezien.
- In Neon is een afzonderlijke branch `lumivey-preview` aangemaakt vanuit `main` en handmatig geselecteerd voor de SQL Editor, database `neondb`.
- Ruud heeft op die geselecteerde branch `001_v0_build_jobs.sql` uitgevoerd. Screenshot bevestigt vier succesvolle statements (CREATE, CREATE, ALTER, ALTER). Een daaropvolgende read-only `SELECT to_regclass('public.lumivey_v0_build_jobs') AS job_table;` geeft exact `lumivey_v0_build_jobs` terug. Dit bewijst het bestaan van de tabel in Neon `lumivey-preview`, NIET de feitelijke targetbranch achter de Vercel Preview `DATABASE_URL`.
- De verwijzing van Vercel Preview naar exact `lumivey-preview` blijft **onbewezen**; de Integration-weergave en variabelennamen tonen geen branchbinding. Nooit aannemen dat `DATABASE_URL` veilig de testbranch gebruikt zonder afzonderlijke niet-geheime DB-identiteitcontrole.

## Open technische veiligheidsvoorwaarden vóór betaald POST
1. Bestaande `app/api/regression/adrie/build-v0/route.ts` gelezen: geen expliciete server-side owner-check; route roept `createV0Build` rechtstreeks aan. Niet als veilig multi-user systeem presenteren. Geen eigenaar uit body, browser of chat-ID accepteren.
2. Verifieer databasebinding op een niet-geheime manier vanuit Vercel Preview, en bevestig benodigde DB-rol en RLS-rechten. Een SQL-editor-query op Neon bewijst niet dat de applicatie dezelfde branch gebruikt.
3. Test smoke SQL met rollback op bedoelde Preview-branch en echte parallelle claimtests via twee connecties; sla geen credentials/loggeheimen op.
4. Kies server-only PostgreSQL-driver en geverifieerde sessie/operatorauth. Haal eigenaar uit sessie en Preview-approval uit duurzame server state. Maak de bestaande route fail-closed tot die checks bestaan; wijzig niet blind productie.
5. Integreer `makeV0BuildIdentity` na server-side checks, reserveer transactioneel en claim precies eenmaal voor `createV0Build`. De fingerprint op zichzelf blokkeert GEEN dubbele calls. Bij timeout/onbekende upstreamrespons nooit opnieuw versturen zonder reconciliatie.
6. Bestaande job/status teruggeven bij duplicaat; vervolgens private owner/chat/exact-version screenshot-reuse en volledige gemeten E2E. Dashboard toont partiële timings afzonderlijk van een gemeten volledige run.

## Waarom de route nog niet automatisch is aangesloten
`package.json` en `package-lock.json` bevatten nog geen PostgreSQL-driver in het beschikbare branchbeeld, de repo toont geen geverifieerde account-/operatorauth en de Vercel-branchbinding is niet vastgesteld. Alleen een DB-driver toevoegen of een nieuwe variabele gebruiken zou geen veilig werkende idempotency garanderen. Geen live credits, geen claim van een werkende anti-dubbele-build-gate. Exact vervolg: branchbinding + authenticatiepad toetsen, server-only driver, route-gate + atomische DB claim, concurrency en refresh tests.
