import requests
import time
import os
from dotenv import load_dotenv

load_dotenv()

# KONFIGURATION
LMS_API_BASE = "http://localhost:8055"
WEBHOOK_PATH = "/luanti-external-webhook" # Dein neuer funktionierender Pfad
WEBHOOK_SECRET = "test-secret"

def get_student_progress(cc_user_id):
    """Holt die abgeschlossenen Level direkt von CodeCombat"""
    # CodeCombat nutzt diese URL für User-Profile
    url = f"https://codecombat.com/db/user/{cc_user_id}/level.sessions?project=state.complete,levelID,levelName"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Fehler bei CC-Abfrage für {cc_user_id}: {e}")
        return []

def sync_to_lms(provider_uuid, cc_user_id, levels):
    """Sendet jedes abgeschlossene Level an das eigene LMS"""
    webhook_url = f"{LMS_API_BASE}{WEBHOOK_PATH}/{provider_uuid}"
    
    for session in levels:
        if session.get('state', {}).get('complete', False):
            level_id = session.get('levelID')
            
            payload = {
                "user_id": cc_user_id,
                "level_id": level_id,
                "status": "completed"
            }
            
            headers = {
                "X-Webhook-Secret": WEBHOOK_SECRET,
                "Content-Type": "application/json"
            }
            
            res = requests.post(webhook_url, json=payload, headers=headers)
            if res.status_code == 200:
                print(f"✅ Level '{level_id}' für {cc_user_id} synchronisiert.")
            else:
                # Da wir unique constraints haben, ist ein Fehler hier oft nur 'schon bekannt'
                pass

if __name__ == "__main__":
    # Beispiel: In der Produktion würdest du hier die IDs aus Directus laden
    # Für den ersten Test auf dem Server:
    PROVIDER_UUID = "2c0c153e-02d3-47fd-9925-426819c1cd6f"
    STUDENT_CC_ID = "deine-codecombat-id-oder-die-eines-schülers"
    
    print(f"Starte Sync für Schüler {STUDENT_CC_ID}...")
    completed_levels = get_student_progress(STUDENT_CC_ID)
    sync_to_lms(PROVIDER_UUID, STUDENT_CC_ID, completed_levels)
    print("Sync abgeschlossen.")