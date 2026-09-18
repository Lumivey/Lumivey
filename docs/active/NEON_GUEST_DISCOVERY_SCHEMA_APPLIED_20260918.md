# Neon Preview — gastdossier en correctiehistorie: schema toegepast

Datum: 18 september 2026. Scope: project `odd-term-62838732` (LUMIVEY_DB), uitsluitend Vercel Preview branch `br-green-lake-b2xh1tni` / `preview/test/v0-api-visibility-20260917`, database `neondb`. Geen default/main branch, productie, publieke API, eigenaarstoekenning, grants, Neon Auth-configuratie of betaalde v0-call gewijzigd. PR #49 blijft draft.

## Uitgevoerde controle

- `Neon.get_branch` bevestigt branch-id, naam `preview/test/v0-api-visibility-20260917`, `creation_source=vercel`, `default=false`, `primary=false`, parent `br-lively-mouse-b27qw51h`.
- Read-only SQL op expliciete project/branch/db vóór mutatie: dossier-, asset- en correctietabellen ontbraken; bestaande eigenaarstabel `lumivey_v0_owner_memberships` was aanwezig. SQL-beheerverbinding meldt `neondb_owner`; dit is GEEN veilige applicatierol en mag nooit in runtime worden gezet.
- De statements uit de reeds gereviewde migratieontwerpen `docs/architecture/sql/004_guest_discovery_dossiers.sql` en `005_discovery_correction_events.sql` zijn samen als twaalf niet-destructieve DDL-statements via `Neon.run_sql_transaction` toegepast op uitsluitend de Preview branch. Transactie gaf twaalf lege resultaatsets zonder gerapporteerde fout.
- Onafhankelijke cataloguscheck: exact drie tabellen `lumivey_guest_discovery_dossiers`, `lumivey_guest_discovery_assets`, `lumivey_discovery_correction_events`; elk `relrowsecurity=true`, `relforcerowsecurity=true`, `policy_count=0`. De bestaande `lumivey_v0_worker_limited` heeft bij elk `SELECT=false`, `INSERT=false`. Geen applicatiegrants of policies gegeven, geen credentials aangemaakt.
- Aanvullende gecombineerde rijtellingenquery, inclusief auth-gebruikers, werd door toolbeveiliging geblokkeerd. Daarom zijn de aantallen rijen en gebruikerstotalen in dit checkpoint uitdrukkelijk NIET geverifieerd; niet opnieuw proberen via omweg. Er zijn door deze uitvoering geen `INSERT`-statements gedaan.

## Betekenis en harde grenzen

Schema 004 bevat server-gegenereerde dossier-id, alleen keyed digest van hervatcode, `state_version` voor toekomstige concurrencycontrole, `discovery_state`, een voorgestelde 30-dagen-idle-TTL, status, claimvelden en private-assetmetadata; ruwe foto- of documentbytes horen in aparte private objectopslag. Schema 005 bevat append-only bedoelde correctie-events met dossierrelatie, server-identity-volgorde, letterlijke ondernemersuitspraak en herkomst. **Append-only is nog slechts privilegeontwerp, niet operationeel bewezen.**

De drie tabellen zijn bewust ontoegankelijk voor de bestaande beperkte worker en publieke gebruikers. De enige gebruikte SQL-verbinding is een eigenaar met BYPASSRLS, uitsluitend voor expliciet beheer, nooit voor een app-route of klantdata. Schema alleen toont geen veilige gasttoegang en bewijst geen ondernemer-A/B-isolatie; er bestaan nog geen werkende sessie-/gastadapter, RLS-policies, veilige beperkt-bevoorrechte login, objectopslag-deletion worker of echte concurrentietest. SQL-foreign key van correctie-events verwijst zonder CASCADE naar dossier; verwijdering en retentie moeten dus als expliciete, veilige volgorde (events, assetbytes en dossier, met duurzame retries) worden ontworpen en beproefd vóór gebruik. De geplande 30 dagen is een productvoorstel, geen vastgestelde juridische termijn.

## Eerstvolgende echte poort

1. Read-only onderzoek naar gedocumenteerde Neon Auth-serverintegratie, daadwerkelijke Preview-runtimebranch en least-privilege toegangsopties; geen secrets, geen `neondb_owner` runtime, geen blind role-provisioning (eerder Neon create-role API schond `no_login`).
2. Ontwerp een begrensde server-only gastdossieradapter met bewezen tokenverificatie, versiecontrole, exact vastgelegde ondernemeruitspraak, één dossier per autorisatie, TTL, expliciete verwijdering en objectbytes-purge. Laat de runtime fail-closed zolang echte geautoriseerde rol/verbinding ontbreekt.
3. Test werkelijk met twee onafhankelijke beperkte DB-connecties/identiteiten en tijdelijke uitsluitend door test beheerde dossiers: A kan eigen dossier/correctie lezen, B nooit A, verlopen/gestolen token afgewezen, correctie na herstart aanwezig, concurrentie geen lost update, schoon verwijderpad. Maak geen verzonnen auth-users of ongeverifieerde membership aan.
4. Pas na bewezen beveiliging aansluiten op `/api/chat`, Understanding, Preview en Website Brief. Preview-readiness blijft exclusief Discovery. PR #49 niet mergen en zeven betaalde routes gesloten laten.
