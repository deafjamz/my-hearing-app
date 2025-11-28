# ==============================================================================
# PART 1: INSTALL LIBRARIES
# ==============================================================================
# !pip install --upgrade --quiet google-api-python-client google-auth-httplib2 google-auth-oauthlib pandas requests

# ==============================================================================
# PART 2: IMPORTS
# ==============================================================================
import os
import base64
import pandas as pd
import requests
import time
import json
import re
from google.colab import userdata
from google.colab import auth as colab_auth
from google.auth import default as default_auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from urllib.parse import quote
from datetime import datetime

# ==============================================================================
# PART 3: CONFIGURATION
# ==============================================================================
print("▶️ Loading configuration...")

# --- Main Configuration (from Colab Secrets) ---
try:
    ELEVENLABS_API_KEY = userdata.get('ELEVENLABS_API_KEY')
    FEMALE_VOICE_ID = userdata.get('FEMALE_VOICE_ID') 
    MALE_VOICE_ID = userdata.get('MALE_VOICE_ID')   
    SHEET_URL = userdata.get('SHEET_URL')
    GITHUB_USERNAME = userdata.get('GITHUB_USERNAME')
    GITHUB_REPO_NAME = userdata.get('GITHUB_REPO_NAME')
    GITHUB_TOKEN = userdata.get('GITHUB_TOKEN')
    print("✅ Secrets loaded successfully.")
except Exception as e:
    print(f"❌ ERROR: Could not load secrets. Please ensure all 7 secrets are created. Error: {e}")

# --- Generation Controls ---
GENERATE_WORDS = False          # Change to False
GENERATE_SENTENCES = False      # Change to False  
GENERATE_KEYWORDS = False       # Change to False
GENERATE_STORIES = True         # Add this line

GENERATE_FEMALE_VOICE = True    # Keep as True
GENERATE_MALE_VOICE = False     # Change to False

RUN_CLEANUP = False # Set to True to delete old/unused files from GitHub

# ==============================================================================
# PART 4: HELPER FUNCTIONS
# ==============================================================================

def slugify(text):
    """Creates a robust, web-safe filename from any text string."""
    if not text: return ''
    text = text.lower()
    text = text.replace('...', '') # Remove ellipses first
    text = re.sub(r'\s+', '-', text) # Replace spaces with hyphens
    text = re.sub(r'[^\w\-]+', '', text) # Remove all non-word characters except hyphens
    text = re.sub(r'--+', '-', text) # Replace multiple hyphens with a single one
    text = text.strip('-') # Remove leading/trailing hyphens
    return text

def authenticate_google():
    """Handles Google authentication using Colab's built-in features."""
    print("▶️ Authenticating with Google...")
    try:
        colab_auth.authenticate_user()
        creds, _ = default_auth()
        print("✅ Google Authentication Successful!")
        return creds
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        raise

def get_sheet_as_df(creds, sheet_name):
    """Fetches a specific sheet from the Google Sheet as a pandas DataFrame."""
    try:
        service = build('sheets', 'v4', credentials=creds)
        spreadsheet_id = SHEET_URL.split('/d/')[1].split('/')[0]
        result = service.spreadsheets().values().get(spreadsheetId=spreadsheet_id, range=sheet_name).execute()
        values = result.get('values', [])
        if not values: return pd.DataFrame()
        return pd.DataFrame(values[1:], columns=values[0])
    except HttpError as e:
        print(f"    - ❌ Error fetching sheet '{sheet_name}': {e}")
        return pd.DataFrame()

def check_github_rate_limit():
    """Checks and prints the current GitHub API rate limit status."""
    print("\n▶️ Checking GitHub API Rate Limit...")
    headers = {"Authorization": f"token {GITHUB_TOKEN}"}
    response = requests.get("https://api.github.com/rate_limit", headers=headers)
    if response.status_code == 200:
        data = response.json()
        core_limit = data['resources']['core']
        reset_time = datetime.fromtimestamp(core_limit['reset'])
        print(f"✅ Status: {core_limit['remaining']} / {core_limit['limit']} requests remaining.")
        print(f"   - Limit will reset at: {reset_time.strftime('%Y-%m-%d %H:%M:%S')}")
        return core_limit['remaining']
    else:
        print("❌ Could not check rate limit.")
        return 0

def get_existing_github_files(folder_name):
    """Gets a set of filenames that already exist in a GitHub folder."""
    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    api_url = f"https://api.github.com/repos/{GITHUB_USERNAME}/{GITHUB_REPO_NAME}/contents/{folder_name}"
    response = requests.get(api_url, headers=headers)
    if response.status_code == 200:
        return {file_info['name'] for file_info in response.json() if file_info['type'] == 'file'}
    return set()

def generate_audio_for_voice(text_items, voice_id, voice_name, existing_files, custom_filenames=None):
    """Generates audio files for a specific voice, skipping existing ones."""
    print(f"\n▶️ Generating audio for {voice_name.upper()} voice...")
    output_folder = f"{voice_name}_audio"
    if not os.path.exists(output_folder): os.makedirs(output_folder)
    headers = {"Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY}
    api_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    failed_items = []
    
    for i, text in enumerate(text_items):
        # 🆕 NEW: Use custom filename if provided (for stories), otherwise slugify the text
        if custom_filenames and i < len(custom_filenames):
            clean_filename = custom_filenames[i]
        else:
            clean_filename = f"{slugify(text)}.mp3"
            
        if clean_filename in existing_files:
            continue 

        file_path = os.path.join(output_folder, clean_filename)
        if os.path.exists(file_path): continue 
        
        print(f"  - Generating: {clean_filename}")
        success = False
        for attempt in range(3):
            data = {"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}
            try:
                response = requests.post(api_url, json=data, headers=headers)
                if response.status_code == 200:
                    with open(file_path, 'wb') as f: f.write(response.content)
                    success = True; break
                else:
                    print(f"    - ⚠️ Attempt {attempt + 1}/3 failed: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"    - ⚠️ Attempt {attempt + 1}/3 failed with network error: {e}")
            if attempt < 2: time.sleep(3)
        if not success: failed_items.append(text)
        time.sleep(1.2)
    print(f"✅ {voice_name.upper()} audio generation complete.")
    return failed_items

def upload_folder_to_github(folder_name):
    """Uploads all files from a local folder to GitHub, handling create vs. update and rate limits."""
    print(f"\n▶️ Uploading '{folder_name}' folder to GitHub...")
    if not os.path.exists(folder_name): return

    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    for filename in os.listdir(folder_name):
        github_path = f"{folder_name}/{filename}"
        api_url = f"https://api.github.com/repos/{GITHUB_USERNAME}/{GITHUB_REPO_NAME}/contents/{github_path}"
        
        filepath = os.path.join(folder_name, filename)
        
        # --- DEFINITIVE FIX for upload error ---
        for attempt in range(3): 
            # 1. Check if the file exists to get its SHA for updating
            get_response = requests.get(api_url, headers=headers)
            sha = get_response.json().get('sha') if get_response.status_code == 200 else None

            # 2. Prepare the file content and payload
            with open(filepath, 'rb') as file_content:
                content_base64 = base64.b64encode(file_content.read()).decode('utf-8')
            
            data = {"message": f"Add/update audio file: {github_path}", "content": content_base64, "sha": sha}
            
            # 3. Use PUT for both create and update
            response = requests.put(api_url, headers=headers, data=json.dumps(data))
            
            if response.status_code in [200, 201]:
                if response.status_code == 201:
                    print(f"  - ✅ Successfully CREATED '{filename}'")
                else:
                    print(f"  - ✅ Successfully UPDATED '{filename}'")
                break # Success, exit retry loop
            elif response.status_code == 403 and 'rate limit' in response.text.lower():
                print(f"    - ⚠️ Rate limit hit on '{filename}'. Pausing for 60 seconds...")
                time.sleep(60)
                print("    - Resuming...")
            else:
                # For other errors like 422, print it and break
                print(f"    - ❌ Error processing '{filename}': {response.status_code} {response.json()}"); break
        
        time.sleep(1.2) # Delay between each file to be polite to the API

def process_stories_test(creds):
    print("\n▶️ Processing SINGLE STORY for testing from Stories tab...")
    df_stories = get_sheet_as_df(creds, 'Stories')
    if df_stories.empty:
        print("    - ❌ No Stories tab found or no data in Stories tab.")
        return [], []
    story_texts = []
    story_filenames = []
    print(f"    - 📊 Found {len(df_stories)} rows in Stories tab")
    if len(df_stories) > 0:
        row = df_stories.iloc[0]
        try:
            set_name = row['Set'] if 'Set' in row and pd.notna(row['Set']) else ""
            title = row['Title'] if 'Title' in row and pd.notna(row['Title']) else ""
            text = row['Text'] if 'Text' in row and pd.notna(row['Text']) else ""
            filename = row['Filename'] if 'Filename' in row and pd.notna(row['Filename']) else ""
            print(f"    - 📋 Set: {set_name}")
            print(f"    - 📖 Title: {title}")
            print(f"    - 📄 Text length: {len(text)} characters")
            print(f"    - 🎵 Filename: {filename}")
            if text and filename:
                story_texts.append(text)
                story_filenames.append(filename)
                print(f"    - 🧪 TEST: Found story: {title} -> {filename}")
                print(f"    - 📝 Text preview: {text[:100]}...")
            else:
                print(f"    - ❌ Missing text or filename in first row")
        except Exception as e:
            print(f"    - ⚠️ Error processing test story row: {e}")
    print(f"✅ Found {len(story_texts)} story for testing.")
    return story_texts, story_filenames

# ==============================================================================
# PART 5: MAIN EXECUTION
# ==============================================================================

if __name__ == "__main__":
    try:
        check_github_rate_limit()
        google_creds = authenticate_google()

        print("\n▶️ Loading data from Google Sheet tabs...")
        all_text_to_generate = set()
        custom_filenames = []  # 🆕 NEW: For storing custom story filenames
        
        if GENERATE_WORDS:
            df_words = get_sheet_as_df(google_creds, 'Words')
            if not df_words.empty:
                all_text_to_generate.update(df_words['Word1'].dropna()); all_text_to_generate.update(df_words['Word2'].dropna())
        if GENERATE_SENTENCES:
            df_sentences = get_sheet_as_df(google_creds, 'Sentences')
            if not df_sentences.empty:
                all_text_to_generate.update(df_sentences['Sentence1'].dropna()); all_text_to_generate.update(df_sentences['Sentence2'].dropna())
        if GENERATE_KEYWORDS:
            df_keywords = get_sheet_as_df(google_creds, 'Keywords')
            if not df_keywords.empty:
                all_text_to_generate.update(df_keywords['Sentence'].dropna()); all_text_to_generate.update(df_keywords['Keyword1'].dropna()); all_text_to_generate.update(df_keywords['Keyword2'].dropna())
        
        # 🆕 NEW: Process stories separately to preserve custom filenames
        story_texts = []
        story_filenames = []
        
        # 🧪 Process ONLY first story for testing
        if GENERATE_STORIES:
            story_texts, story_filenames = process_stories_test(google_creds)
        
        unique_text_items = sorted(list(all_text_to_generate))
        total_items = len(unique_text_items) + len(story_texts)
        print(f"✅ Found {len(unique_text_items)} unique text items + {len(story_texts)} stories = {total_items} total items to process.")

        failed_logs = {}
        if GENERATE_FEMALE_VOICE:
            existing_female_files = get_existing_github_files("female_audio")
            
            # Generate regular items
            failed_logs['female'] = generate_audio_for_voice(unique_text_items, FEMALE_VOICE_ID, "female", existing_female_files)
            
            # Generate stories with custom filenames
            if story_texts:
                print(f"\n🧪 TEST: Generating {len(story_texts)} stories for FEMALE voice...")
                story_failures = generate_audio_for_voice(story_texts, FEMALE_VOICE_ID, "female", existing_female_files, story_filenames)
                failed_logs['female'].extend(story_failures)
            
            upload_folder_to_github("female_audio")

        if GENERATE_MALE_VOICE:
            existing_male_files = get_existing_github_files("male_audio")
            
            # Generate regular items
            failed_logs['male'] = generate_audio_for_voice(unique_text_items, MALE_VOICE_ID, "male", existing_male_files)
            
            # 🆕 NEW: Generate stories with custom filenames
            if story_texts:
                print(f"\n▶️ Generating {len(story_texts)} stories for MALE voice...")
                story_failures = generate_audio_for_voice(story_texts, MALE_VOICE_ID, "male", existing_male_files, story_filenames)
                failed_logs['male'].extend(story_failures)
            
            upload_folder_to_github("male_audio")
        
        print("\n🚀 Automation Complete!")
        if any(failed_logs.values()):
            print("\n⚠️ NOTE: Some items failed to generate.")
            for voice, failures in failed_logs.items():
                if failures: print(f"  - {voice.capitalize()} voice failures: {failures}")

    except Exception as e:
        print(f"\n❌ A critical error occurred in the main execution: {e}")
