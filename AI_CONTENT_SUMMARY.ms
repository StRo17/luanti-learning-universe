# Luanti Learning Universe - AI Context Summary

## 🎯 Projekt Übersicht

**Projekt**: Luanti Learning Universe  
**Zweck**: Open-Source Learning Management System (LMS) im Voxel-Format  
**Tech Stack**: Docker Compose, Directus CMS, PostgreSQL, Redis, Luanti/Minetest Game Server, Traefik  
**Deployment**: WSL2 (Development) → GitHub (StRo17) → Production Server (AMD64/ARM64)

---

## 🔧 Durchgeführte Fixes & Implementierungen

### 1. Container Permission Fehler behoben
**Problem**: Luanti Container crashte mit "Cannot create user data directory"

**Lösung**:
- Volume-Mount von einzelnen Ordnern auf **komplettes Data Directory** geändert
- Named Volume `luanti_data` für korrekte Permissions
- Command-Parameter im Container korrigiert
- Healthcheck hinzugefügt

### 2. Traefik UDP-Routing korrigiert
**Problem**: Versuch, UDP-Traffic durch Traefik zu routen

**Lösung**:
- UDP kann **nicht** durch Layer-7 Proxy (Traefik) geroutet werden
- Direct Port Mapping für Luanti: `30000:30000/udp`
- Dokumentation ergänzt: UDP-EntryPoint aus Traefik-Config entfernt

### 3. Production Security Hardening
**Implementiert**:
- Rate Limiting für Directus (Redis-basiert)
- Security Headers & CORS-Config
- Secret-Validierung im Setup-Script
- No-new-privileges Security-Opt für alle Container
- Logging Limits (max 50MB, 5 Files Rotation)
- Healthchecks für alle Services mit `start_period`

### 4. Redis Connection Fix
**Problem**: Falsche Environment Variable in `.env` (`cache:6379` statt `redis:6379`)

**Lösung**:
- Konsistente Redis-URLs in allen Configs
- Directus nutzt jetzt korrekt: `redis://redis:6379`
- Redis-Persistence aktiviert (AOF + RDB)
- Maxmemory Policy: `allkeys-lru`

### 5. Database Schema Auto-Import System
**Problem**: Bestehendes Schema manuell in Directus importieren

**Lösung - 3-Komponenten-System**:

#### A) `backend/bootstrap.sh`
- Custom Entrypoint für Directus Container
- Prüft beim Start auf `/directus/snapshots/snapshot.yaml`
- Importiert automatisch via `directus schema apply --yes`
- Startet dann normal Directus

#### B) Volume Mount Korrektur
- **WICHTIG**: Ordnerpfad korrigiert von `snapshots/` → `schema/`
- Mount: `./backend/schema:/directus/snapshots:ro`
- Read-only Mount für Sicherheit

#### C) `manage-schema.sh` Management Script
```bash
./manage-schema.sh export   # Schema aus DB exportieren
./manage-schema.sh import   # Schema in DB importieren
./manage-schema.sh diff     # Unterschiede anzeigen
```

**Workflow**:
1. Entwickler ändert Schema in Directus UI
2. `./manage-schema.sh export` → Exportiert nach `backend/schema/snapshot.yaml`
3. `git add backend/schema/snapshot.yaml && git commit`
4. Auf Production: `git pull && docker compose up -d`
5. Container startet → `bootstrap.sh` importiert automatisch Schema

### 6. Multi-Architecture Support
**Implementiert**:
- Alle Base Images sind offiziell multi-arch (PostgreSQL, Redis, Directus, Luanti)
- Optional: Custom Dockerfile mit buildx für eigene Extensions
- Platform Auto-Detection durch Docker
- WSL2 (AMD64) → Server (AMD64/ARM64) funktioniert nahtlos

### 7. Volume Management Optimierung
**Struktur**:
```
Named Volumes (Performance):
- postgres_data     → Datenbank (schnell, persistent)
- redis_data        → Cache/Queue (persistent)
- luanti_data       → Game Server (komplett, persistent)

Bind Mounts (Development):
- ./backend/schema           → Schema (versioniert)
- ./backend/extensions       → Code (versioniert)
- ./backend/uploads          → User Files (ignoriert)
- ./luanti/mods              → Code (versioniert, read-only in prod)
- ./luanti/minetest.conf     → Config (versioniert, read-only)
```

### 8. Git Workflow & Deployment Pipeline
**Implementiert**:
- `.gitignore` mit klarer Trennung: Code vs. Data vs. Secrets
- `setup.sh` - Automatisiertes Setup mit Validation
- SSH-based Workflow: WSL2 → GitHub (StRo17) → Server
- Branch Strategy (main, develop, feature/*, hotfix/*)

**Dokumentation**:
- `FIRST_PUSH.md` - Step-by-step für ersten GitHub Push
- `GIT_WORKFLOW.md` - Daily Workflow, Troubleshooting, Best Practices
- `DEPLOYMENT.md` - Production Deployment Guide

### 9. Luanti Server Configuration
**Optimiert für LMS**:
- Creative Mode, kein Damage, kein PVP
- HTTP API für Mod `learning_core` aktiviert
- Performance Settings (Threads, Limits)
- Security: Client-Side Mods disabled
- Static Spawn Point für kontrollierten Einstieg

### 10. Entwickler-Experience Verbesserungen
**Tools**:
- `setup.sh` mit Environment-Validierung (dev/prod)
- `manage-schema.sh` für Schema-Management
- Colored Output, Progress Indicators
- Ausführliche Error Messages
- Quick Reference Cards in Dokumentation

---

## 📁 Finale Ordnerstruktur

```
luanti-learning-universe/
├── docker-compose.yml              # Production-ready Compose File
├── .env.example                    # Template für Secrets
├── .env                            # Lokale Secrets (GIT IGNORED)
├── .gitignore                      # Klare Trennung: Code vs Data
├── setup.sh                        # Automated Setup Script
├── manage-schema.sh                # Schema Import/Export Tool
├── README.md                       # Projekt Overview
├── DEPLOYMENT.md                   # Production Guide
├── GIT_WORKFLOW.md                 # Daily Git Workflow
├── FIRST_PUSH.md                   # Initial GitHub Push Guide
│
├── backend/
│   ├── bootstrap.sh                # Directus Entrypoint (Auto-Import)
│   ├── schema/
│   │   ├── snapshot.yaml           # AKTUELLES Schema (GIT TRACKED)
│   │   └── snapshot_*.yaml         # Timestamped Backups (IGNORED)
│   ├── uploads/                    # User Files (IGNORED)
│   │   └── .gitkeep
│   └── extensions/                 # Custom Directus Extensions (TRACKED)
│
├── luanti/
│   ├── minetest.conf               # Game Server Config (TRACKED)
│   ├── mods/
│   │   └── learning_core/          # Custom Mod für Directus API
│   │       ├── init.lua
│   │       └── mod.conf
│   └── games/                      # Game Definitions (TRACKED)
│
├── proxy/
│   ├── traefik.yml                 # Reverse Proxy Config (TRACKED)
│   └── acme.json                   # SSL Certs (IGNORED, auto-generated)
│
└── logs/                           # Application Logs (IGNORED)
```

---

## 🔄 Workflow: Schema-Änderungen

```mermaid
graph LR
    A[Dev ändert Schema in Directus] --> B[./manage-schema.sh export]
    B --> C[backend/schema/snapshot.yaml]
    C --> D[git commit & push]
    D --> E[GitHub StRo17/luanti-learning-universe]
    E --> F[Production: git pull]
    F --> G[docker compose up -d]
    G --> H[bootstrap.sh importiert Schema]
    H --> I[Directus mit neuem Schema läuft]
```

---

## 🚀 Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ DEVELOPMENT (WSL2 + VS Code)                                 │
├─────────────────────────────────────────────────────────────┤
│ 1. Code ändern                                               │
│ 2. Schema exportieren: ./manage-schema.sh export            │
│ 3. Testen: docker compose up -d                             │
│ 4. Committen: git add . && git commit                       │
│ 5. Pushen: git push origin develop                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ GITHUB (StRo17/luanti-learning-universe)                    │
├─────────────────────────────────────────────────────────────┤
│ - Code Review                                                │
│ - Pull Request: develop → main                              │
│ - Merge                                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PRODUCTION SERVER (AMD64/ARM64)                              │
├─────────────────────────────────────────────────────────────┤
│ 1. SSH zum Server                                            │
│ 2. git pull origin main                                      │
│ 3. ./setup.sh prod                                           │
│ 4. Schema wird automatisch importiert (bootstrap.sh)        │
│ 5. Services laufen mit neuestem Code + Schema                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎓 Wichtige Erkenntnisse für zukünftige AI-Assistenten

### 1. Directus Schema Management
- Directus hat **kein** automatisches Schema-Versioning
- Schema muss explizit mit `directus schema snapshot` exportiert werden
- Import via `directus schema apply` beim Start
- **Best Practice**: Custom Entrypoint (`bootstrap.sh`) für Auto-Import

### 2. Docker Volume Mounts
- **Named Volumes**: Performance-kritische Daten (DB, Redis, Game Worlds)
- **Bind Mounts**: Entwicklungs-Code (Extensions, Mods, Configs)
- **Read-Only Mounts** (`ro`) für Sicherheit bei Configs

### 3. Multi-Arch Docker
- Offizielle Images sind meist multi-arch ready
- Docker erkennt Zielplattform automatisch
- Kein spezieller Build nötig für AMD64 ↔ ARM64 Migration
- Bei Custom Dockerfiles: `docker buildx` nutzen

### 4. Luanti/Minetest Besonderheiten
- **UDP-only Protocol** → Kein Layer-7 Proxy möglich
- Mod-Permissions via `secure.http_mods` in `minetest.conf`
- Data Directory braucht spezifische Permissions (User 1000:1000)
- Volumes müssen **komplettes** `.minetest` Verzeichnis beinhalten

### 5. Git Best Practices für Infrastruktur-Projekte
- **Niemals committen**: `.env`, `uploads/`, `logs/`, SSL-Certs
- **Immer committen**: `.env.example`, Schema-Snapshots, Configs
- **Timestamped Backups**: In `.gitignore`, nur aktuelles File tracken
- **Read-only Mounts** in Production verhindern versehentliche Änderungen

### 6. Production Security Checklist
```yaml
✓ Rate Limiting aktiviert
✓ CORS konfiguriert (nicht auf `*` in Prod)
✓ Secrets in .env, nicht in Code
✓ no-new-privileges auf allen Containern
✓ Read-only Filesystem wo möglich
✓ Logging mit Rotation
✓ Healthchecks mit start_period
✓ SSL/TLS über Let's Encrypt (Traefik)
```

---

## 🐛 Gelöste Edge Cases

1. **"Cannot create user data directory"**
   - Ursache: Einzelne Ordner gemountet statt komplettes Data Dir
   - Fix: Named Volume für gesamtes `.minetest` Verzeichnis

2. **"Redis connection refused"**
   - Ursache: Hostname `cache` statt `redis` in .env
   - Fix: Konsistente Service-Namen in allen Configs

3. **"Schema not found in /directus/snapshots"**
   - Ursache: Volume mount auf falschen Ordner (`snapshots` vs `schema`)
   - Fix: Ordnerstruktur vereinheitlicht auf `backend/schema/`

4. **"Traefik can't route Luanti"**
   - Ursache: UDP-Traffic kann nicht durch HTTP-Proxy
   - Fix: Direct Port Mapping, Dokumentation ergänzt

---

## 📊 Performance & Skalierung

**Aktuelle Konfiguration** (für ~50 Spieler):
- PostgreSQL: Shared Buffers 2GB, Effective Cache 6GB
- Redis: Maxmemory 256MB (LRU Policy)
- Luanti: 4 Emerge Threads, Max 50 Users
- Traefik: Buffering 100 Requests

**Skalierungs-Optionen**:
- Horizontal: Mehrere Luanti-Container (verschiedene Ports)
- Vertical: PostgreSQL Connection Pooling (pgBouncer)
- Caching: Redis Cluster für Multi-World Scenarios

---

## 🔐 Security Highlights

1. **Secret Management**
   - Alle Secrets in `.env` (Git ignored)
   - Validierung im `setup.sh` (min. Längen, keine Defaults in Prod)
   - Template `.env.example` ohne echte Secrets

2. **Network Isolation**
   - Custom Bridge Network `llu-network`
   - Subnet: 172.28.0.0/16
   - Services kommunizieren über Service-Namen (DNS)

3. **Container Hardening**
   - `no-new-privileges:true` auf allen Containern
   - Read-only Mounts für Configs
   - Non-root User für Luanti (1000:1000)

4. **Rate Limiting**
   - Directus: 50 Requests/Sekunde (Redis-backed)
   - Traefik: Buffering + Connection Limits

---

## 🎯 Nächste Schritte (Empfehlungen)

1. **CI/CD Pipeline**
   - GitHub Actions für automatisches Testing
   - Auto-Deploy auf Production bei Push zu `main`

2. **Monitoring**
   - Prometheus für Metrics (Traefik, PostgreSQL, Redis)
   - Grafana Dashboards
   - Uptime Monitoring (UptimeRobot, Better Uptime)

3. **Backup Strategy**
   - Automatische PostgreSQL Dumps (täglich)
   - Luanti World Backups (vor jedem Server-Restart)
   - Off-site Backup (S3, Backblaze B2)

4. **High Availability**
   - PostgreSQL Replication (Patroni, Stolon)
   - Redis Sentinel für Failover
   - Load Balancer vor mehreren Luanti-Instanzen

---

**Projekt Status**: ✅ Production-Ready  
**Letzte Aktualisierung**: 2026-01-24  
**Version**: 1.0.0  

---

## 🤖 Für AI-Assistenten: Quick Context

Wenn ein User fragt "Hilf mir mit dem Luanti Learning Universe Projekt":

1. **Projekt-Typ**: Docker-based LMS mit Game Server Integration
2. **Hauptproblem gelöst**: Auto-Import von Directus Schema beim Container-Start
3. **Deployment**: WSL2 → GitHub → Production (Multi-Arch)
4. **Kritische Pfade**:
   - Schema: `backend/schema/snapshot.yaml`
   - Bootstrap: `backend/bootstrap.sh`
   - Management: `./manage-schema.sh`
5. **Wichtigste Befehle**:
   - Development: `./setup.sh dev`
   - Production: `./setup.sh prod`
   - Schema Export: `./manage-schema.sh export`
   - Git Push: `git add . && git commit && git push`

**Typische User-Fragen**:
- "Wie importiere ich mein Schema?" → `manage-schema.sh import` oder automatisch beim Start
- "Container crasht" → Prüfe Volumes & Permissions (siehe `docker compose logs`)
- "Wie pushe ich zu GitHub?" → Siehe `FIRST_PUSH.md`
- "Multi-Arch funktioniert?" → Ja, automatisch durch offizielle Images