# Neon Preview — afgeschermde functie-namespace en hervatfunctieontwerp

Datum: 18 september 2026. Alleen project `odd-term-62838732`, branch `br-green-lake-b2xh1tni` (`preview/test/v0-api-visibility-20260917`), database `neondb`, PR #49 blijft draft. Geen main/productie/Vercel-config/Auth/credentials/paid v0-routes gewijzigd.

## Werkelijk uitgevoerd

- `Neon.get_branch` bevestigde Vercel Preview-branche, `default=false`, `primary=false`.
- Ontwerp in `docs/architecture/sql/007_guest_resume_function_review.sql` gecommit: hervatfunctie met dossier-id + oude HMAC-digest, status/expiry, atomaire digestrotatie, generieke weigering en benodigde security-/concurrencytestpunten. Het bestand is *uitsluitend commented, review-only*; de functie is niet gedeployed.
- Neon Preview transactie uitgevoerd: `CREATE SCHEMA IF NOT EXISTS lumivey_discovery_api`, `REVOKE ALL ... PUBLIC`, `REVOKE ALL ... lumivey_discovery_app_preview`, `GRANT USAGE ... lumivey_discovery_function_owner`.
- Onafhankelijke catalogusquery: schema bestaat, applicatierol `USAGE=false`, `CREATE=false`; afzonderlijke NOLOGIN functie-eigenaar `USAGE=true`, `CREATE=false`; aantal functies in dit schema **0**. De SQL-functie is dus bewust niet open gezet.

## Belangrijk: deze stap is nog geen werkende hervatting

De functie moet nog als echte migratie worden gereviewd (Postgres `UPDATE ... RETURNING` en RLS/SELECT-rechten, consistente timestamp, functiewijziging naar NOLOGIN eigenaar, PUBLIC-revoke binnen dezelfde transactie en standaardrechten). De bestaande tabellen hebben op dit checkpoint nog geen voor de applicatie geactiveerde toegangsroute. Geen wachtwoorden uitgegeven; de loginrol heeft `CONNECTION LIMIT 0`; geen echte onafhankelijk geauthenticeerde databaseverbinding, twee-ondernemerstest of chatadapter. Een functie die door een BYPASSRLS-owner wordt aangemaakt mag niet met die eigenaar als SECURITY DEFINER worden vrijgegeven.

## Volgende exacte testpoort

1. Review de exacte functie en SQL-migratie inclusief eigenaarswissel, default EXECUTE, grants, SECURITY DEFINER search_path, status/expiry, tokenrotatie bij verloren HTTP-response en foutafhandeling. Maak de rollen nergens lid van elkaar in blijvende toestand.
2. Pas functies/policies alleen toe met veilige grants en directe onafhankelijke catalogusaudit. Nooit een generiek clienttabelrecht of PUBLIC EXECUTE.
3. Richt veilig credential-handoff in buiten GitHub/chat en test met twee echte beperkte databaseverbindingen: A leest A, B kan A niet lezen, verkeerde/verlopen/reused digest, parallelle hervatting, correctie CAS, verliesvrije rollback en veilige verwijdering van assets/bytes.
4. Pas daarna `/api/chat` aansluiten. De Discovery Engine blijft exclusief verantwoordelijk voor Preview-readiness. PR #49 blijft draft en zeven v0 mutatieroutes afgesloten.
