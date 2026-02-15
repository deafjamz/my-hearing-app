#!/usr/bin/env python3
"""
Check word audio files in Supabase Storage
"""
import os
from supabase import create_client, Client

# --- Custom .env Loader ---
def get_key_from_env_file(key_name, file_path=".env"):
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith(f'{key_name}='):
                return line.split('=', 1)[1].strip()
    return None

# --- CONFIGURATION ---
SUPABASE_URL = get_key_from_env_file("SUPABASE_URL")
SUPABASE_KEY = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_words_folder():
    """Check what's in the words folder"""
    print("\n📂 Checking audio/words folder structure")
    print("=" * 60)

    try:
        # List folders in words/
        folders = supabase.storage.from_("audio").list("words")

        if not folders:
            print("   ⚠️ No voice folders found in audio/words/")
            return

        print(f"   Found {len(folders)} voice folders:")
        for folder in folders:
            print(f"\n   📁 {folder['name']}/")

            # List files in this voice folder
            files = supabase.storage.from_("audio").list(f"words/{folder['name']}")
            print(f"      Files: {len(files)}")

            # Show first 5 files
            for file in files[:5]:
                print(f"      - {file['name']}")

            if len(files) > 5:
                print(f"      ... and {len(files) - 5} more files")

    except Exception as e:
        print(f"   ❌ Error: {e}")

def get_sample_word_urls():
    """Get sample URLs for testing"""
    print("\n🔗 Sample Audio URLs")
    print("=" * 60)

    voices = ['sarah', 'david', 'marcus', 'emma']
    base_url = f"{SUPABASE_URL}/storage/v1/object/public"

    for voice in voices:
        url = f"{base_url}/audio/words/{voice}/seat.mp3"
        print(f"   {voice}: {url}")

if __name__ == "__main__":
    print("🔍 Checking Word Audio Files in Supabase Storage")
    print("=" * 60)

    check_words_folder()
    get_sample_word_urls()

    print("\n✅ Done!")
