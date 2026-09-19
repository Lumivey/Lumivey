# Discovery-dossier access — Preview security gate (18 september 2026)

Scope: uitsluitend Neon project `odd-term-62838732`, branch `br-green-lake-b2xh1tni`, database `neondb` en draft PR #49. Geen productie-/default branch, Vercel variables, Neon Auth, credentials, roles, grants, policies, data of betaalde v0-routes gewijzigd in deze stap.

## Read-only evidence

Een expliciet op de Preview branch uitgevoerde catalogusquery bevestigt dat `lumivey_guest_discovery_dossiers`, `lumivey_guest_discovery_assets` en `lumivey_discovery_correction_events` alle drie `relrowsecurity=true`, `relforcerowsecurity=true` en **nul RLS-policies** hebben. De bestaande `lumivey_v0_worker_limited` heeft op elk `SELECT=false` en `INSERT=false`. De PostgreSQL ACL-inspectie met `aclexplode` ziet op geen van de drie een PUBLIC SELECT/INSERT grant. Een eerste variant met `has_table_privilege('PUBLIC', ...)` gaf een fout omdat PUBLIC geen rolnaam is; de correcte ACL-inspectie is daarna gelukt. Dit is een privilege-/cataloguscontrole, NIET de onafhankelijke A/B-isolatietest of een verificatie van datarijtellingen.

## Toegangskeuze voor review

Nieuwe ontwerpnotitie: `docs/architecture/sql/006_guest_dossier_access_review.sql`. Deze is UITSLUITEND commentaar/documentatie; geen uitvoerbare migratie. Gebruik een geverifieerde server-only gasttoken: 256-bit willekeurig, HMAC op de server met sleutel buiten SQL, alleen de digest wordt in de database opgeslagen. De digest is een bearer credential, daarom eveneens nooit teruggeven aan de browser of loggen. Rechten via een strikt beperkte LOGIN-applicatierol die alleen EXECUTE krijgt op nauw afgebakende, gereviewde databasefuncties; geen generieke tabelrechten. Functies controleren per operatie dossier-id, digest, actieve status, vervaldatum en transactievolgorde. Op gast→account is zowel geldig gastbewijs als onafhankelijk geverifieerde accountsessie vereist. Een zelf ingestelde `app.dossier_id`-GUC mag NOOIT als zelfstandig autorisatiebewijs dienen. RLS blijft FORCE/deny by default; SECURITY DEFINER mag pas na audit van vaste search_path, PUBLIC-revoke, scoped SQL, functierechten, eigenaarprivileges en A/B-proeven worden overwogen.

## Huidige blokkade en exacte testpoort

Er is nog geen veilig geprovisioneerde, in Vercel Preview geverifieerde LOGIN-rol, geen goedgekeurde functie-implementatie of credential-handoff en geen twee onafhankelijke beperkte verbindingen. Neon create_postgres_role API eerder onveilig gebleken; niet herhalen. `neondb_owner` is BYPASSRLS en mag uitsluitend beheer doen. Daarom GEEN testdossiers of correcties via deze owner invoeren en GEEN open app endpoint. Eerst review en veilig provisioneren van beperkte verbinding plus auth/routines; daarna echte A/B-cross-access, verkeerde/verlopen token, replay, concurrency, bestandbytes-wissen en herstel testen. Alleen na bewijs koppelen aan de chat. De Discovery Engine blijft exclusief Preview-readiness bepalen. PR #49 blijft draft; zeven betaalde routes 503.
