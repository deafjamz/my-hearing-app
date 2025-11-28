import os
import requests
import csv

# Base URL for raw files
BASE_URL = "https://raw.githubusercontent.com/deafjamz/hearing-rehab-audio/main"
AUDIO_REPO_PATH = "hearing-rehab-audio"

# Voice config
VOICES = ["david", "marcus", "sarah", "emma"]

def download_files():
    print("▶️ DOWNLOADING REAL AUDIO FILES FROM GITHUB...")
    
    # Get list of filenames
    filenames = []
    with open("coffee_shop_scenarios.csv", 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            filenames.append(row['Filename'])
            
    print(f"📋 Found {len(filenames)} target filenames.")
    
    downloaded = 0
    errors = 0
    
    for voice in VOICES:
        print(f"\n🎤 Processing Voice: {voice.upper()}")
        local_folder = f"{AUDIO_REPO_PATH}/{voice}_audio"
        remote_folder = f"{voice}_audio"
        
        if not os.path.exists(local_folder):
            os.makedirs(local_folder)
            
        for filename in filenames:
            url = f"{BASE_URL}/{remote_folder}/{filename}"
            local_path = f"{local_folder}/{filename}"
            
            print(f"  - Downloading: {filename} ... ", end="")
            
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    with open(local_path, 'wb') as f:
                        f.write(response.content)
                    print("✅")
                    downloaded += 1
                else:
                    print(f"❌ ({response.status_code})")
                    errors += 1
            except Exception as e:
                print(f"❌ Error: {e}")
                errors += 1
                
    print(f"\n🎉 Download Complete!")
    print(f"   - Success: {downloaded}")
    print(f"   - Errors:  {errors}")

if __name__ == "__main__":
    download_files()
