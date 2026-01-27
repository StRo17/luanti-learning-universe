#!/bin/bash
# ==================================================================
# Directus Schema Management Script
# ==================================================================
# Usage: 
#   ./manage-schema.sh export   # Exportiert aktuelles Schema
#   ./manage-schema.sh import   # Importiert snapshot.yaml
#   ./manage-schema.sh diff     # Zeigt Unterschiede
# ==================================================================

set -e

SNAPSHOT_FILE="backend/schema/snapshot.yaml"
CONTAINER_NAME="llu_backend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Prüfe ob Container läuft
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}Error: Container $CONTAINER_NAME läuft nicht!${NC}"
    echo -e "${YELLOW}Starte zuerst: docker compose up -d${NC}"
    exit 1
fi

case "$1" in
    export)
        echo -e "${YELLOW}📤 Exportiere Schema aus Directus...${NC}"
        
        # Schema exportieren
        docker compose exec directus npx directus schema snapshot /directus/snapshots/snapshot.yaml --yes
        
        # Timestamp hinzufügen
        DATE=$(date +%Y%m%d_%H%M%S)
        cp "$SNAPSHOT_FILE" "backend/schema/snapshot_${DATE}.yaml"
        
        echo -e "${GREEN}✅ Schema exportiert nach:${NC}"
        echo -e "   - ${YELLOW}${SNAPSHOT_FILE}${NC} (aktuell)"
        echo -e "   - ${YELLOW}backend/schema/snapshot_${DATE}.yaml${NC} (Backup)"
        echo -e ""
        echo -e "${GREEN}📝 Nächster Schritt:${NC}"
        echo -e "   git add backend/schema/snapshot.yaml"
        echo -e "   git commit -m 'Update schema snapshot'"
        ;;
        
    import)
        echo -e "${YELLOW}📥 Importiere Schema in Directus...${NC}"
        
        if [ ! -f "$SNAPSHOT_FILE" ]; then
            echo -e "${RED}Error: $SNAPSHOT_FILE nicht gefunden!${NC}"
            exit 1
        fi
        
        echo -e "${RED}⚠️  WARNUNG: Dies überschreibt das aktuelle Schema!${NC}"
        read -p "Fortfahren? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            echo -e "${YELLOW}Abgebrochen.${NC}"
            exit 0
        fi
        
        # Schema importieren
        docker compose exec directus npx directus schema apply --yes /directus/snapshots/snapshot.yaml
        
        echo -e "${GREEN}✅ Schema erfolgreich importiert!${NC}"
        ;;
        
    diff)
        echo -e "${YELLOW}🔍 Vergleiche aktuelles Schema mit snapshot.yaml...${NC}"
        
        if [ ! -f "$SNAPSHOT_FILE" ]; then
            echo -e "${RED}Error: $SNAPSHOT_FILE nicht gefunden!${NC}"
            exit 1
        fi
        
        # Aktuelles Schema exportieren (temp)
        docker compose exec directus npx directus schema snapshot /tmp/current_schema.yaml --yes
        
        # Diff anzeigen
        echo -e "${YELLOW}Unterschiede (Datei vs. Datenbank):${NC}"
        docker compose exec directus diff /directus/snapshots/snapshot.yaml /tmp/current_schema.yaml || true
        
        echo -e ""
        echo -e "${GREEN}Legende:${NC}"
        echo -e "  ${RED}- Rot:${NC} In snapshot.yaml, aber NICHT in DB"
        echo -e "  ${GREEN}+ Grün:${NC} In DB, aber NICHT in snapshot.yaml"
        ;;
        
    auto-import)
        # Wird vom bootstrap.sh verwendet
        echo -e "${YELLOW}🔄 Auto-Import beim Container-Start...${NC}"
        
        if [ ! -f "$SNAPSHOT_FILE" ]; then
            echo -e "${YELLOW}⚠️  Kein snapshot.yaml gefunden - überspringe Import${NC}"
            exit 0
        fi
        
        docker compose exec directus npx directus schema apply --yes /directus/snapshots/snapshot.yaml
        echo -e "${GREEN}✅ Schema automatisch importiert!${NC}"
        ;;
        
    *)
        echo "Usage: $0 {export|import|diff}"
        echo ""
        echo "Commands:"
        echo "  export  - Exportiert aktuelles Schema aus Directus"
        echo "  import  - Importiert snapshot.yaml in Directus"
        echo "  diff    - Zeigt Unterschiede zwischen Datei und DB"
        echo ""
        exit 1
        ;;
esac

exit 0