# Neon Discovery — PUBLIC EXECUTE en sessie-identiteit gate

Peildatum 18 september 2026. Scope: alleen draft PR #49, `test/v0-api-visibility-20260917` en read-only Neon Preview `odd-term-62838732` / `br-green-lake-b2xh1tni` / `neondb`. Geen productie, credentials, grants, functies, policies, dossiers, chat-API of betaalde routes gewijzigd.

## Werkelijk uitgevoerd

- `lib/lumivey/guest-dossier-db-preflight.ts` vereist nu dat `session_user = current_user = lumivey_discovery_app_preview` in de echte SQL-verbinding. Alleen URL-gebruikersnaam/current_user is onvoldoende: een admin die via `SET ROLE` controleert mag geen vals voorlopig PASS veroorzaken.
- De SQL-audit controleert bij beide verwachte SECURITY DEFINER-functies de **effectieve PUBLIC EXECUTE-ACL** via `aclexplode(COALESCE(proacl, acldefault('f', proowner)))`. Zowel expliciete grants als standaard-EXECUTE worden geweigerd. Een `proconfig` met extra onveilige instellingen wordt geweigerd; precies één vaste `search_path=pg_catalog, pg_temp` is vereist.
- `tests/guest-dossier-db-preflight.test.mjs` heeft regressies voor PUBLIC bij elk van beide functies, onbekende rechten, gewisselde sessie, verkeerde DB-identiteit en extra functieconfiguratie.
- CI op commit `3698a6665be0365c0b9bb084bca43b2dc6d25619`: run `35351821902` unit-job `105621526629` success; shutdown-run `35351822151` job `105621527067` success.
- Read-only catalogusquery op expliciete Preview-branch met `pg_proc`, `aclexplode` en `acldefault` gaf nul rijen: in `lumivey_discovery_api` staan nog geen functies. Dit verifieert de syntaxis van de bestaande-functie-inspectie niet voor een daadwerkelijk ingestelde functie-ACL; dat is pas na functieaanmaak toetsbaar.

## Geen onterechte voortgangsclaim

De onder `007`/`008` beschreven functie-SQL is nog review-only commentaar. Geen echte functies, PUBLIC-revokes of minimale EXECUTE-grants uitgevoerd. `lumivey_discovery_app_preview` heeft geen credential/bruikbare connectie; de huidige Neon SQL-tool werkt als `neondb_owner` met BYPASSRLS, dus diens successen zijn nadrukkelijk GEEN bewijs van twee onafhankelijke beperkte A/B-verbindingen. De preflight blijft `PASS_PRELIMINARY`, nooit privacy-/isolatiebewijs. Nieuwe databasefuncties krijgen in PostgreSQL doorgaans standaard PUBLIC EXECUTE totdat die in dezelfde transactie wordt ingetrokken.

## Exact vervolg

Review en corrigeer uitvoerbare SQL voor gast-hervatten en correctie inclusief eigenaarrechten, functie-ACL, RLS, `UPDATE ... RETURNING`, lost-response herstel en gelijktijdigheid. Verifieer een veilige credential-handoff buiten chat/GitHub en voer pas daarna met echte beperkte verbindingen de A/B-, replay-, concurrency- en rollback-proeven uit. Geen `/api/chat`-koppeling, merge of betaalde route-openstelling vóór bewijs. Discovery blijft Preview-readiness bepalen.
