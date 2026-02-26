# Luanti Learning Universe - Deployment Checkliste

## Analyseergebnisse als Senior DevOps Engineer

### Projektstruktur
- **✅ Gut organisiert**: Monorepo mit klarer Trennung (frontend, backend, luanti, proxy)
- **✅ Docker-basiert**: Vollständige Docker-Compose-Integration
- **✅ Dokumentation**: Umfangreiche DEPLOYMENT.md und setup.sh vorhanden

### 1. Abhängigkeiten ✅
**Frontend** (`frontend/package.json`):
- Next.js 16.1.5 mit React 19.2.3
- Alle Abhängigkeiten korrekt gelistet, inkl. devDependencies
- Build-Skripte vorhanden: `dev`, `build`, `start`, `lint`

**Backend-Erweiterungen**:
- Directus Extensions mit TypeScript
- Abhängigkeiten: `@directus/extensions-sdk` und `typescript`
- Build-Skripte für Extensions vorhanden

**Keine requirements.txt/Pipfile**: Backend basiert auf Directus-Image, keine zusätzlichen Python-Abhängigkeiten.

### 2. Konfiguration (.env.example) ⚠️
**Stärken**:
- Umfassende `.env.example` mit allen benötigten Variablen
- Gute Dokumentation und Sicherheitshinweise
- Production vs. Development Einstellungen dokumentiert

**Probleme**:
1. **Hartcodierter Beispiel-Token**: `DIRECTUS_ADMIN_TOKEN=QifLN7FywEN0eqFNDwYiBCLgqXYquq20`
   - In Beispiel-Datei akzeptabel, aber sollte als MUST-CHANGE markiert sein
2. **Basic Auth Hash für Traefik Dashboard**: Enthält Beispiel-Hash für "changeme"
   - Sollte in Production durch eigenen Hash ersetzt werden
3. **Default-Passwörter**: `admin-password-change-me`, `secure_db_password_change_me`
   - Klar als Platzhalter markiert, aber Setup-Skript prüft diese

**Fehlende Variablen**:
- Keine CORS_ORIGIN für Production (aktuell nur `http://localhost:3000`)
- Keine Email-Konfiguration (SMTP) für Production

### 3. Start-Skripte & Build-Prozess ✅
**Vorhandene Skripte**:
- `setup.sh dev/prod` - Umfassendes Setup mit Security-Checks
- `deploy.sh` - Einfaches Git-Pull & Docker-Compose Update
- `docker-compose.yml` - Start aller Services als Stack
- `frontend/Dockerfile` - Multi-Stage Build für Next.js
- `Dockerfile` - Multi-Architecture für Directus mit Extensions

**Build-Prozess**:
- Frontend: `npm run build` im Dockerfile (automatisch)
- Backend Extensions: Build-Skripte in package.json (`npm run build`)
- Database Schema: Bootstrap-Script für Directus-Schema-Import

### 4. Hardcoded Secrets ⚠️
**Gefundene Issues**:
1. **`.env.example`**: Enthält Beispiel-Token und Passwörter (akzeptabel als Template)
2. **`.env`** (falls existiert): Kann noch Platzhalter enthalten
3. **Skripte**: `scripts/audit-schema.ts` hat Platzhalter `'admin-token-placeholder'`
4. **Code**: Keine hardcodierten Secrets in Produktionscode gefunden

**Gute Praxis**: Secrets werden über Umgebungsvariablen geladen (docker-compose.yml).

### 5. Docker & Deployment Konfiguration ⚠️
**Stärken**:
- Multi-Stage Docker Builds für optimierte Images
- Healthchecks für alle kritischen Services
- Traefik als Reverse Proxy mit Let's Encrypt Support (kommentiert)
- Separate Netzwerke und Volumes für Datenpersistenz

**Sicherheitsprobleme**:
1. **Traefik Dashboard unsicher**: `insecure: true` und Port 8080 exponiert
2. **HTTP → HTTPS Redirect deaktiviert**: In Production benötigt
3. **CORS-Einstellungen**: Nur localhost erlaubt, muss für Production angepasst werden
4. **Directus Port exponiert**: `127.0.0.1:8055` - nur lokal, aber über Traefik geroutet

**Performance**:
- Redis Cache konfiguriert
- Rate Limiting aktiviert
- Logging konfiguriert

---

## 🚨 KRITISCHE CHECKLISTE VOR DEPLOYMENT

### A. Sofort umsetzen (Production-Sicherheit)

#### 1. Umgebungsvariablen sichern
- [ ] `.env` Datei aus `.env.example` erstellen
- [ ] **ALLE Platzhalter ersetzen**:
  - `KEY` und `SECRET` mit `openssl rand -hex 32` generieren
  - `POSTGRES_PASSWORD` starkes Passwort setzen
  - `ADMIN_PASSWORD` starkes Passwort setzen
  - `DIRECTUS_ADMIN_TOKEN` neuen Token in Directus generieren
- [ ] `DOMAIN_NAME` auf echte Domain setzen
- [ ] `PUBLIC_URL` auf `https://api.<domain>` setzen

#### 2. Traefik SSL/TLS aktivieren
- [ ] In `proxy/traefik.yml`:
  - `certificatesResolvers` auskommentieren und Email anpassen
  - HTTP → HTTPS Redirect aktivieren (EntryPoint web -> websecure)
- [ ] In `docker-compose.yml` bei Directus Labels:
  - HTTPS Labels einkommentieren (`websecure`, `tls=true`, `certresolver=letsencrypt`)
- [ ] `acme.json` Berechtigungen setzen: `chmod 600 proxy/acme.json`

#### 3. Sicherheitshärtung
- [ ] Traefik Dashboard absichern oder deaktivieren:
  - Option A: `insecure: false` setzen und BasicAuth verwenden
  - Option B: Port 8080 aus docker-compose.yml entfernen
- [ ] Firewall konfigurieren (UFW/iptables):
  - Nur Ports 80, 443, 30000/UDP (Luanti) und SSH (22) öffnen
  - Port 8080 (Dashboard) blockieren
- [ ] CORS für Production anpassen:
  - `CORS_ORIGIN` auf Frontend-Domain setzen (z.B. `https://frontend.<domain>`)

### B. Konfiguration & Skripte

#### 4. Email-Konfiguration (optional, aber empfohlen)
- [ ] SMTP-Einstellungen in `.env` setzen für:
  - Passwort-Reset
  - Benachrichtigungen
  - System-Emails

#### 5. Backup-Strategie
- [ ] Database Backup-Skript erstellen (PostgreSQL dump)
- [ ] Volume-Backup für `postgres_data`, `redis_data`, `luanti_data`
- [ ] Backup-Zeitplan (cronjob) definieren

#### 6. Monitoring & Logging
- [ ] Log-Rotation konfigurieren (in docker-compose.yml bereits vorhanden)
- [ ] Healthcheck-Endpoints überwachen:
  - Directus: `/server/health`
  - Frontend: `/` (HTTP 200)
- [ ] Optional: Prometheus/Metrics für Traefik aktivieren

### C. Deployment-Prozess

#### 7. Deployment-Skript testen
- [ ] `./setup.sh prod` auf Test-Server ausführen
- [ ] `./deploy.sh` anpassen für Production-Branch (nicht `develop`)
- [ ] Rollback-Strategie definieren (z.B. git revert + compose down/up)

#### 8. Datenbank-Migrationen
- [ ] Schema-Snapshot prüfen: `backend/schema/snapshot.yaml`
- [ ] Testen: `docker compose exec directus npx directus schema apply ./snapshots/snapshot.yaml -y`
- [ ] Migration-Skript für vorhandene Daten erstellen (falls nötig)

#### 9. Game Server (Luanti) Konfiguration
- [ ] `luanti/minetest.conf` auf Production-Einstellungen prüfen
- [ ] World-Generierungseinstellungen anpassen
- [ ] Mod-Konfiguration (`learning_core`) prüfen

### D. Post-Deployment Checks

#### 10. Funktionstests
- [ ] Frontend unter `https://<domain>` erreichbar
- [ ] API unter `https://api.<domain>` erreichbar
- [ ] Directus Admin Login funktioniert
- [ ] Luanti Game Server auf Port 30000/UDP erreichbar
- [ ] Token-Redemption Flow testen

#### 11. Performance & Skalierung
- [ ] Memory Limits für Container prüfen (docker-compose.yml)
- [ ] Redis Memory Policy (`maxmemory 256mb`) anpassen
- [ ] Database Connection Pool optimieren

#### 12. Dokumentation aktualisieren
- [ ] `DEPLOYMENT.md` mit Production-Erfahrungen ergänzen
- [ ] Troubleshooting-Guide für häufige Probleme
- [ ] Contact-Informationen für Notfälle

---

## ✅ POSITIVE ASPEKTE (bereits gut)

1. **Ausgereifte Docker-Configuration**: Multi-Stage Builds, Healthchecks, Volumes
2. **Security-by-Design**: Rate Limiting, Non-root User, Security Opts
3. **Gute Dokumentation**: DEPLOYMENT.md mit detaillierten Anleitungen
4. **Automatisiertes Setup**: `setup.sh` mit Environment-Checks
5. **Modulare Architektur**: Trennung von Frontend, Backend, Game Server

---

## 🔧 EMPFOHLENE VERBESSERUNGEN (langfristig)

### Hochpriorität:
1. **CI/CD Pipeline**: GitHub Actions für automatisches Build & Deploy
2. **Infrastructure as Code**: Terraform für Server-Provisioning
3. **Secret Management**: Vault oder Docker Secrets anstelle von .env
4. **Monitoring Stack**: Grafana + Prometheus + Alertmanager

### Mittelpriorität:
5. **Database High Availability**: PostgreSQL Replication
6. **Load Balancing**: Mehrere Frontend/Backend Instanzen
7. **CDN Integration**: Für statische Assets

### Niedrigpriorität:
8. **Multi-Server Deployment**: Game Server auf separatem Host
9. **Disaster Recovery**: Automatische Failover-Strategie
10. **Cost Optimization**: Spot Instances, Auto-Scaling

---

## 📋 QUICK DEPLOYMENT COMMANDS

```bash
# 1. Server vorbereiten
git clone <repo>
cd luanti-learning-universe

# 2. Environment konfigurieren
cp .env.example .env
nano .env  # Alle Werte anpassen!

# 3. Production Setup
chmod +x setup.sh
./setup.sh prod

# 4. Deployment (spätere Updates)
./deploy.sh

# 5. Logs überwachen
docker compose logs -f

# 6. Health Check
curl https://api.your-domain.com/server/health
```

---

## 🚨 NOTFALL-KONTAKTE & ROLLBACK

**Bei Problemen nach Deployment:**
1. **Rollback**: `git checkout <previous-tag>` + `docker compose up -d --force-recreate`
2. **Database Restore**: `docker compose exec database pg_dump` Backup einspielen
3. **Support**: [Hier Kontaktinformationen eintragen]

**Monitoring URLs:**
- Traefik Dashboard: `https://<domain>:8080` (nur wenn aktiviert)
- Directus Admin: `https://api.<domain>/admin`
- Frontend: `https://<domain>`

---

*Letzte Überprüfung: $(date)*  
*DevOps Engineer: Roo (Senior DevOps Analysis)*