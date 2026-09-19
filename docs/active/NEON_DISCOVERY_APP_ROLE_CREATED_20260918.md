# Neon Preview — Discovery-applicatierol ingericht (18 september 2026)

## Toestemming en scope

Ruud gaf expliciet toestemming voor het inrichten van een aparte minimaal bevoegde applicatiegebruiker en strikt gecontroleerde toegangsfuncties **uitsluitend** in de Neon Preview-database, gevolgd door een echte A/B-isolatietest. Project `odd-term-62838732`, branch `br-green-lake-b2xh1tni` (`preview/test/v0-api-visibility-20260917`), database `neondb`; draft PR #49. Main/productie, Vercel secrets, bestaande accountconfiguratie en zeven betaalde v0-routes zijn buiten scope.

## Werkelijk uitgevoerd en onafhankelijk gelezen

1. Expliciete Preview-query vóór wijziging: `current_database()=neondb`, administratieve uitvoeringsrol `neondb_owner` met BYPASSRLS, beide relevante tabellen bestaan; nieuwe doelrol bestond nog niet.
2. Eerste `CREATE ROLE`-poging met niet-bestaande PostgreSQL-optie `NOCONNECTION` faalde zonder rol aan te maken; gecorrigeerd naar `CONNECTION LIMIT 0`.
3. Succesvol uitgevoerd uitsluitend op expliciete Preview branch: `CREATE ROLE lumivey_discovery_app_preview LOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS NOREPLICATION CONNECTION LIMIT 0`.
4. Onafhankelijke `pg_authid`-controle bevestigt: `rolcanlogin=true`, `rolbypassrls=false`, `rolsuper=false`, `rolcreatedb=false`, `rolcreaterole=false`, `rolinherit=false`, `rolreplication=false`, `rolconnlimit=0`, `password_present=false`. Ondanks LOGIN kan deze rol nog niet als applicatie inloggen: geen wachtwoord en nul toegestane verbindingen. **Dit is een veilige rolreservering, geen werkende databaseverbinding.**
5. Onafhankelijke catalogus-/privilegecontrole bevestigt voor dossiers, assets en correctie-events: FORCE RLS ingeschakeld, nul policies, en voor de nieuwe rol `SELECT=false`, `INSERT=false`, `UPDATE=false`, `DELETE=false`. Er zijn geen grants, routines, policies of secrets verstrekt.

## Bewuste grens

Er is nog GEEN toegangsfunctie aangemaakt of vrijgegeven; dit vereist een zorgvuldig gereviewde concrete functie-implementatie, een strikt privilege- en eigenaarmodel (een SECURITY DEFINER onder `neondb_owner` omzeilt RLS!), vaste `search_path`, geen PUBLIC EXECUTE, expliciete dossier- en HMAC-digestcontrole, transactieve correctie/CAS, geen SQL-injectie of logging van credentials. Een gastcode alleen is geen geverifieerd account, en een zelf ingestelde GUC of dossier-ID is geen autorisatie.

Er is nog GEEN onafhankelijk A/B-databasetest gedaan. Niet testen met administratieve BYPASSRLS-connectie of een gesimuleerde `SET ROLE` en dat presenteren als twee echte verbindingen. De applicatie gebruikt deze rol niet; de chat slaat nog niets in Neon op.

## Exact vervolg met bestaande toestemming

1. Review en implementeer uitsluitend Preview-serverfuncties plus veilige EXECUTE-only rechten; bepaal beschermde schema/eigenaar zonder onnodige BYPASSRLS, expliciete gasttokenvalidatie per operatie, optioneel vroeg account apart en bewezen gast→account claim.
2. Richt password/secret uitsluitend via veilige server-secret-handoff in, verifieer de werkelijke Preview-host en app-login zonder wachtwoord in logs/chat/repo te tonen. Pas na audit connection limit instellen en strikt afgebakende EXECUTE-grants verlenen.
3. Bewijs met twee onafhankelijke beperkte verbindingen: eigen dossier A/B toegestaan, cross-access geweigerd, verkeerde/verlopen code, hervatting na nieuwe verbinding, CAS race, duurzame retentie en objectbyte-verwijdering. Tot die tijd FAIL CLOSED.
4. Pas dan Discovery-chat/Understanding/Preview aansluiten; de Discovery Engine alleen beslist over Preview-readiness. PR #49 draft houden, productie en betaalde routes ongewijzigd.
