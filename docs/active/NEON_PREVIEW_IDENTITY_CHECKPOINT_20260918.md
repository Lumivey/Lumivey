# Neon Preview identity — gecontroleerde volgende stap

Datum: 18 september 2026. Scope: draft PR #49. Geen runtime code, databasewijziging, geheime waarde of betaalde v0-call.

## Gecontroleerde feiten

- Ruud heeft Neon-tabel `lumivey_v0_build_jobs` in SQL Editor op de handmatige branch `lumivey-preview` aangemaakt; `to_regclass('public.lumivey_v0_build_jobs')` gaf de tabelnaam terug.
- Vercel project `lumivey` heeft `DATABASE_URL` en Neon-variabelen met scope **Preview**. Het scherm toont geen onderliggende branch.
- Vercel Preview voor branch `test/v0-api-visibility-20260917` was Ready op commit `d74852` (een eerdere deployment, niet noodzakelijk het laatste branch-HEAD).
- Productiehotfix PR #50 is gemerged in `main` als `d265768`; Vercel Production toont Ready. Zeven bekende betaalde v0-ingangen zijn in hoofdcode gesloten. Niet bewezen: individuele live endpoint-responses of algemene AI-kostenroutebeveiliging.
- De Vercel connector geeft ondanks opnieuw verbinden geen bruikbare team-/projecttoegang; geen aanname dat dit een fout in de website-/DB-runtime is.

## Cruciaal onderscheid

`DATABASE_URL` met scope Preview bewijst alleen dat de variabele ingesteld is, niet dat hij naar de handmatig aangemaakte Neon-branch verwijst. Het aantreffen van de tabel is ook geen sluitend branchbewijs: een andere branch kan dezelfde tabel door cloning bezitten. `NEON_PROJECT_ID` identificeert een project, geen branch. `current_database()` en `current_user` identificeren database en rol, niet de branch.

## Eerstvolgende implementatie, strikt afgeschermd

1. **Identiteit onafhankelijk vastleggen:** lees in Neons console voor de expliciete branch `lumivey-preview` de compute-endpoint-ID en verwachte database/rol af. Leg alleen de niet-geheime endpoint-identiteit vast in een beveiligde serverconfig, niet in een clientpagina. Geen verbinding-URL, wachtwoord of token in GitHub, logs of chat.
2. **Veilige runtimevergelijking:** in uitsluitend server-only code vergelijk de host van de werkelijk geladen `DATABASE_URL` met de onafhankelijk vastgelegde hostname/endpoint-identiteit; bij ontbreken of verschil STOP. Neon kan een andere branch per Vercel Preview-deployment aanmaken: dat is geen PASS voor de persistente `lumivey-preview`-branch. Geen openbare diagnostische API, geen response met host, URL, database- of rolnamen.
3. **Alleen-lezen SQL na host-match:** controleer aanwezigheid van ledger, `relrowsecurity` + `relforcerowsecurity`, huidige DB/rol en of de rol de verwachte toegang heeft. Verborgen uitvoer naar operator-only controlemiddel met uitsluitend `PASS`/`BLOCKED`-codes; geen selectie van bestaande klantrecords. `has_table_privilege` is niet voldoende voor daadwerkelijke toegang als RLS policies ontbreken.
4. **Schrijfproef uitsluitend na auth-/RLS-ontwerp:** bepaal backend role/policy en voer pas dan een expliciete transactie met `ROLLBACK` uit voor een dummy job; test zowel geweigerde onbevoegde toegang als toegestane eigenaar. Zet `FORCE ROW LEVEL SECURITY` niet uit om tests groen te maken.
5. **Integratie en concurrerende claim:** verbind pas na geslaagde branch/rol/owner-check een server-only PostgreSQL-adapter aan de one-shot gate. Twee onafhankelijke DB-verbindingen moeten bewijzen dat slechts één `reserved -> submitting`-claim ontstaat, gecommit vóór upstream POST. Onzekere uitkomst nooit automatisch opnieuw indienen.

## Stopregels

Geen betaalde route heropenen, geen migratie op `main`, geen Neon-gegevens naar een publieke Preview diagnostics URL en geen inferentie van branch uit variabelenscope. De bestaande zeven routes blijven gesloten. Afzonderlijke v0-correcties moeten worden gebonden aan geverifieerde eigenaar, chat en versie.

## Exact volgende actie

Implementatie van een **server-only, niet-publiek aangeroepen** verificatiefunctie met injectable read-only DB query en configuratie voor onafhankelijk bevestigde endpointidentiteit, plus unit-tests op mismatch/missing settings/RLS; zonder werkelijke DB-connectie of paid v0-call. Daarna de referentie-endpointidentiteit via Neon en werkelijk gebruikte Preview-config verifiëren voordat het resultaat als branch-PASS wordt aangeduid.
