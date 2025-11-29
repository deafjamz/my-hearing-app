import os
import requests
import re
from dotenv import load_dotenv
from supabase import create_client, Client
import time # Import time for sleep

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- SCHEMA REFRESH TRICK ---
# This is a known workaround for Supabase PostgREST schema caching issues.
# A simple query can sometimes force the schema to refresh.
print("🔄 Attempting to refresh Supabase schema cache...")
try:
    supabase.table("stories").select("id").limit(1).execute()
    print("✅ Schema refresh initiated with dummy query.")
except Exception as e:
    print(f"⚠️ Could not perform dummy query for schema refresh: {e}")

time.sleep(2) # Give it a moment after the dummy query

# --- HELPERS ---

def slugify(text):
    text = str(text).lower().strip()
    text = re.sub(r'[^a-z0-9-]', '', text.replace(' ', '-'))
    return re.sub(r'-+', '-', text)

def link_stories():
    print("\n🔗 Linking Stories Audio & Alignment for all voices...")
    response = supabase.table("stories").select("*").execute()
    stories = response.data
    
    for story in stories:
        title = story['title']
        slug = slugify(title)
        story_id = story['id']

        update_data = {}
        base_storage = f"{SUPABASE_URL}/storage/v1/object/public"

        voices_map = {
            'sarah': {'audio_col': 'audio_sarah_path', 'align_col': 'alignment_sarah_path'},
            'marcus': {'audio_col': 'audio_marcus_path', 'align_col': 'alignment_marcus_path'},
            'emma': {'audio_col': 'audio_emma_path', 'align_col': 'alignment_emma_path'},
            'david': {'audio_col': 'audio_david_path', 'align_col': 'alignment_david_path'}
        }

        for voice_name, cols in voices_map.items():
            audio_path = f"stories/{voice_name}/{slug}.mp3"
            align_path = f"stories/{voice_name}/{slug}.json"

            update_data[cols['audio_col']] = f"{base_storage}/audio/{audio_path}"
            update_data[cols['align_col']] = f"{base_storage}/alignment/{align_path}"
        
        try:
            supabase.table("stories").update(update_data).eq("id", story_id).execute()
            print(f"   ✅ Linked: {title}")
        except Exception as e:
            print(f"   ❌ Failed to link {title}: {e}")

def link_words():
    print("\n🔗 Linking Word Pairs Audio & Alignment for all voices...")
    response = supabase.table("word_pairs").select("*").execute()
    word_pairs = response.data

    for word_pair in word_pairs:
        word1 = word_pair['word_1']
        word2 = word_pair['word_2']
        word_pair_id = word_pair['id']

        update_data = {}
        base_storage = f"{SUPABASE_URL}/storage/v1/object/public"

        voices_map = {
            'sarah': {'audio_col': 'audio_sarah_path', 'align_col': 'alignment_sarah_path'},
            'marcus': {'audio_col': 'audio_marcus_path', 'align_col': 'alignment_marcus_path'},
            'emma': {'audio_col': 'audio_emma_path', 'align_col': 'alignment_emma_path'},
            'david': {'audio_col': 'audio_david_path', 'align_col': 'alignment_david_path'}
        }

        for voice_name, cols in voices_map.items():
            # For word pairs, we generate each word separately
            slug1 = slugify(word1)
            slug2 = slugify(word2)

            audio1_path = f"words/{voice_name}/{slug1}.mp3"
            audio2_path = f"words/{voice_name}/{slug2}.mp3"
            align1_path = f"words/{voice_name}/{slug1}.json"
            align2_path = f"words/{voice_name}/{slug2}.json"

            # Update audio paths
            update_data['audio_1_path'] = f"{base_storage}/audio/{audio1_path}" 
            update_data['audio_2_path'] = f"{base_storage}/audio/{audio2_path}"
            
            # Update alignment paths
            update_data[cols['align_col']] = f"{base_storage}/alignment/{align1_path}" # Assuming single alignment_X_path for word pairs now

        try:
            supabase.table("word_pairs").update(update_data).eq("id", word_pair_id).execute()
            print(f"   ✅ Linked: {word1} / {word2}")
        except Exception as e:
            print(f"   ❌ Failed to link {word1} / {word2}: {e}")

if __name__ == "__main__":
    link_stories()
    link_words()