# 📦 Migration 002: Schools & LuantiWorlds Collections

> **Erstellt:** 2026-02-05  
> **Zweck:** Datenbank an TypeScript-Types anpassen (Option 1: DB nachziehen)  
> **Referenz:** [`frontend/src/types/schema.d.ts`](../../frontend/src/types/schema.d.ts)

---

## 🎯 Ziel

Die folgenden TypeScript-Types existieren nur im Frontend, aber **nicht in der Datenbank**:

- `School`
- `LuantiWorld`

Zusätzlich fehlen erweiterte Felder in:
- `directus_users` (school_id, luanti_player_name, xp_total, coins_balance)
- `quests` (min_level_required)
- `quest_steps` (content_data, completion_token_secret)

Diese Anleitung beschreibt, wie die Collections manuell im **Directus Admin Panel** angelegt werden.

---

## 📋 Schritt 1: Collection `schools` erstellen

### 1.1 Collection anlegen

1. Gehe zu **Settings** → **Data Model** → **Create Collection**
2. Collection Name: `schools`
3. Primary Key: `id` (UUID, auto-generated)
4. ✅ Singleton: Nein
5. Klicke **Save**

### 1.2 Felder hinzufügen

| Feldname | Interface | Typ | Optionen |
|----------|-----------|-----|----------|
| `name` | Input | `string` | Required, max. 200 Zeichen |
| `slug` | Input (Slug) | `string` | Required, Unique, auto-generate from `name` |
| `subscription_tier` | Dropdown | `string` | Required, Choices: `free`, `school`, `enterprise` (Default: `free`) |
| `date_created` | DateTime | `timestamp` | Auto-fill on Create, Read-only |
| `date_updated` | DateTime | `timestamp` | Auto-fill on Update, Read-only |

### 1.3 Indexes setzen

Nach der Erstellung, gehe zu **Schema** (Raw) oder führe SQL aus:

```sql
-- Unique Index auf slug
CREATE UNIQUE INDEX idx_schools_slug ON schools (slug);
```

---

## 📋 Schritt 2: Collection `luanti_worlds` erstellen

### 2.1 Collection anlegen

1. Gehe zu **Settings** → **Data Model** → **Create Collection**
2. Collection Name: `luanti_worlds`
3. Primary Key: `id` (UUID, auto-generated)
4. Klicke **Save**

### 2.2 Felder hinzufügen

| Feldname | Interface | Typ | Optionen |
|----------|-----------|-----|----------|
| `school_id` | Many-to-One | `uuid` | Related to: `schools`, Required, On Delete: CASCADE |
| `name` | Input | `string` | Required, max. 100 Zeichen |
| `world_port` | Input (Number) | `integer` | Required, Min: 30000, Max: 39999 |
| `container_id` | Input | `string` | Optional, max. 100 Zeichen (Docker Container ID) |
| `is_active` | Toggle | `boolean` | Default: `true` |
| `date_created` | DateTime | `timestamp` | Auto-fill on Create |
| `date_updated` | DateTime | `timestamp` | Auto-fill on Update |

### 2.3 Relation konfigurieren

Bei `school_id`:
- **Related Collection:** `schools`
- **Display Template:** `{{ name }}`
- **On Delete:** `CASCADE` (wenn Schule gelöscht wird, werden Welten gelöscht)

---

## 📋 Schritt 3: `directus_users` erweitern

Directus erlaubt das Erweitern der System-Collection `directus_users`.

### 3.1 Felder hinzufügen

Gehe zu **Settings** → **Data Model** → **directus_users** → **Add Field**:

| Feldname | Interface | Typ | Optionen |
|----------|-----------|-----|----------|
| `school_id` | Many-to-One | `uuid` | Related to: `schools`, Optional, On Delete: SET NULL |
| `luanti_player_name` | Input | `string` | Optional, max. 50 Zeichen, Unique |
| `xp_total` | Input (Number) | `integer` | Default: `0`, Min: 0 |
| `coins_balance` | Input (Number) | `integer` | Default: `0`, Min: 0 |

### 3.2 Hinweis zu Rollen

Die `UserRole` Enum im TypeScript (`global_admin`, `school_admin`, `teacher`, `student`, `parent`, `service_account`) kann über **Directus Roles** abgebildet werden:

1. Gehe zu **Settings** → **Roles & Permissions**
2. Erstelle Rollen:
   - `Student` (Basis-Zugriff)
   - `Teacher` (Klassen verwalten)
   - `School Admin` (Schul-Einstellungen)
   - `Global Admin` (Vollzugriff)

---

## 📋 Schritt 4: `quests` erweitern

### 4.1 Feld hinzufügen

| Feldname | Interface | Typ | Optionen |
|----------|-----------|-----|----------|
| `min_level_required` | Input (Number) | `integer` | Default: `0`, Min: 0 |

### 4.2 Subject Enum anpassen

Das Feld `subject` ist aktuell ein JSON Array. Für korrekte Typisierung:

1. Feld `subject` bearbeiten
2. Interface: **Dropdown**
3. Choices:
   - `math` - Mathematik
   - `science` - Naturwissenschaften
   - `coding` - Programmieren
   - `language` - Sprachen
   - `art` - Kunst

---

## 📋 Schritt 5: `quest_steps` erweitern

### 5.1 Felder hinzufügen

| Feldname | Interface | Typ | Optionen |
|----------|-----------|-----|----------|
| `content_data` | Code (JSON) | `json` | Optional, Default: `{}` |
| `completion_token_secret` | Input | `string` | Optional, max. 64 Zeichen |

### 5.2 Step Type Enum prüfen

Stelle sicher, dass `step_type` diese Werte hat:
- `external_learning` - Externes Lernmaterial
- `coding` - Programmieraufgabe
- `ingame_task` - In-Game Aufgabe
- `quiz` - Quiz

---

## 📋 Schritt 6: `user_progress` anpassen

### 6.1 Status-Feld korrigieren

Das Feld `status` ist aktuell ein JSON Array. Korrigieren:

1. Feld `status` bearbeiten oder neu erstellen als:
   - Interface: **Dropdown**
   - Choices: `started`, `completed`, `failed`
   - Default: `started`

**⚠️ Warnung:** Bei bestehenden Daten muss eine Datenmigration erfolgen!

---

## 🔐 Schritt 7: Permissions setzen

### Public (unauthenticated)
| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `schools` | ❌ | ❌ | ❌ | ❌ |
| `luanti_worlds` | ❌ | ❌ | ❌ | ❌ |

### Student Role
| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `schools` | ✅ (eigene) | ❌ | ❌ | ❌ |
| `luanti_worlds` | ✅ (eigene Schule) | ❌ | ❌ | ❌ |

### Teacher Role
| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `schools` | ✅ (eigene) | ❌ | ❌ | ❌ |
| `luanti_worlds` | ✅ (eigene Schule) | ✅ | ✅ | ❌ |

### School Admin Role
| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `schools` | ✅ (eigene) | ❌ | ✅ | ❌ |
| `luanti_worlds` | ✅ | ✅ | ✅ | ✅ |

### Global Admin (Administrator)
- Vollzugriff auf alle Collections

---

## ✅ Validierung

Nach der Migration, prüfe:

1. **Collections existieren:**
   ```bash
   curl http://localhost:8055/items/schools
   curl http://localhost:8055/items/luanti_worlds
   ```

2. **Relationen funktionieren:**
   ```bash
   curl "http://localhost:8055/items/luanti_worlds?fields=*,school_id.*"
   ```

3. **User-Felder vorhanden:**
   ```bash
   curl "http://localhost:8055/users/me?fields=id,school_id,xp_total,coins_balance"
   ```

---

## 📜 SQL-Referenz (Alternative)

Falls du direkten DB-Zugriff bevorzugst:

```sql
-- 1. Schools Tabelle
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'school', 'enterprise')),
    date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_schools_slug ON schools(slug);

-- 2. Luanti Worlds Tabelle
CREATE TABLE luanti_worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    world_port INTEGER NOT NULL CHECK (world_port BETWEEN 30000 AND 39999),
    container_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_luanti_worlds_school ON luanti_worlds(school_id);

-- 3. Directus Users erweitern
ALTER TABLE directus_users 
    ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    ADD COLUMN luanti_player_name VARCHAR(50) UNIQUE,
    ADD COLUMN xp_total INTEGER DEFAULT 0,
    ADD COLUMN coins_balance INTEGER DEFAULT 0;

-- 4. Quests erweitern
ALTER TABLE quests 
    ADD COLUMN min_level_required INTEGER DEFAULT 0;

-- 5. Quest Steps erweitern
ALTER TABLE quest_steps 
    ADD COLUMN content_data JSONB DEFAULT '{}',
    ADD COLUMN completion_token_secret VARCHAR(64);

-- ⚠️ WICHTIG: Nach SQL-Änderungen Directus Schema synchronisieren!
-- Gehe zu Settings → Data Model → Synchronize Schema
```

---

## 📌 Nächste Schritte

Nach erfolgreicher Migration:

1. [ ] `frontend/src/types/schema.d.ts` verifizieren
2. [ ] `frontend/src/app/actions.ts` - `any` Casts entfernen
3. [ ] TypeScript neu kompilieren: `npm run build`
4. [ ] Backend Schema exportieren: `./backend/bootstrap.sh`
5. [ ] PROJECT_STATUS.md aktualisieren (1.4 + 1.5 als erledigt markieren)
