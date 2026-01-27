# Luanti Learning Universe - Deployment Guide

## 🎯 Quick Start

### Development
```bash
# 1. Repository klonen
git clone <your-repo>
cd luanti-learning-universe

# 2. .env erstellen
cp .env.example .env
# → Passwörter anpassen!

# 3. Setup Script ausführen
chmod +x setup.sh
./setup.sh dev

# 4. Services sind bereit!
# Directus: http://localhost:8055
# Luanti: localhost:30000 (UDP)
```

### Production
```bash
./setup.sh prod
```

---

## 📋 Voraussetzungen

### System Requirements
- **OS**: Linux (Ubuntu 22.04 LTS empfohlen)
- **RAM**: Minimum 4GB, empfohlen 8GB+
- **Storage**: Minimum 20GB SSD
- **Docker**: Version 24.0+
- **Docker Compose**: Version 2.20+

### Ports
Folgende Ports müssen frei und in der Firewall geöffnet sein:
- `80` - HTTP (Traefik)
- `443` - HTTPS (Traefik)
- `30000/UDP` - Luanti Game Server
- `8080` - Traefik Dashboard (nur Dev, in Prod blockieren!)

---

## 🔐 Security Checklist (Production)

### 1. Environment Variables
```bash
# Generiere sichere Keys
openssl rand -hex 32  # für KEY
openssl rand -hex 32  # für SECRET

# Oder mit uuidgen
uuidgen  # macOS/Linux
```

Setze in `.env`:
```bash
KEY=<32+ Zeichen Random Hex>
SECRET=<32+ Zeichen Random Hex>
POSTGRES_PASSWORD=<Strong Password>
ADMIN_PASSWORD=<Strong Password>
DOMAIN_NAME=your-domain.com
PUBLIC_URL=https://api.your-domain.com
```

### 2. Traefik SSL/TLS aktivieren
In `proxy/traefik.yml`:
```yaml
# Uncomment Let's Encrypt Konfiguration
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@your-domain.com
      storage: /acme.json
      httpChallenge:
        entryPoint: web
```

In `docker-compose.yml` bei Directus Labels:
```yaml
# Uncomment HTTPS Labels
- "traefik.http.routers.directus.entrypoints=websecure"
- "traefik.http.routers.directus.tls=true"
- "traefik.http.routers.directus.tls.certresolver=letsencrypt"
```

### 3. Firewall konfigurieren (UFW Beispiel)
```bash
# Default Deny
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Luanti
sudo ufw allow 30000/udp

# Enable
sudo ufw enable
sudo ufw status
```

### 4. Traefik Dashboard absichern
In Production `api.insecure: false` setzen und BasicAuth verwenden:
```bash
# Passwort hashen
htpasswd -nb admin your_password
```

### 5. Docker Socket absichern
Erwäge Docker Socket Proxy für Production:
```yaml
# Statt direktem /var/run/docker.sock Mount
# docker-socket-proxy nutzen
```

---

## 🚀 Deployment Steps

### 1. Server vorbereiten
```bash
# System Update
sudo apt update && sudo apt upgrade -y

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose installieren
sudo apt install docker-compose-plugin -y

# User zu Docker Gruppe
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Repository Setup
```bash
# Code deployen
git clone <your-repo>
cd luanti-learning-universe

# .env aus Template erstellen
cp .env.example .env
nano .env  # Alle Werte anpassen!
```

### 3. SSL Zertifikate vorbereiten
```bash
# acme.json erstellen
touch proxy/acme.json
chmod 600 proxy/acme.json
```

### 4. DNS konfigurieren
```
A Record:  your-domain.com       → Server IP
A Record:  api.your-domain.com   → Server IP
A Record:  game.your-domain.com  → Server IP
```

### 5. Deployment ausführen
```bash
# Setup Script ausführen
chmod +x setup.sh
./setup.sh prod

# Logs überprüfen
docker compose logs -f
```

---

## 🔧 Troubleshooting

### Luanti: "Cannot create user data directory"
**Problem**: Container hat keine Schreibrechte auf Volume

**Lösung**:
```bash
# Volume neu erstellen
docker compose down -v
docker volume rm luanti-learning-universe_luanti_data
./setup.sh dev
```

### Directus: "Redis connection failed"
**Problem**: Redis noch nicht bereit

**Lösung**: Warte 30 Sekunden und prüfe:
```bash
docker compose logs redis
docker compose restart directus
```

### Traefik: 404 Not Found
**Problem**: Labels oder DNS falsch konfiguriert

**Lösung**:
```bash
# Labels prüfen
docker inspect llu_backend | grep traefik

# Traefik Dashboard prüfen
http://localhost:8080
```

### SSL Zertifikat wird nicht erstellt
**Problem**: Let's Encrypt kann Port 80 nicht erreichen

**Lösung**:
```bash
# Firewall prüfen
sudo ufw status

# Let's Encrypt Logs
docker compose logs traefik | grep acme
```

---

## 📊 Monitoring & Maintenance

### Logs ansehen
```bash
# Alle Services
docker compose logs -f

# Einzelner Service
docker compose logs -f luanti
docker compose logs -f directus

# Mit Zeitstempel
docker compose logs -f --timestamps
```

### Health Checks
```bash
# Container Status
docker compose ps

# Manueller Health Check
docker compose exec database pg_isready -U directus
docker compose exec redis redis-cli ping
curl http://localhost:8055/server/health
```

### Backups

#### Database Backup
```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker compose exec -T database pg_dump \
  -U directus \
  -d directus \
  > "$BACKUP_DIR/db_backup_$DATE.sql"

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +30 -delete
```

#### Directus Snapshot
```bash
# Schema exportieren
docker compose exec directus npx directus schema snapshot ./snapshots/schema.yaml
```

#### Luanti World Backup
```bash
# World Volume sichern
docker run --rm \
  -v luanti-learning-universe_luanti_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/luanti_world_$(date +%Y%m%d).tar.gz -C /data .
```

### Updates
```bash
# 1. Backup erstellen!

# 2. Images aktualisieren
docker compose pull

# 3. Container neu starten
docker compose up -d

# 4. Logs prüfen
docker compose logs -f
```

---

## 🔄 Rollback Strategy

### Database Rollback
```bash
# 1. Service stoppen
docker compose stop directus

# 2. Backup wiederherstellen
cat backup.sql | docker compose exec -T database psql -U directus -d directus

# 3. Service starten
docker compose start directus
```

### Code Rollback
```bash
# Zu vorheriger Version
git checkout <previous-commit>
docker compose up -d --build
```

---

## 📈 Performance Tuning

### PostgreSQL
In `docker-compose.yml` unter `database.environment`:
```yaml
# Für 8GB RAM Server
POSTGRES_SHARED_BUFFERS: "2GB"
POSTGRES_EFFECTIVE_CACHE_SIZE: "6GB"
POSTGRES_WORK_MEM: "50MB"
POSTGRES_MAINTENANCE_WORK_MEM: "512MB"
```

### Redis
```yaml
# In docker-compose.yml bei redis.command
command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Luanti
In `luanti/minetest.conf`:
```ini
# Für mehr Spieler
max_users = 100
num_emerge_threads = 8

# Für bessere Performance
max_block_send_distance = 8
```

---

## 🆘 Support

Bei Problemen:
1. Logs prüfen: `docker compose logs -f`
2. Container Status: `docker compose ps`
3. Health Checks: Siehe Monitoring Sektion
4. GitHub Issues: <your-repo>/issues

---

## 📝 License

AGPL-3.0