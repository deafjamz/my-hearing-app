import os
import requests
import re
from dotenv import load_dotenv
from supabase import create_client, Client
import time # Import time for sleep

# --- Custom .env Loader (Bypasses python-dotenv issues) ---
def get_key_from_env_file(key_name, file_path=".env"):
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith(f'{key_name}=')}:
                return line.split('=', 1)[1].strip()
    return None

# --- CONFIGURATION ---
ELEVENLABS_API_KEY = get_key_from_env_file("ELEVENLABS_API_KEY")
SUPABASE_URL = get_key_from_env_file("SUPABASE_URL")
SUPABASE_KEY = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY")

if not all([ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- HELPERS ---

def slugify(text):
    text = str(text).lower().strip()
    text = re.sub(r'[^a-z0-9-]', '', text.replace(' ', '-'))
    return re.sub(r'-+', '-', text)

def link_stories():
    print("\n🔗 Linking Stories Audio & Alignment for all voices...")
    # Fetch all stories
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
            slug1 = slugify(word1)
            slug2 = slugify(word2)

            audio1_path = f"words/{voice_name}/{slug1}.mp3"
            audio2_path = f"words/{voice_name}/{slug2}.mp3"
            align1_path = f"words/{voice_name}/{slug1}.json"
            align2_path = f"words/{voice_name}/{slug2}.json"

            update_data['audio_1_path'] = f"{base_storage}/audio/{audio1_path}" 
            update_data['audio_2_path'] = f"{base_storage}/audio/{audio2_path}"
            
            # We need explicit columns for word alignment paths if desired.
            # For now, no separate alignment columns for word_pairs, only using the audio_N_path.
            # If we need alignment, we'd use alignment_X_path etc. as done for stories.
            # Since generate_assets_premier.py for words IS creating alignment JSONs, 
            # we should update the DB schema and then here.
            
            update_data[cols['align_col']] = f"{base_storage}/alignment/{align1_path}" # Link alignment for word 1 only

        try:
            supabase.table("word_pairs").update(update_data).eq("id", word_pair_id).execute()
            print(f"   ✅ Linked: {word1} / {word2}")
        except Exception as e:
            print(f"   ❌ Failed to link {word1} / {word2}: {e}")

if __name__ == "__main__":
    print("🔄 Attempting to refresh Supabase schema cache...")
    try:
        supabase.table("stories").select("id").limit(1).execute()
        print("✅ Schema refresh initiated with dummy query.")
    except Exception as e:
        print(f"⚠️ Could not perform dummy query for schema refresh: {e}")
    time.sleep(2) # Give it a moment after the dummy query
    
    link_stories()
    link_words()
