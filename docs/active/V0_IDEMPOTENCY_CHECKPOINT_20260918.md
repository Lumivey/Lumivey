# Checkpoint — anti-dubbele v0-build, databasefundering (18 september 2026)

Status: alleen PR #49; NIET gemerged, NIET uitgerold, GEEN database gemigreerd of v0-call gedaan.

## Gebouwd
- `docs/architecture/sql/001_v0_build_jobs.sql`: PostgreSQL-schema voor één buildjob per eigenaar + goedgekeurde Preview-ID + definitieve Brief-hash + asset-hash; uniek databaseconstraint, statussen reserved/submitting/submitted/uncertain/completed/failed, chat-/versie-ID, timingvelden. RLS staat standaard dicht. Commentaar documenteert transactiereservering en een eenmalige atomische `reserved -> submitting` claim vóór netwerk-POST.
- `docs/architecture/sql/001_v0_build_jobs.smoke.sql`: rollback-only basiscontrole op dubbele reservering, dubbele claim en niet opnieuw claimen na onzekere toestand. Nog niet uitgevoerd: er is geen geautoriseerde PostgreSQL-verbinding vastgesteld.

## Onmisbare vervolgimplementatie
1. Kies en configureer een beheerde transactionele PostgreSQL-database en server-only credentials, plus geverifieerde sessie/operatorautorisatie. Vercel get_project gaf hier 403; er is GEEN project-/databasebeheer gedaan.
2. Pas de migratie gecontroleerd toe, test constraints en gelijktijdigheid vanuit twee aparte connecties. Controleer rolrechten/RLS voor iedere uitvoerende DB-rol; geen browserdirecte DB toegang.
3. Koppel `app/api/regression/adrie/build-v0/route.ts` aan de database-ledger: eigenaar server-side bepalen; exact goedgekeurde Preview/signatuur valideren; vaste canonieke Brief-/asset-hashes maken. Reserveer atomisch en claim maximaal eenmaal, vóór `createV0Build`. Bestaande jobs geven huidige status terug; niet nog een `POST /v1/chats`.
4. Bij onbekende afloop van een upstream POST blijft status `submitting`/`uncertain`. Eerst handmatig/reconciliërend de v0-chat aantoonbaar vinden; geen automatische retry, zelfs niet na lease timeout. Alleen na bewezen veilige toestand kunnen expliciete herstelacties plaatsvinden.
5. Pas daarna private screenshotcache per eigenaar + chat + exacte versie, met toegangscontrole en gevalideerde inhoud, door UI en QA gedeeld.

## Grenzen
De SQL-files zijn een daadwerkelijk aangemaakte migratie en rooktest, maar nog geen werkende idempotency-beveiliging: de bestaande betaalde start-route is ongewijzigd en moet tot integratie operator-only/test-only blijven. Niet claimen dat dubbele kosten nu onmogelijk zijn. `updatedAt-createdAt` van v0 blijft slechts een gedeeltelijke meting. Geen productie, betaling of nieuwe generatie.
