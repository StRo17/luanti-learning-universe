# Aktiver Kontext: CodeCombat Integration (Phase 4 ✅)

## Aktuelle Aufgabe

### CodeCombat Integration
- Erweiterung des LMS um externe Lernquellen
- Fokus auf CodeCombat als erste Integration
- Webhook-basierte Fortschrittssynchronisation

### Schema-Erweiterungen

1. **Neue Collections**
   ```yaml
   external_providers:
     - name: string
     - api_key: string (encrypted)
     - webhook_secret: string (encrypted)
     - base_url: string
     - status: enum('active', 'inactive')

   external_progress:
     - user_id: uuid (m2o -> directus_users)
     - provider_id: uuid (m2o -> external_providers)
     - external_user_id: string
     - external_level_id: string
     - status: enum('completed', 'failed')
     - date_completed: timestamp
   ```

2. **Quest-Steps Erweiterung**
   ```yaml
   quest_steps:
     # Bestehende Felder...
     - external_id: string (optional)
     - provider_id: uuid (m2o -> external_providers, optional)
   ```

### Webhook-Handler

1. **Endpoint-Spezifikation**
   ```typescript
   POST /external-webhook/:providerId
   Headers:
     - X-Webhook-Secret: string
   Body:
     - user_id: string
     - level_id: string
     - status: 'completed' | 'failed'
   ```

2. **Webhook-URL**
   ```
   https://api.${DOMAIN_NAME}/external-webhook/:providerId
   ```
   Ersetze `:providerId` mit der UUID des jeweiligen Providers.

3. **Verarbeitungslogik**
   - Validiere Webhook-Secret
   - Finde User via external_user_id
   - Erstelle external_progress
   - Erstelle user_progress
   - XP-Hook wird automatisch getriggert

### Frontend-Integration

1. **CodeCombatEmbed Component**
   ```typescript
   interface CodeCombatEmbedProps {
     levelId: string;
     providerId: string;
     userId: string;
   }
   ```

2. **Embed-URL Schema**
   ```
   ${provider.base_url}/play/level/${levelId}?user=${userId}
   ```

### Webhook Testing

1. **Test-Skript Setup**
   ```bash
   # 1. Konfiguration in .env.test
   PROVIDER_ID=codecombat
   WEBHOOK_SECRET=your-webhook-secret-here
   USER_ID=test-user-123
   DIRECTUS_URL=http://localhost:8055

   # 2. Skript ausführen
   ./scripts/simulate_codecombat.py [level_id] [status]
   
   # Beispiel:
   ./scripts/simulate_codecombat.py python-basics-1 completed
   ```

2. **Validierung**
   - Prüfe external_progress Collection für neuen Eintrag
   - Prüfe user_progress für automatisch erstellten Fortschritt
   - Prüfe XP-Aktualisierung via XP-Hook

### Phase 4 Abschluss ✅

1. **Implementierte Features**
   - ✅ Schema-Migration für externe Provider
   - ✅ Webhook-Handler für Progress-Tracking
   - ✅ Frontend-Integration mit CodeCombat
   - ✅ Test-Automation für Webhook-Calls
   - ✅ XP-Progress Visualisierung mit Animations

2. **Nächste Phase (5)**
   - Gamification-Elemente ausbauen
   - XP-System verfeinern
   - Visuelles Feedback optimieren