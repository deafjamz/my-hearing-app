import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_KEY = os.getenv("ELEVENLABS_API_KEY")

if not API_KEY:
    print("❌ Error: No API Key found in .env")
    exit(1)

def test_forced_alignment():
    print("🔍 Testing Forced Alignment API directly...")
    
    # Endpoint: The specific endpoint for alignment
    url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/with-timestamps"
    
    # Headers
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json"
    }

    # Payload: We MUST use a compatible model (Turbo v2.5 is safest for alignment)
    data = {
        "text": "This is a test of the alignment system.",
        "model_id": "eleven_turbo_v2_5", 
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    try:
        print(f"👉 Sending request to: {url}")
        print(f"👉 Model: {data['model_id']}")
        
        response = requests.post(url, json=data, headers=headers)
        
        print(f"STATUS CODE: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS! Alignment data received.")
            response_json = response.json()
            # Check if 'alignment' key exists (it returns audio_base64 + alignment)
            if 'alignment' in response_json:
                print("   - Timestamp data present.")
                print(f"   - Characters: {len(response_json['alignment']['characters'])}")
            else:
                print("   ⚠️  Response 200 OK, but missing 'alignment' key?")
                print(response_json.keys())
        else:
            print("❌ FAILURE.")
            print(f"Response: {response.text}")
            
            # Clinical Diagnosis based on error
            if "missing_permissions" in response.text:
                print("\n🚨 DIAGNOSIS: Your API Key is strictly blocked from this feature.")
                print("   Action: This confirms it is a Plan Tier issue, not a code issue.")
            elif "model_id" in response.text:
                print("\n🚨 DIAGNOSIS: Wrong Model ID.")
            
    except Exception as e:
        print(f"❌ Network Error: {e}")

if __name__ == "__main__":
    test_forced_alignment()