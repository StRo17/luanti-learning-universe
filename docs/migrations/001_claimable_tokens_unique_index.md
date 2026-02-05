# Migration: claimable_tokens.token UNIQUE + INDEX

**Datum:** 2026-02-05  
**Zweck:** Sicherstellung der Token-Eindeutigkeit und Performance-Optimierung

---

## Problem

Das Feld `claimable_tokens.token` hat aktuell:
- `is_unique: false` → Duplikate möglich (Security-Risk!)
- `is_indexed: false` → Performance-Problem bei hoher Last

---

## Option A: Directus Admin UI (Empfohlen)

### Schritte:

1. **Öffne Directus Admin**
   ```
   http://localhost:8055/admin
   ```

2. **Navigiere zu Data Model**
   - Klicke auf ⚙️ **Settings** (Zahnrad, links unten)
   - Wähle **Data Model**
   - Klicke auf **claimable_tokens**

3. **Bearbeite das Token-Feld**
   - Klicke auf das Feld **token**
   - Scrolle runter zu **Schema Options** (Advanced)
   
4. **Aktiviere Unique**
   - Setze **Unique** auf ✅ **aktiviert**
   
5. **Aktiviere Index** *(wenn verfügbar)*
   - Setze **Indexed** auf ✅ **aktiviert**
   - *Hinweis: Ein UNIQUE Constraint erzeugt automatisch einen Index*

6. **Speichern**
   - Klicke auf **✓ Save** (oben rechts)

7. **Schema exportieren** (für Versionskontrolle)
   ```bash
   docker exec llu_backend npx directus schema snapshot /directus/snapshots/snapshot.yaml
   ```

---

## Option B: SQL Migration (PostgreSQL direkt)

Falls die UI-Option nicht funktioniert oder du mehr Kontrolle brauchst:

### Schritte:

1. **Verbinde zur Datenbank**
   ```bash
   docker exec -it llu_db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
   ```

2. **Prüfe existierende Duplikate** (wichtig vor UNIQUE Constraint!)
   ```sql
   SELECT token, COUNT(*) 
   FROM claimable_tokens 
   WHERE token IS NOT NULL 
   GROUP BY token 
   HAVING COUNT(*) > 1;
   ```

3. **Falls Duplikate existieren: Bereinigen**
   ```sql
   -- Behalte nur den ältesten Eintrag pro Token
   DELETE FROM claimable_tokens a
   USING claimable_tokens b
   WHERE a.id > b.id 
   AND a.token = b.token;
   ```

4. **Erstelle UNIQUE Index**
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS claimable_tokens_token_unique 
   ON claimable_tokens(token);
   ```

5. **Verifiziere**
   ```sql
   \d claimable_tokens
   ```
   
   Erwartete Ausgabe sollte zeigen:
   ```
   Indexes:
       "claimable_tokens_token_unique" UNIQUE, btree (token)
   ```

6. **Verlasse psql**
   ```sql
   \q
   ```

---

## Option C: Schema YAML direkt bearbeiten

Du kannst auch `backend/schema/snapshot.yaml` direkt bearbeiten:

```yaml
# Zeile ~223 finden und ändern:
      is_unique: true   # war: false
      is_indexed: true  # war: false
```

Dann Schema anwenden:
```bash
docker exec llu_backend npx directus schema apply /directus/snapshots/snapshot.yaml
```

⚠️ **Warnung**: Dies kann fehlschlagen wenn Duplikate existieren!

---

## Verifikation

Nach der Migration sollte folgendes gelten:

```sql
-- Test Unique Constraint
INSERT INTO claimable_tokens (token, quest_id) VALUES ('TEST123', 'some-uuid');
INSERT INTO claimable_tokens (token, quest_id) VALUES ('TEST123', 'another-uuid');
-- Zweites INSERT sollte fehlschlagen mit: duplicate key value violates unique constraint

-- Cleanup Test-Daten
DELETE FROM claimable_tokens WHERE token = 'TEST123';
```

---

## Rollback (falls nötig)

```sql
DROP INDEX IF EXISTS claimable_tokens_token_unique;
```
