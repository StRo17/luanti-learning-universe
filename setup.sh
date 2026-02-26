#!/bin/bash
set -e

# Sicherheitsprüfung
if [ "$1" != "prod" ]; then
  echo "⚠️ Bitte nur im Produktionsmodus ausführen: ./setup.sh prod"
  exit 1
fi

# Prüfe vorhandene .env
if [ -f .env ]; then
  read -p "⚠️ .env existiert bereits. Überschreiben? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "➔ Abbruch: .env bleibt unverändert."
    exit 0
  fi
  cp .env .env.bak
  echo "➔ Backup der existierenden .env erstellt."
fi

# Erstelle .env aus Beispiel
if [ ! -f .env ]; then
  cp .env.example .env
  echo "➔ Neue .env aus Vorlage erstellt."
fi

# Interaktive Eingaben
read -p "🌐 Domain-Name [localhost]: " DOMAIN_NAME
DOMAIN_NAME="${DOMAIN_NAME:-localhost}"

read -p "✉️ SSL-E-Mail (für Let's Encrypt): " SSL_EMAIL

# Generiere sichere Werte
declare -A REPLACEMENTS=(
  ["POSTGRES_PASSWORD"]="$(openssl rand -hex 24)"
  ["DIRECTUS_ADMIN_TOKEN"]="$(openssl rand -hex 48)"
  ["KEY"]="$(openssl rand -hex 32)"
  ["SECRET"]="$(openssl rand -hex 64)"
  ["ADMIN_PASSWORD"]="$(openssl rand -base64 32 | tr -d '=+/')"
)

# Ersetze Platzhalter in .env
sed -i "s/DOMAIN_NAME=.*/DOMAIN_NAME=$DOMAIN_NAME/" .env
sed -i "s/SSL_EMAIL=.*/SSL_EMAIL=$SSL_EMAIL/" .env

for key in "${!REPLACEMENTS[@]}"; do
  value="${REPLACEMENTS[$key]}"
  sed -i "s/^${key}=.*/${key}='${value}'/" .env
done

# Ersetze alle generischen Platzhalter
sed -i \
  -e "s/change-me/$(openssl rand -hex 16)/g" \
  -e "s/replace-with-generated-secure-password/$(openssl rand -hex 32)/g" \
  -e "s/example\.com/${DOMAIN_NAME}/g" \
  -e "s/your-domain/${DOMAIN_NAME}/g" \
  .env

# Finale Überprüfung
if grep -q -E 'replace-me|change-me|example\.com|your-domain' .env; then
  echo "❌ FEHLER: Es verbleiben unersetzte Platzhalter!"
  grep -E 'replace-me|change-me|example\.com|your-domain' .env
  exit 1
fi

# Erstelle acme.json mit korrekten Berechtigungen
mkdir -p proxy
touch proxy/acme.json
chmod 600 proxy/acme.json

echo "✅ Setup abgeschlossen! Starte mit: docker compose up -d"

# chmod +x setup.sh