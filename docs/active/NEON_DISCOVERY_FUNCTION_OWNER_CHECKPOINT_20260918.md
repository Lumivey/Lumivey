# Neon Preview — gescheiden functie-eigenaar ingericht

Datum: 18 september 2026. Scope uitsluitend `LUMIVEY_DB` (`odd-term-62838732`), Preview-branch `br-green-lake-b2xh1tni`, database `neondb`. Ruud heeft expliciet toestemming gegeven voor een minimale Preview-applicatiegebruiker en gecontroleerde toegangsfuncties. Productie/default branch, Vercel, Auth en betaalde routes blijven ongemoeid. PR #49 blijft draft.

## Werkelijk uitgevoerd

1. Read-only vóórcontrole: `current_database()=neondb`, dossier- en correctietabellen aanwezig, bestaande `lumivey_discovery_app_preview` niet-privileged, beoogde functie-eigenaar bestond nog niet. SQL-tool gebruikt voor beheer `neondb_owner` (BYPASSRLS): nooit als runtimeverbinding gebruiken.
2. Op uitsluitend de genoemde Preview-branch uitgevoerd: `CREATE ROLE lumivey_discovery_function_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS CONNECTION LIMIT 0`.
3. Onafhankelijke rolcontrole via `pg_authid` en `pg_auth_members`: nieuwe functie-eigenaar bestaat, `rolcanlogin=false`, `rolsuper=false`, `rolbypassrls=false`, `rolcreatedb=false`, `rolcreaterole=false`, `rolinherit=false`, `rolconnlimit=0`, geen wachtwoord, geen lidmaatschap van andere rollen. Reeds bestaande `lumivey_discovery_app_preview`: LOGIN=true, connectielimiet 0, geen wachtwoord of verhoogde rechten, geen rollenlidmaatschap.
4. Per rol en per tabel expliciet geverifieerd: `lumivey_guest_discovery_dossiers`, `lumivey_guest_discovery_assets`, `lumivey_discovery_correction_events` hebben RLS ENABLE+FORCE, elk nul policies. Beide rollen hebben op elk `SELECT=false`, `INSERT=false`, `UPDATE=false`, `DELETE=false`.
5. Kolommen van de drie bestaande Preview-tabellen uit `information_schema.columns` gelezen als basis voor functiereview. **Geen** klantdata gelezen of ingevoerd.

## Wat deze stap wel en niet bewijst

De rolscheiding is daadwerkelijk op de Preview-database aanwezig en fail-closed: er is GEEN werkende applicatietoegang, geen verbinding/wachtwoord uitgegeven, geen SECURITY DEFINER-functie, geen grants, geen RLS-policy en geen onafhankelijke A/B-dossiertest. Een beperkte NOLOGIN-functie-eigenaar is op zichzelf geen garantie dat toekomstige functies veilig zijn. Geef de functie-eigenaar nooit BYPASSRLS of generieke app-toegang. `neondb_owner` mag niet de eigenaar worden van klantgerichte SECURITY DEFINER-functies. Maak nooit een applicatie-URL uit een beheer-URL.

## Volgende uitvoerpoort

Ontwerp/review exact de minimale server-only dossierfuncties: 256-bit gastcode server-side HMAC → uitsluitend keyed digest naar SQL, dossier-id+digest+status+expiry per operatie, atomaire digestrotatie en versiecontrole, exact ondernemerscitaat en correctie-event in dezelfde transactie. Vast `search_path`, geen dynamische SQL, REVOKE EXECUTE FROM PUBLIC vóór zichtbaarheid, app slechts schema USAGE + specifieke EXECUTE; geen direct tabelrecht. RLS-policy voor functie-eigenaar uitsluitend binnen aantoonbaar getoetste privileges. Test vooraf functie-eigenaar, functie-definities, ACL en verkeerd/verlopen bewijs; vervolgens met afzonderlijke beperkte verbindingen A/B-isolatie, hervatting, concurrerende correcties en retentie/blobverwijdering. Vercel Preview-binding en geheimen pas na gecontroleerde handoff, nooit in GitHub of een chat. Geen `/api/chat`-koppeling vóór die resultaten. Discovery beslist zelfstandig Preview-readiness, ongeacht de hoeveelheid bronnen of accountstatus.