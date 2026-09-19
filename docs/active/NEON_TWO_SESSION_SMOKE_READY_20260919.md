# Neon Preview — onafhankelijke verbindingstest als afgeschermde smoke voorbereid

Peildatum: 19 september 2026. INTERNAL / CORE. Alleen Neon project `odd-term-62838732`, branch `br-green-lake-b2xh1tni` / `preview/test/v0-api-visibility-20260917`, `neondb`; GitHub draft PR #49. Geen wijziging aan productie, main, Vercel, Auth, gebruikersdossiers of betaalde v0-routes.

## Feiten en uitgevoerd

- `Neon.list_branch_computes` met **expliciet Preview-branch-id** bevestigt de niet-gepoolde read/write-host `ep-gentle-recipe-b29ex0vh.c-6.eu-central-1.aws.neon.tech`; pooler heeft een andere host en is niet het doel van deze test. Host/branch voor iedere echte uitvoering opnieuw tegen Neon metadata controleren, want hostname alleen bewijst niet blijvend branchidentiteit.
- Nieuw `scripts/guest-preview-two-session-smoke.mjs`: operator-only en uitsluitend read-only. Gebruikt `psql` zonder dependency in app, exact gepinde host, db `neondb`, gebruiker `lumivey_discovery_app_preview`, twee **gelijktijdige** losse processen/verbindingen en `pg_backend_pid()`. Controleert `session_user=current_user=app`, db, twee verschillende backends en daadwerkelijk `pg_stat_ssl.ssl=true`; vereist `verify-full`. Hij opent geen dossiers en wijzigt geen SQL-state.
- Wachtwoord staat nooit in de broncode, argv, logs of tool-output; de operator levert uitsluitend een absoluut pad naar een eigen PGPASSFILE **buiten de repo**, op Unix uitsluitend met strikte bestandsrechten. Script accepteert geen `PGPASSWORD` of `DATABASE_URL`, erft geen PGHOSTADDR/PGOPTIONS/PGSERVICE en onderdrukt foutuitvoer van `psql`. Twee expliciete bevestigingen van branch-id én host zijn nodig. Geen veilige overdracht => proces stopt vóór verbinden.
- Nieuwe `tests/guest-preview-two-session-smoke.test.mjs` controleert zonder database/credentials dat ontbrekende handoff en onjuiste host/branch weigeren. CI-workflow draait deze test naast bestaande suites; `v0 build safety` run `35434775967` en `v0 emergency shutdown safety` run `35434775934` zijn beide `success` op commit `853dbd84b32ee690abaa56dd17dd458b6e0a7765`.

## Niet gedaan / geen schijnbewijs

- De echte smoke is **niet** uitgevoerd: app-rol heeft volgens laatste read-only Neon controle `CONNECTION LIMIT 0`, geen wachtwoord, geen API-schema-USAGE en geen functie-EXECUTE. CI heeft geen DB-connectie en geen secrets. Er zijn dus nog geen twee afzonderlijk geauthenticeerde daadwerkelijke sessies of A/B-dossier-isolatie bewezen.
- Deze smoke is slechts de **eerste verbindingseis**; twee verschillende PostgreSQL-backends zijn geen bewijs van ondernemer A vs B. Daarvoor moet een aparte live, scoped test met de functies volgen. De applicatie kan niet bij tabellen, en beide functies zijn nog niet vrijgegeven aan de app.

## Exacte volgende uitvoeractie

1. Bevoegde operator gebruikt Neon-console/afgeschermde credentialmanager (niet chat, GitHub, screenshots of connector-output) om **alleen deze Preview-app-rol** een apart wachtwoord en strikt begrensde capaciteit voor twee verbindingen te geven. Geen owner-account, geen tabelrechten. Leg credential veilig buiten repository vast. Verifieer actuele Preview-host bij Neon.
2. Voer smoke op een beveiligde operator-runner uit met beschikbaar `psql`, absolute externe passfilelocatie (`LUMIVEY_PGPASSFILE`), `LUMIVEY_CONFIRMED_PREVIEW_BRANCH=br-green-lake-b2xh1tni` en `LUMIVEY_CONFIRMED_PREVIEW_HOST` gelijk aan actuele Neon-host. Plaats geen passfile-inhoud of uitvoer met credentials in communicatie.
3. Alleen als smoke **werkelijk** `PASS_TWO_INDEPENDENT_PREVIEW_SESSIONS_ONLY` geeft, plan minimale tijdelijke schema-USAGE / signature-EXECUTE en scoped testfixtures plus cleanup, waarna echte A/B-correctie-/rotatie-/concurrentietest. Bewaar een fail-closed herstelpad voor ingetrokken grants bij crash.

**Status: `BLOCKED_CREDENTIAL_AND_GRANTS`.** Niet claimen dat A/B-isolatie groen is, functies aansluiten op `/api/chat` of preview al productiegereed is.
