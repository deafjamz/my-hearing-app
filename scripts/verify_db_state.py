import os
from supabase import create_client
import json

def get_key_from_env_file(key_name, file_path=".env"):
    if not os.path.exists(file_path): return None
    with open(file_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                if key.strip() == key_name:
                    return value.strip()
    return None

SUPABASE_URL = get_key_from_env_file("SUPABASE_URL")
SUPABASE_KEY = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing Supabase credentials.")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

TARGET_STORY_ID = 'story_001_whispering_woods'

def verify_data():
    print(f"--- Verifying Data for Story ID: {TARGET_STORY_ID} ---")

    # 1. Verify Story Record
    print("\n[1/2] Fetching Story Record...")
    story_response = supabase.table('stories').select('*').eq('id', TARGET_STORY_ID).execute()

    if not story_response.data:
        print("❌ CRITICAL: Story record not found in the database!")
        return

    story_data = story_response.data[0]
    print("✅ Story Record Found. Analyzing fields...")

    # Check for the critical asset paths
    required_paths = [
        'audio_sarah_path', 'alignment_sarah_path',
        'audio_marcus_path', 'alignment_marcus_path'
    ]
    
    all_paths_present = True
    for path in required_paths:
        if not story_data.get(path):
            print(f"  - ❌ MISSING: The '{path}' field is empty or null.")
            all_paths_present = False
        else:
            print(f"  - ✅ PRESENT: '{path}' has a value.")
            
    if not all_paths_present:
        print("  - 🔴 CONCLUSION: The story pipeline failed to update the record with generated asset URLs.")
    else:
        print("  - 🟢 CONCLUSION: All required asset paths are present in the database record.")


    # 2. Verify Questions
    print("\n[2/2] Fetching Associated Questions...")
    questions_response = supabase.table('story_questions').select('*').eq('story_id', TARGET_STORY_ID).execute()

    if not questions_response.data:
        print("❌ CRITICAL: No questions found for this story!")
    else:
        print(f"✅ Found {len(questions_response.data)} associated questions.")
        # print(json.dumps(questions_response.data, indent=2))

if __name__ == "__main__":
    verify_data()
