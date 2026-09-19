# Neon Preview — veilige wachtwoordbestandcontrole (19 september 2026)

INTERNAL / CORE. Alleen draft PR #49. Neon project `odd-term-62838732`, Preview-branch `br-green-lake-b2xh1tni`, database `neondb`. Geen DB/rollen/grants/secrets, main, productie of Vercel gewijzigd door deze codewijziging.

## Uitgevoerd en aangetoond

- Read-only Neon-cataloguscontrole: `lumivey_discovery_app_preview` heeft LOGIN, maar `CONNECTION LIMIT 0`, geen wachtwoord, geen BYPASSRLS, geen schema-USAGE en geen EXECUTE op de twee dossierfuncties. Dit blijft de uitvoeringsblokkade voor een echte twee-verbindingen-A/B-test.
- Read-only schema-ACL-controle: `lumivey_discovery_api` kent geen publieke USAGE of CREATE toe; app heeft geen USAGE/CREATE. Schema `public` heeft wel standaard publieke USAGE maar geen publieke CREATE. Niet verwarren met toegang tot de afgeschermde Discovery-tabellen.
- Het afzonderlijke read-only smoke-programma controleerde op native Windows ten onrechte de POSIX-bestandsrechten niet: `process.platform === 'win32'` werd als voldoende beschouwd. Nu weigert het native Windows expliciet: voer het uitsluitend uit in een gecontroleerde Linux/WSL-omgeving met een passfile buiten de repo en mode 0600. De testcode gebruikt ook `fileURLToPath` voor correcte bestandslocaties op Windows.
- GitHub Actions op codecommit `03be2214db60c9192b2fc89c7ce51ea840b7a6ee`: `v0 build safety` run `35435007355` en `v0 emergency shutdown safety` run `35435007390` beide success. Dit bewijst uitsluitend automatische tests en gesloten betaalde routes; geen echte databaseverbinding.

## Exacte volgende uitvoerpoort

Een bevoegde operator richt buiten chat/GitHub veilig een Preview-only credential in voor exact de bestaande app-rol en stelt maximaal twee gelijktijdige verbindingen in. Gebruik nooit `neondb_owner`; geen wachtwoord, URL of sleutel in logs, PR of chat. Neon Preview-compute-host opnieuw onafhankelijk verifiëren. Daarna het bestaande alleen-lezen `scripts/guest-preview-two-session-smoke.mjs` onder Linux/WSL met afgeschermd `PGPASSFILE` draaien. De functiegrants en echte A/B-dossiertest pas na afzonderlijke review en veilig fixture-/grant-herstel. Tot die tijd: `BLOCKED_CREDENTIAL_AND_GRANTS`; geen A/B-PASS claimen, geen betaalde v0-route openen, niet mergen of naar productie brengen.
