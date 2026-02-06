# Nicht vergessen: chmod +x deploy.sh auf dem Server ausführen.

#!/bin/bash
echo "🚀 Starte Luanti-LMS Deployment..."

# 1. Neuesten Code holen
git pull origin develop

# 2. Frontend bauen (Docker übernimmt das)
docker compose build frontend

# 3. Container neu starten
docker compose up -d

# 4. Datenbank-Schema-Snapshot einspielen (optional)
# docker compose exec directus npx directus schema apply ./snapshots/snapshot.yaml -y

echo "✅ System ist online!"