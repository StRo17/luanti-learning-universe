# 🎮 LUANTI LEARNING UNIVERSE - END-TO-END TEST GUIDE

Dieser Leitfaden beschreibt, wie du das gesamte System startest und den "Closed Loop" (Spiel → Backend → Frontend) testest.

---

## 🟢 SCHRITT 1: Infrastruktur starten (Docker)

Hier laufen Datenbank, Backend (Directus) und der Game-Server.

1.  Öffne ein Terminal im Hauptverzeichnis (`luanti-learning-universe`).
2.  Starte die Container:
    ```bash
    docker compose up -d
    ```
3.  **WICHTIG:** Warte, bis alle Systeme bereit sind. Prüfe den Status:
    ```bash
    watch docker compose ps
    ```
    *Warte, bis bei `llu_backend`, `llu_db` und `llu_game_server` der Status **(healthy)** steht.*
    *(Beende den Watch-Modus mit `STRG + C`)*

---

## 🔵 SCHRITT 2: Frontend starten (Next.js)

Hier läuft die Webseite (Dashboard & Login).

1.  Öffne ein **ZWEITES Terminal**.
2.  Navigiere in den Frontend-Ordner:
    ```bash
    cd frontend
    ```
3.  Aktiviere die korrekte Node.js Version (Wichtig für Next.js 15):
    ```bash
    # Lädt NVM (falls nicht automatisch geladen)
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Setzt Version auf 22
    nvm use 22
    ```
4.  Starte den Entwicklungsserver:
    ```bash
    npm run dev
    ```
5.  Öffne im Browser: [http://localhost:3000](http://localhost:3000)

---

## 🟣 SCHRITT 3: Test-Daten vorbereiten

Bevor wir spielen, brauchen wir eine Quest-ID.

1.  Gehe zu [http://localhost:3000](http://localhost:3000) (Dein Frontend).
2.  Klicke auf eine der Quests (z.B. "Mathe Grundlagen").
3.  Schau in die Adresszeile deines Browsers. Die URL sieht so aus:
    `http://localhost:3000/quests/39818818-b264-4b5d-a609-1234567890`
4.  **KOPIERE** die ID am Ende (z.B. `39818818-b264-4b5d-a609-1234567890`).
    *Das ist deine QUEST_ID.*

---

## 🟠 SCHRITT 4: Der Game-Loop (Luanti)

Jetzt simulieren wir, dass ein Schüler die Aufgabe im Spiel löst.

1.  Starte deinen **Luanti Client** (Minetest) auf deinem PC.
2.  Gehe auf den Reiter **"Spiel beitreten"** (Join Game).
    *   **Adresse:** `localhost`
    *   **Port:** `30000`
    *   **Name:** `Schueler1` (oder ein beliebiger Name)
3.  Verbinde dich.
4.  Öffne den Chat im Spiel (Taste `T`).
5.  Gib den Befehl ein (füge deine kopierte ID ein):
    ```text
    /finish DEINE_KOPIERTE_QUEST_ID
    ```
    *(Beispiel: `/finish 39818818-b264...`)*
6.  **ERGEBNIS:**
    *   Der Server sollte antworten: "🏆 QUEST ABGESCHLOSSEN!"
    *   Du erhältst einen grünen Code, z.B. **`X7K9`**.
    *   Notiere diesen Code.

---

## 🟡 SCHRITT 5: Der Web-Loop (Token einlösen)

Jetzt lösen wir den Beweis ein und kassieren die XP.

1.  Gehe zurück zum Browser: [http://localhost:3000](http://localhost:3000).
2.  Falls noch nicht geschehen: Klicke oben auf "Login" und melde dich an.
    *   *Email:* `admin@example.com` (oder dein User aus der .env)
    *   *Passwort:* (Dein Passwort aus der .env)
3.  Gehe wieder auf die Detailseite der Quest (wo du vorhin die ID kopiert hast).
4.  Scrolle nach unten zum Bereich **"Quest Abschließen"**.
5.  Gib den Code aus dem Spiel ein (z.B. `X7K9`).
6.  Klicke auf **"Code Prüfen"**.

**🎉 ERFOLG:**
*   Die Seite sollte neu laden.
*   Du solltest eine Erfolgsmeldung sehen.
*   Wenn du auf das **Dashboard** gehst, sollten deine XP gestiegen sein (sofern wir XP im Flow konfiguriert haben, sonst ist zumindest der Token als "benutzt" markiert).

---

## 🆘 Troubleshooting

**Backend nicht erreichbar?**
*   Prüfe Terminal 1: Laufen die Docker Container? (`docker compose ps`)
*   Startet Directus neu? (`docker compose logs -f directus`)

**Frontend startet nicht?**
*   Prüfe Terminal 2: Steht da `Ready in ... ms`?
*   Hast du `nvm use 22` gemacht?

**Luanti Command `/finish` unbekannt?**
*   Hast du die Datei `init.lua` gespeichert und gepusht?
*   Startet der Mod? Prüfe Logs: `docker compose logs luanti | grep "Core Mod"`

**Token ungültig?**
*   Hast du die richtige Quest-ID beim Befehl `/finish` benutzt?
*   Hast du den Token exakt abgetippt?