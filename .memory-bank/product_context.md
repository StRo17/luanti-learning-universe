# Luanti Learning Management System (LMS)

## Architektur-Überblick

Das Luanti-LMS ist eine moderne Lernplattform mit folgenden Hauptkomponenten:

1. **Frontend (Next.js)**
   - Server-Side Rendering für bessere Performance
   - Server Actions für sichere API-Calls
   - Authentifizierung via Directus Cookies
   - Iframe-Integration externer Lernquellen

2. **Backend (Directus CMS)**
   - Headless CMS für Content-Management
   - REST API für Frontend-Kommunikation
   - Custom Extensions:
     - XP-Hook für Spielmechaniken
     - Webhook-Handler für externe Integrationen
   - Token-basierte Authentifizierung

3. **Luanti-Mod**
   - Minetest-basierte Lernwelt
   - Integration mit LMS via Token-System
   - Fortschrittssynchronisation

4. **Externe Lernquellen**
   - CodeCombat Integration (Phase 4)
   - Webhook-basierte Fortschrittssynchronisation
   - Iframe-Einbettung der Lernumgebungen

## Datenmodell

### Core Entities
- `claimable_tokens`: Einlösbare Achievement-Tokens
- `user_progress`: Schülerfortschritt und XP-Stand
- `quests`: Lernaufgaben und Missionen
- `quest_steps`: Einzelne Aufgabenschritte
- `schools`: Schulverwaltung
- `luanti_worlds`: Verfügbare Lernwelten

### Integration Layer (Neu)
- `external_providers`: Konfiguration externer Lernplattformen
- `external_progress`: Fortschrittssynchronisation mit externen Systemen