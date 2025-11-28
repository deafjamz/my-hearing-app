import os
import shutil
import csv

# Source placeholder file (we know this exists)
SOURCE_FILE = "hearing-rehab-audio/female_audio/story_timid_teacup.mp3"
AUDIO_REPO_PATH = "hearing-rehab-audio"

# Voice directories to populate
VOICES = ["david", "marcus", "sarah", "emma"]

def create_placeholders():
    print("▶️ CREATING PLACEHOLDER AUDIO FILES...")
    
    if not os.path.exists(SOURCE_FILE):
        print(f"❌ Source file not found: {SOURCE_FILE}")
        return

    # Read the filenames we need from the CSV
    scenarios = []
    with open("coffee_shop_scenarios.csv", 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            scenarios.append(row['Filename'])
            
    print(f"📋 Found {len(scenarios)} target filenames.")
    
    count = 0
    for voice in VOICES:
        folder = f"{AUDIO_REPO_PATH}/{voice}_audio"
        if not os.path.exists(folder):
            os.makedirs(folder)
            
        for filename in scenarios:
            dest_path = f"{folder}/{filename}"
            if not os.path.exists(dest_path):
                shutil.copy(SOURCE_FILE, dest_path)
                print(f"  - Created placeholder: {dest_path}")
                count += 1
            else:
                print(f"  - Exists: {dest_path}")
                
    print(f"\n✅ Created {count} placeholder files.")
    print("⚠️  Note: These files contain 'Story Timid Teacup' audio, not the actual scenario text.")
    print("    This allows you to test the UI flow until the API payment issue is resolved.")

if __name__ == "__main__":
    create_placeholders()
