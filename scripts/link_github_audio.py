#!/usr/bin/env python3
"""
Link GitHub CDN Audio Paths to Supabase Database
This script populates the word_pairs table with correct audio URLs from the GitHub CDN.
"""
import os
import re
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

# GitHub CDN Base URL
GITHUB_CDN_BASE = "https://cdn.jsdelivr.net/gh/deafjamz/hearing-rehab-audio@main"

# --- HELPERS ---
def slugify(text):
    """Convert text to URL-friendly slug"""
    text = str(text).lower().strip()
    text = re.sub(r'[^a-z0-9-]', '', text.replace(' ', '-'))
    return re.sub(r'-+', '-', text)

def link_word_pairs_to_github():
    """Link word pairs to GitHub CDN audio files"""
    print("\n🔗 Linking Word Pairs to GitHub CDN...")

    response = supabase.table("word_pairs").select("*").execute()
    word_pairs = response.data

    if not word_pairs:
        print("⚠️ No word pairs found in database")
        return

    print(f"Found {len(word_pairs)} word pairs")

    for word_pair in word_pairs:
        word1 = word_pair['word_1']
        word2 = word_pair['word_2']
        word_pair_id = word_pair['id']

        slug1 = slugify(word1)
        slug2 = slugify(word2)

        update_data = {}

        # Map each voice to its audio paths
        voices = ['sarah', 'marcus', 'emma', 'david']

        for voice in voices:
            # GitHub folder structure: female_audio/sarah/, male_audio/david/, etc.
            if voice in ['sarah', 'emma']:
                folder = f"female_audio/{voice}"
            else:  # marcus, david
                folder = f"male_audio/{voice}"

            audio_1_url = f"{GITHUB_CDN_BASE}/{folder}/{slug1}.mp3"
            audio_2_url = f"{GITHUB_CDN_BASE}/{folder}/{slug2}.mp3"

            update_data[f'audio_1_path_{voice}'] = audio_1_url
            update_data[f'audio_2_path_{voice}'] = audio_2_url

        try:
            supabase.table("word_pairs").update(update_data).eq("id", word_pair_id).execute()
            print(f"   ✅ Linked: {word1} / {word2}")
        except Exception as e:
            print(f"   ❌ Failed to link {word1} / {word2}: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("GitHub CDN Audio Linker")
    print("=" * 60)
    link_word_pairs_to_github()
    print("\n✅ Done!")
