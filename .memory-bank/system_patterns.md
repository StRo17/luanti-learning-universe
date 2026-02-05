# System Patterns

## 1. Docker Networking

### Interne vs. Externe URLs
- **Intern (Container-zu-Container)**
  - URL: `http://directus:8055`
  - Verwendet in: Server-Side Components, Server Actions
  - Konfiguriert via: `DIRECTUS_URL_INTERNAL`

- **Extern (Browser-zu-Backend)**
  - URL: `http://localhost:8055` (Dev) oder `https://api.domain.de` (Prod)
  - Verwendet in: Client Components, Asset URLs
  - Konfiguriert via: `NEXT_PUBLIC_API_URL`

### Kritische Punkte
- Server Components müssen interne URLs nutzen
- Asset URLs müssen externe URLs nutzen
- Proxy (Traefik) handhabt SSL-Terminierung

## 2. Auth Flow via Cookies

### Token-System
1. **Access Token**
   - Cookie: `directus_token`
   - TTL: 15 Minuten
   - Scope: HTTP-Only, Secure (Prod)

2. **Refresh Token**
   - Cookie: `directus_refresh_token`
   - TTL: 7 Tage
   - Scope: HTTP-Only, Secure (Prod)

### Auth-Prozess
1. Login via `/auth/login`
2. Tokens in Cookies speichern
3. Tokens bei API-Calls automatisch mitsenden
4. Bei 401: Refresh-Flow triggern

## 3. Backend XP-Hook Logik

### Token-Einlösung
1. Frontend prüft Token-Validität
2. Token wird als "claimed" markiert
3. `user_progress` Eintrag wird erstellt
4. XP-Hook wird automatisch getriggert

### XP-Berechnung
1. Hook fängt `user_progress.create` Event
2. Liest zugehörige Quest-Daten
3. Berechnet und vergibt XP
4. Aktualisiert User-Profil

### Berechtigungen
- Student-Rolle benötigt:
  - `user_progress`: create
  - `claimable_tokens`: read, update
  - `directus_users`: read (self)

## 4. External Provider Integration (NEU)

### Datenmodell
1. **External Providers**
   ```typescript
   interface ExternalProvider {
     id: UUID;
     name: string;           // z.B. "CodeCombat"
     api_key: string;        // Für API-Calls zum Provider
     webhook_secret: string; // Für Webhook-Validierung
     base_url: string;      // Provider API Base URL
   }
   ```

2. **External Progress**
   ```typescript
   interface ExternalProgress {
     id: UUID;
     user_id: UUID;         // Directus User
     provider_id: UUID;     // External Provider
     external_user_id: string; // User-ID beim Provider
     external_level_id: string; // Level-ID beim Provider
     status: 'completed' | 'failed';
     date_completed: Date;
   }
   ```

3. **Quest Steps (Erweitert)**
   ```typescript
   interface QuestStep {
     // ... bestehende Felder ...
     external_id?: string;  // Optional: Provider-Level-ID
     provider_id?: UUID;    // Optional: Provider-Referenz
   }
   ```

### Webhook Flow
1. Provider sendet Level-Completion an `/external-webhook`
2. Webhook validiert Request mit `webhook_secret`
3. System sucht User via `external_user_id`
4. System erstellt:
   - `external_progress` Eintrag
   - `user_progress` Eintrag (triggert XP-Hook)

### Frontend Integration
1. `CodeCombatEmbed` Component liest `external_id`
2. Baut Provider-spezifische Embed-URL
3. Rendert Level in iframe
4. Wartet auf Webhook-Callback für Fortschritt