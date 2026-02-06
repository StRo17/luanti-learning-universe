# Luanti Learning Universe

## System-Architektur

Das System besteht aus drei Hauptkomponenten:

1. **Luanti**: Eine Minetest-Modifikation, die in der Minetest-Umgebung läuft und Lerninhalte bereitstellt.
2. **Directus**: Ein Headless CMS, das als Backend dient und die Daten verwaltet (Quests, Benutzer, Fortschritte usw.).
3. **Next.js Frontend**: Eine React-basierte Webanwendung, die das Dashboard und die Quest-Übersicht für Schüler und Lehrer bereitstellt.

Die Kommunikation erfolgt wie folgt:
- Luanti sendet Benutzerfortschritte an Directus über Webhooks
- Das Frontend lädt Daten von Directus über die REST-API

## Setup-Guide

### Voraussetzungen
- Docker und Docker Compose

### Starten des Systems
1. Klonen Sie das Repository
2. Erstellen Sie eine `.env`-Datei basierend auf `.env.example`
3. Führen Sie folgenden Befehl aus:
```bash
docker-compose up -d
```
4. Nach dem Start ist das Frontend unter `http://localhost:3000` und Directus unter `http://localhost:8055` erreichbar

## Quest-Management

So erstellen Sie eine neue Quest in Directus:

1. Melden Sie sich in Directus an (Standard: `admin@example.com` / `d1r3ct5`)
2. Navigieren Sie zur Collection "Quests"
3. Erstellen Sie einen neuen Quest-Eintrag:
   - **Titel**: Der Name der Quest
   - **Beschreibung**: Eine kurze Beschreibung
   - **Schritte**: Fügen Sie Schritte hinzu (jeder Schritt hat einen Titel, eine Beschreibung und optional einen CodeCombat-Level-Link)
4. Speichern Sie den Quest

Die Quest wird automatisch im Frontend und in der Luanti-Welt verfügbar

## Provider-Integration (CodeCombat)

Um ein CodeCombat-Level einzubinden:

1. Erstellen Sie einen neuen Schritt in einer Quest
2. Tragen Sie im Feld "Provider" den Wert `codecombat` ein
3. Tragen Sie im Feld "Provider Level ID" die Level-ID von CodeCombat ein (z.B. `dungeons-of-kithgard`)
4. Speichern Sie den Schritt

Wenn ein Schüler diesen Schritt startet, wird er zu CodeCombat weitergeleitet. Nach Abschluss des Levels sendet CodeCombat ein Webhook an unsere Directus-Instanz, um den Fortschritt zu aktualisieren

## Troubleshooting

### simulate_codecombat.py

Mit diesem Skript können Sie simulieren, dass ein CodeCombat-Level abgeschlossen wurde, ohne es tatsächlich zu spielen

Verwendung:
```bash
python scripts/simulate_codecombat.py --user <USER_ID> --level <LEVEL_ID>
```
- `USER_ID`: Die Directus-Benutzer-ID des Schülers
- `LEVEL_ID`: Die CodeCombat-Level-ID (z.B. `dungeons-of-kithgard`)

Das Skript sendet einen Webhook an den Directus-Endpunkt, als ob CodeCombat den Abschluss gemeldet hätte