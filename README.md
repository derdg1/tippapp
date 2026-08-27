# TippKick

Persönliche Bundesliga-Tipp-App: eigene Tipps pro Spieltag abgeben, gegen echte
Ergebnisse (via [OpenLigaDB](https://github.com/OpenLigaDB/OpenLigaDB-Samples))
auswerten, Punkte berechnen, Ergebnisse als PDF exportieren, mit
Darkmode-Switch. Die App kann gezielt mit **historischen Saisons** (z. B. 2023)
befüllt werden, um sie gegen bereits abgeschlossene Ergebnisse zu testen.

Einzelbenutzer-App ohne Login und ohne Bestenliste.

## Stack

- **Backend:** [PocketBase](https://pocketbase.io) (SQLite, JS-Hooks, Cron, Custom-Routes)
- **Frontend:** [SvelteKit 5](https://svelte.dev) auf [Bun](https://bun.sh), [Tailwind CSS v4](https://tailwindcss.com) (class-basierter Darkmode)
- **PDF-Export:** clientseitig mit `jspdf` + `jspdf-autotable`
- **Datenquelle:** [OpenLigaDB](https://api.openligadb.de) (aktuell fest auf `bl1`, 1. Bundesliga)

## Projektstruktur

```
tippapp/
├── pocketbase/
│   ├── pb_migrations/    # Collections `matches` und `tipps`
│   ├── pb_hooks/         # Scoring, Sync-Routen, Cron
│   └── Dockerfile
├── frontend/
│   ├── src/lib/api/      # dünne Wrapper um die PocketBase-API
│   ├── src/routes/       # Spieltag, Tabelle, Statistik, Einstellungen
│   └── Dockerfile
└── docker-compose.yml
```

## Lokale Entwicklung

### PocketBase

1. Passende Binary von den [PocketBase-Releases](https://github.com/pocketbase/pocketbase/releases) (Version 0.40.1) herunterladen und in `pocketbase/` ablegen.
2. ```bash
   cd pocketbase
   ./pocketbase serve
   ```
3. Admin-UI unter `http://127.0.0.1:8090/_/` öffnen (beim ersten Start wird ein Superuser-Account angelegt). Die Migrationen in `pb_migrations/` erstellen die Collections `matches` und `tipps` automatisch.

### Frontend

1. ```bash
   cd frontend
   cp .env.example .env
   bun install
   bun run dev
   ```
2. App unter `http://localhost:5173` öffnen.

## Historische Saison importieren

Der Sync-Endpunkt ist idempotent (Upsert über `openligadb_id`), ein Import kann
also gefahrlos mehrfach ausgeführt werden, ohne Duplikate zu erzeugen.

```bash
curl -X POST http://127.0.0.1:8090/api/sync/season/2023
```

Das importiert die komplette Saison 2023 (~306 Spiele) inklusive aller
Ergebnisse. Anschließend lässt sich unter „Spieltag“ ein Tipp auf ein bereits
abgeschlossenes Spiel abgeben — die Punkte werden sofort berechnet.

Alternativ über die Oberfläche: „Einstellungen“ → Saison eingeben → „Saison
importieren“.

Weitere Sync-Endpunkte:

| Route | Beschreibung |
|---|---|
| `POST /api/sync/season/{season}` | kompletten Saison-Import |
| `POST /api/sync/matchday/{season}/{matchday}` | einzelnen Spieltag synchronisieren |
| `GET /api/current-matchday` | aktueller Spieltag/Saison |
| `GET /api/table/{season}` | Tabelle einer Saison |

Ein Cron-Job synchronisiert den aktuellen Spieltag der laufenden Saison alle
15 Minuten automatisch.

## Punkteberechnung

| Tipp | Punkte |
|---|---|
| Exaktes Ergebnis | 4 |
| Richtige Tordifferenz | 3 |
| Richtige Tendenz (Sieg/Unentschieden) | 2 |
| Sonst | 0 |

## Docker-Deployment

```bash
cp .env.example .env
# PUBLIC_PB_URL in .env anpassen!
docker compose up --build -d
```

> **Wichtig:** `PUBLIC_PB_URL` muss vom **Browser des Nutzers** erreichbar
> sein, nicht nur innerhalb des Docker-Netzwerks — das PocketBase-JS-SDK läuft
> clientseitig. `http://pocketbase:8090` funktioniert also nicht; stattdessen
> die tatsächliche Host-IP oder Domain verwenden, z. B. `http://192.168.1.10:8090`.

- PocketBase: `http://<host>:8090`
- Frontend: `http://<host>:3000`
