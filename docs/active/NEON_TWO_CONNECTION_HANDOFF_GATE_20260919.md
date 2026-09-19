# Neon Preview — poort naar onafhankelijke A/B-verbindingstest

Peildatum 19 september 2026. INTERNAL / CORE. Alleen `odd-term-62838732` / `br-green-lake-b2xh1tni` / `neondb`. PR #49 draft; niets op main/productie, Vercel, Auth of paid routes gewijzigd.

## Feiten, opnieuw gecontroleerd met read-only Neon SQL

- De vooraf aangemaakte `lumivey_discovery_app_preview` heeft `LOGIN=true`, `CONNECTION LIMIT 0`, **geen wachtwoord**, `BYPASSRLS=false`.
- Op het dossier-API-schema: `USAGE=false`; beide signatures `rotate_guest_resume(uuid,text,text)` en `record_guest_correction(uuid,text,bigint,text,text,text,text)` hebben `EXECUTE=false` voor deze app-rol.
- Een onafhankelijk ingelogde tweeverbindingentest is daarmee momenteel niet uitvoerbaar. De op 18 september geslaagde test gebruikte één tijdelijk geautoriseerde beheerverbinding; dat is uitdrukkelijk geen A/B-isolatiebewijs.
- De aangebrachte read-only preflight weigert nu ook een URL zonder wachtwoord, dubbele `sslmode` (ook `verify-full` plus `disable`), afwijkende poort of fragment. De bestaande controles voor de onafhankelijk bepaalde hostname, `verify-full`, precieze rol, drie tabellen, RLS, kolomrechten, function owner en PUBLIC-ACL blijven gelden. Mock- en shutdown-CI op codecommit `99abdcc55c2a4a98aca49dfee2ac09df00df6865`: beide workflows success. Dit is **geen** live connectietest.

## Eén veilige credential-handoff, buiten GitHub en chat

Een bevoegde operator moet binnen de **specifieke Preview-branch** een afzonderlijk wachtwoord voor de bestaande app-rol veilig in de toepasselijke secretmanager / afgeschermde Preview-runner beschikbaar maken, en `CONNECTION LIMIT` beperkt verhogen om daadwerkelijk twee aparte verbindingen mogelijk te maken. Geen password, DATABASE_URL, HMAC-key, .env of screenshot met geheimen in deze repo, PR, logs of chat. Niet het `neondb_owner`-wachtwoord gebruiken. Verifieer de precieze endpoint-host buiten de runtime tegen de Preview-branch in Neon; alleen de databasenaam `neondb` bewijst nooit de branch. TLS hostname- en certificaatcontrole (`verify-full`) verplicht. Bij onduidelijke veilige handoff: STOP, geen wachtwoord resetten naar tool/chat-output.

## Gesloten testvolgorde, nog NIET uitgevoerd

1. Zonder publiek/Vercel deployment en zonder klantdata: twee **afzonderlijk geauthenticeerde verbindingen** als `lumivey_discovery_app_preview` met `session_user=current_user` en twee verschillende actieve backend-sessies aantonen; controleer host, TLS en exact Preview-target.
2. Voor de geïsoleerde testtransactie uitsluitend minimale schema-USAGE en signature-gebonden functie-EXECUTE aan deze rol toekennen; nooit tabel-, kolom-, sequence-, CREATE- of PUBLIC-rechten. Alleen als de functions, owner, RLS, PUBLIC ACL en argumentvalidatie eerst onafhankelijk zijn gecontroleerd. Gebruik beheerdersrechten nooit als testidentiteit.
3. Met uitsluitend fictieve expliciet als test gemarkeerde dossiers A/B: A->A wel, A->B en B->A niet, geen dossierdata in denial; verkeerde/verlopen/gebruikte token; parallelle rotatie maximaal één succes; CAS-concurrentie maximaal één correctie; rollback bij eventfout; replay na hervatten.
4. Plan fixture-cleanup en herstel voor dossier, correction-events, assets/object bytes vóór committed fixture insert. Geen CASCADE op correction-events: niet achteloos `DELETE dossier` uitvoeren. Verifieer nul resterende synthetische rijen én geen extra rechten; trek tijdelijke USAGE/EXECUTE in bij failure/exit (ook als de harness crasht, via aparte auditable recovery). Als multi-session test afbreekt: eerst rechten herstellen, dan rapporteren.
5. Pas ná groen onafhankelijk isolatiebewijs, veilige browser-cookie/HMAC-protocolreview en verloren-HTTP-response-herstel bekijken of een permanent beperkt EXECUTE-grant en server-only `/api/chat`-adapter gerechtvaardigd zijn. Geen Preview->paid v0, production of PR-merge door deze test.

**Status:** echte SQL-functies geïnstalleerd en eerste single-connection functionele test geslaagd; de onafhankelijke A/B-isolatiemijlpaal blijft **BLOCKED_CREDENTIAL_AND_GRANTS**. Geen schijn-PASS op basis van mocks, adminimpersonatie, catalogus of één verbinding.
