# Neon Discovery — atomaire correctie: prototype, niet gedeployed

Peildatum 18 september 2026. Alleen draft PR #49 `test/v0-api-visibility-20260917`. Relevante Neon Preview: project `odd-term-62838732`, branch `br-green-lake-b2xh1tni`, database `neondb`. Deze taak wijzigde Neon, Vercel, main, productie, credentials, policies en routes **niet**.

## Gerealiseerd

- `docs/architecture/sql/008_guest_correction_function_review.sql`: volledig gecommentarieerd SQL-prototype van één atomaire correctiehandeling. Dossier-id, server-HMAC-digest, status, vervaldatum en verwachte dossier-versie worden samen gecontroleerd. Een conditionele `UPDATE` verhoogt versie en vervaldatum; hetzelfde SQL-statement voegt exact één event met het letterlijke ondernemersbericht toe vanuit de `UPDATE ... RETURNING`-CTE. Mislukt de insert, dan mag ook de versie-update niet beklijven. Geen modelclaim geldt als geverifieerde ondernemersuitspraak.
- Het ontwerp scheidt gastbewijs van accountbezit en van toestemming om de website te publiceren. Broncorrecties blijven Discovery-data; Preview-readiness blijft uitsluitend bij de Discovery Engine.
- `tests/guest-db-function-review.test.mjs` bewaakt voor zowel hervatten als corrigeren dat de SQL-bestanden volledig gecommentarieerd blijven, noemt kernautorisatie/atomische voorwaarden en bevat een controle tegen generieke app-tabelgrants. Dit zijn **statische contracttests**, geen SQL-uitvoering, DB-isolatiebewijs of onafhankelijke securityreview.
- Workflow `.github/workflows/v0-build-safety.yml` triggert ook op de twee SQL-reviewbestanden en de test. Eerste run `35350209882` faalde uitsluitend omdat de test letterlijk `NOLOGIN` verwachtte terwijl het bestaande hervatontwerp expliciet `cannot log in` zegt. Test gecorrigeerd in commit `56bcc6c4d4e6eecdf4cf09ea7d1e848aa8d5fed2`; `v0 build safety` run `35350299510`, unit job `105616560076`: SUCCESS. Afzonderlijke `v0 emergency shutdown safety` run `35350299512`, job `105616560113`: SUCCESS. Beide runs voeren geen echte Neon-connectie of betaalde v0-call uit.

## Harde veiligheidsgrens / open punten

Geen SQL-functie is geïnstalleerd, geen app-grant verleend, geen wachtwoord ingesteld, geen testdossiers geschreven, geen `/api/chat`-koppeling. Eerder aangemaakte app LOGIN-rol heeft CONNECTION LIMIT 0 en geen wachtwoord; NOLOGIN functie-eigenaar heeft geen klanttabelrechten. Geen echte A/B-test uitgevoerd.

Voor installatie: onafhankelijke review van exacte PostgreSQL-functieprivileges (incl. IDENTITY/RETURNING), eigenaarwisseling zonder blijvend rollenlidmaatschap, SECURE DEFINER search_path en PUBLIC default EXECUTE, RLS + exacte function-owner grants, veilige credential-handoff buiten GitHub/chat, verloren-response scenario bij tokenrotatie, transactiefouten, tenant A/B en concurrent CAS met aparte beperkte verbindingen. Daarna pas corrigeren en hervatten op echte Neon; pas na bewezen toegang de Discovery-chat verbinden. Geen betaalde v0-route heropenen. PR blijft draft.
