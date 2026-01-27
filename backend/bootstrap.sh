#!/bin/sh
# ==================================================================
# Directus Schema Bootstrap Script
# Wird automatisch beim Container-Start ausgeführt
# ==================================================================
# Importiert snapshot.yaml ins Directus wenn vorhanden
# ==================================================================

set -e

SNAPSHOT_FILE="/directus/snapshots/snapshot.yaml"

echo "🔍 Checking for schema snapshot..."

if [ -f "$SNAPSHOT_FILE" ]; then
    echo "✅ Found snapshot: $SNAPSHOT_FILE"
    echo "📥 Importing schema into Directus..."
    
    # Schema direkt importieren (ohne install check)
    npx directus schema apply --yes "$SNAPSHOT_FILE" || {
        echo "⚠️  Schema import failed, but continuing..."
    }
    
    echo "✅ Schema import attempted!"
else
    echo "⚠️  No snapshot.yaml found at $SNAPSHOT_FILE"
    echo "ℹ️  Directus will start with empty schema"
fi

echo "🚀 Starting Directus..."

# Starte Directus normal
exec npx directus start