#!/bin/bash
# ==========================================================
# LUANTI LEARNING UNIVERSE - DEVELOPMENT STARTER
# ==========================================================

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Luanti Learning Universe Dev Environment...${NC}"

# 1. Docker Check & Start
echo -e "\n${YELLOW}[1/3] Checking Docker Containers...${NC}"
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker läuft nicht! Bitte Docker Desktop starten."
  exit 1
fi

docker compose up -d
# Warte kurz, damit Services Zeit haben
echo "Warte auf Services..."
sleep 3

# 2. Node Umgebung vorbereiten
echo -e "\n${YELLOW}[2/3] Setting up Node.js Environment...${NC}"

# NVM laden (Trickreich in Scripts!)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Version wechseln
echo "Switching to Node v22..."
nvm use 22

# 3. Frontend Starten
echo -e "\n${YELLOW}[3/3] Starting Frontend...${NC}"
echo -e "${GREEN}Web Interface: http://localhost:3000${NC}"
echo -e "${GREEN}Directus:      http://localhost:8055${NC}"
echo -e "Drücke STRG+C zum Beenden."
echo ""

cd frontend
npm run dev