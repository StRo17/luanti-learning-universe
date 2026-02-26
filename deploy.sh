# Nicht vergessen: chmod +x deploy.sh auf dem Server ausführen.

#!/bin/bash
set -e
echo "🚀 Starte Luanti-LMS Deployment im Production-Modus..."

# 1. Neuesten Code holen
git pull origin develop

# Swap-Check für Systeme mit weniger als 2GB RAM
total_mem=$(free -m | awk '/^Mem:/{print $2}')
if [ "$total_mem" -lt 2000 ]; then
    echo "⚠️  Weniger als 2GB RAM verfügbar. Erstelle temporären Swap..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    trap 'sudo swapoff /swapfile && sudo rm /swapfile' EXIT
fi

# 2. Frontend im Production-Modus bauen
docker compose build frontend --build-arg NODE_ENV=production

# 3. Container neu starten
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Datenbank-Schema-Snapshot einspielen (optional)
# docker compose exec directus npx directus schema apply ./snapshots/snapshot.yaml -y

echo "✅ System ist online!"