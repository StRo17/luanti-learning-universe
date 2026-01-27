#!/bin/bash
# ==================================================================
# Luanti Learning Universe - Setup & Deployment Script
# ==================================================================
# Usage: ./setup.sh [dev|prod]
# ==================================================================

set -e  # Exit on error

ENV=${1:-dev}
COMPOSE_FILE="docker-compose.yml"

# Colors für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Luanti Learning Universe Setup${NC}"
echo -e "${GREEN}Environment: ${ENV}${NC}"
echo -e "${GREEN}================================${NC}"

# ------------------------------------------------------------------
# 1. Systemcheck
# ------------------------------------------------------------------
echo -e "\n${YELLOW}[1/7] Checking prerequisites...${NC}"

command -v docker >/dev/null 2>&1 || { echo -e "${RED}Error: Docker nicht installiert${NC}" >&2; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo -e "${RED}Error: Docker Compose nicht installiert${NC}" >&2; exit 1; }

echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"
echo -e "${GREEN}✓ Docker Compose found: $(docker compose version)${NC}"

# ------------------------------------------------------------------
# 2. .env Datei prüfen
# ------------------------------------------------------------------
echo -e "\n${YELLOW}[2/7] Checking .env file...${NC}"

if [ ! -f .env ]; then
    echo -e "${RED}Error: .env Datei nicht gefunden!${NC}"
    echo -e "${YELLOW}Kopiere .env.example nach .env und passe die Werte an.${NC}"
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env.example → .env kopiert${NC}"
        echo -e "${RED}WICHTIG: Bearbeite jetzt .env und setze sichere Passwörter!${NC}"
        exit 1
    else
        echo -e "${RED}Keine .env.example gefunden. Bitte manuell anlegen.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ .env file exists${NC}"

# Security Check für Production
if [ "$ENV" == "prod" ]; then
    echo -e "\n${YELLOW}Checking production security settings...${NC}"
    
    # Check für Default-Passwörter
    if grep -q "CHANGE_ME" .env || grep -q "REPLACE_WITH" .env; then
        echo -e "${RED}FEHLER: .env enthält noch Platzhalter!${NC}"
        echo -e "${RED}Bitte alle CHANGE_ME und REPLACE_WITH Werte ersetzen.${NC}"
        exit 1
    fi
    
    # Check KEY & SECRET Länge
    KEY_LENGTH=$(grep "^KEY=" .env | cut -d'=' -f2 | wc -c)
    SECRET_LENGTH=$(grep "^SECRET=" .env | cut -d'=' -f2 | wc -c)
    
    if [ "$KEY_LENGTH" -lt 32 ] || [ "$SECRET_LENGTH" -lt 32 ]; then
        echo -e "${RED}FEHLER: KEY und SECRET müssen mindestens 32 Zeichen lang sein!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Security checks passed${NC}"
fi

# ------------------------------------------------------------------
# 3. Verzeichnisstruktur erstellen
# ------------------------------------------------------------------
echo -e "\n${YELLOW}[3/7] Creating directory structure...${NC}"

mkdir -p backend/uploads
mkdir -p backend/extensions
mkdir -p backend/schema
mkdir -p luanti/mods/learning_core
mkdir -p luanti/games
mkdir -p proxy
mkdir -p logs

echo -e "${GREEN}✓ Directories created${NC}"

# ------------------------------------------------------------------
# 4. Permissions setzen
# ------------------------------------------------------------------
echo -e "\n${YELLOW}[4/7] Setting permissions...${NC}"

# Directus Uploads
chmod -R 755 backend/uploads 2>/dev/null || true

# Traefik acme.json (für SSL Zertifikate)
if [ ! -f proxy/acme.json ]; then
    touch proxy/acme.json
    chmod 600 proxy/acme.json
    echo -e "${GREEN}✓ Created acme.json for SSL certificates${NC}"
fi

# Logs
chmod -R 755 logs 2>/dev/null || true

echo -e "${GREEN}✓ Permissions set${NC}"

# ------------------------------------------------------------------
# 5. Docker Volumes initialisieren
# ------------------------------------------------------------------
echo -e "\n${YELLOW}[5/7] Initializing Docker volumes...${NC}"

# Luanti Data Volume muss mit korrekten Permissions erstellt werden
docker volume create --driver local luanti-learning-universe_luanti_data || true

echo -e "${GREEN}✓ Volumes initialized${NC}"

# ------------------------------------------------------------------
# 6. Container starten
# ------------------------------------------------------------------
echo -e "\n${YELLOW}[6/7] Starting containers...${NC}"

if [ "$ENV" == "prod" ]; then
    echo -e "${YELLOW}Production Mode: Building images...${NC}"
    docker compose -f $COMPOSE_FILE build --no-cache
fi

# Alte Container stoppen
docker compose -f $COMPOSE_FILE down 2>/dev/null || true

# Neue Container starten
docker compose -f $COMPOSE_FILE up -d

echo -e "${GREEN}✓ Containers started${NC}"

# ------------------------------------------------------------------
# 7. Health Checks
# ------------------------------------------------------------------
echo -e "\n${YELLOW}[7/7] Waiting for services to be healthy...${NC}"

# Warte auf Database
echo -n "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker compose exec -T database pg_isready -U directus -d directus >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 30 ]; then
        echo -e " ${RED}✗ Timeout${NC}"
        exit 1
    fi
done

# Warte auf Redis
echo -n "Waiting for Redis..."
for i in {1..15}; do
    if docker compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 15 ]; then
        echo -e " ${RED}✗ Timeout${NC}"
        exit 1
    fi
done

# Warte auf Directus
echo -n "Waiting for Directus..."
for i in {1..60}; do
    if curl -sf http://localhost:8055/server/health >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 60 ]; then
        echo -e " ${YELLOW}⚠ Directus braucht länger (normal beim ersten Start)${NC}"
        break
    fi
done

# Check Luanti
echo -n "Checking Luanti..."
sleep 5  # Gib Luanti Zeit zum Starten
if docker compose ps luanti | grep -q "Up"; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗ Luanti läuft nicht!${NC}"
    echo -e "${YELLOW}Zeige letzte Logs:${NC}"
    docker compose logs --tail=20 luanti
    exit 1
fi

# ------------------------------------------------------------------
# Fertig!
# ------------------------------------------------------------------
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Setup complete! 🚀${NC}"
echo -e "${GREEN}================================${NC}"
echo -e ""
echo -e "Services:"
echo -e "  ${GREEN}•${NC} Directus Admin:   ${YELLOW}http://localhost:8055${NC}"
echo -e "  ${GREEN}•${NC} Traefik Dashboard: ${YELLOW}http://localhost:8080${NC}"
echo -e "  ${GREEN}•${NC} Luanti Server:     ${YELLOW}localhost:30000${NC} (UDP)"
echo -e ""
echo -e "Admin Login (Directus):"
ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" .env | cut -d'=' -f2)
echo -e "  ${GREEN}•${NC} Email: ${YELLOW}${ADMIN_EMAIL}${NC}"
echo -e "  ${GREEN}•${NC} Password: ${YELLOW}(siehe .env)${NC}"
echo -e ""
echo -e "Useful commands:"
echo -e "  ${GREEN}•${NC} View logs:    ${YELLOW}docker compose logs -f${NC}"
echo -e "  ${GREEN}•${NC} Stop all:     ${YELLOW}docker compose down${NC}"
echo -e "  ${GREEN}•${NC} Restart all:  ${YELLOW}docker compose restart${NC}"
echo -e "  ${GREEN}•${NC} Shell (Luanti): ${YELLOW}docker compose exec luanti sh${NC}"
echo -e ""

if [ "$ENV" == "prod" ]; then
    echo -e "${RED}PRODUCTION CHECKLIST:${NC}"
    echo -e "  ${RED}[ ]${NC} SSL/TLS in Traefik aktiviert"
    echo -e "  ${RED}[ ]${NC} Firewall konfiguriert"
    echo -e "  ${RED}[ ]${NC} Backup-Strategie implementiert"
    echo -e "  ${RED}[ ]${NC} Monitoring eingerichtet"
    echo -e "  ${RED}[ ]${NC} Domain & DNS konfiguriert"
    echo -e ""
fi

exit 0