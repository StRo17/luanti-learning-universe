# Bevorzuge: pip install python-dotenv requests

import os
import json
import requests
from dotenv import load_dotenv

# Lade .env.test für Entwicklungsumgebung
load_dotenv('.env.test')

# API Konfiguration
# WEBHOOK_URL = os.getenv('CODECOMBAT_WEBHOOK_URL', 'http://localhost:8055/luanti-external-webhook/webhook/CODECOMBAT')
# WEBHOOK_SECRET = os.getenv('CODECOMBAT_WEBHOOK_SECRET', 'test-secret')
PROVIDER_ID = "2c0c153e-02d3-47fd-9925-426819c1cd6f"
WEBHOOK_URL = f'http://localhost:8055/directus-extension-luanti-external-webhook/{PROVIDER_ID}'
WEBHOOK_SECRET = "test-secret"

def simulate_level_complete(user_id: str, level_id: str):
    """Simuliert einen Level-Complete Webhook von CodeCombat"""
    
    payload = {
        "event": "level-complete",
        "created": "2024-01-01T12:00:00Z",
        "properties": {
            "levelID": level_id,
            "userID": f"codecombat-{user_id}",
            "levelName": "Test Level"
        }
    }

    headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': WEBHOOK_SECRET
    }

    try:
        response = requests.post(
            WEBHOOK_URL,
            headers=headers,
            json=payload
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Test mit Demo-Daten
    simulate_level_complete(
        user_id="1",  # Directus User ID
        level_id="test-level-1"  # CodeCombat Level ID
    )