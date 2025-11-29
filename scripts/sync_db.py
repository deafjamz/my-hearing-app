import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
import glob

# Load env (handle potential missing lib if running outside venv, but we will run in venv)
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing Supabase Credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_text(val):
    if pd.isna(val): return ""
    return str(val).strip().strip('"')

def sync_words():
    print("\n🔄 Syncing Word Pairs...")
    # Prioritize 'Hearing Rehab Project - Words.csv' as it's the master
    word_csv_path = os.path.join("content/source_csvs", "Hearing Rehab Project - Words.csv")
    if not os.path.exists(word_csv_path):
        print(f"   ⚠️ Master Words CSV not found at {word_csv_path}.")
        return
    
    df = pd.read_csv(word_csv_path)
    records = []
    
    # Ensure columns are stripped for robust lookup
    df.columns = [c.strip() for c in df.columns]
    
    w1_col = next((c for c in df.columns if 'Word1' in c or 'Correct' in c), None)
    w2_col = next((c for c in df.columns if 'Word2' in c or 'Option' in c), None)
    cat_col = next((c for c in df.columns if 'Category' in c or 'Set' in c), 'Category')
    tier_col = next((c for c in df.columns if 'tier' in c or 'Tier' in c), 'tier') # Look for 'tier' or 'Tier'
    
    if not w1_col or not w2_col:
        print("   ❌ Columns Word1/Word2 (or Correct/Option) not found in Words CSV.")
        return

    for _, row in df.iterrows():
        records.append({
            "word_1": clean_text(row[w1_col]),
            "word_2": clean_text(row[w2_col]),
            "category": clean_text(row.get(cat_col, 'General')),
            "tier": clean_text(row.get(tier_col, 'free'))
        })
    
    if records:
        try:
            # Use upsert with on_conflict to handle existing entries and prevent duplicates
            response = supabase.table("word_pairs").upsert(records, on_conflict="word_1, word_2").execute()
            print(f"   ✅ Synced {len(records)} word pairs.")
        except Exception as e:
            print(f"   ❌ Sync Error for word pairs: {e}")

def sync_stories():
    print("\n🔄 Syncing Stories...")
    # Prioritize 'Hearing Rehab Project - Stories.csv' as it's the master
    story_csv_path = os.path.join("content/source_csvs", "Hearing Rehab Project - Stories.csv")
    if not os.path.exists(story_csv_path):
        print(f"   ⚠️ Master Stories CSV not found at {story_csv_path}. Falling back to others if available.")
        # Fallback to other story CSVs if the master isn't found
        fallback_files = glob.glob("content/source_csvs/*tories*.csv") + \
                         glob.glob("content/source_csvs/story_data_for_sheets.csv")
        if fallback_files: story_csv_path = fallback_files[0]
        else: 
            print("   ❌ No Stories CSV found anywhere.")
            return

    df = pd.read_csv(story_csv_path)
    df.columns = [c.strip() for c in df.columns]
    
    records = []
    title_col = next((c for c in df.columns if 'Title' in c), None)
    text_col = next((c for c in df.columns if 'Text' in c or 'Story' in c), None)
    tier_col = next((c for c in df.columns if 'tier' in c or 'Tier' in c), 'tier')
    
    if not title_col or not text_col:
        print("   ❌ Title/Text columns not found in Stories CSV.")
        return

    for _, row in df.iterrows():
        records.append({
            "title": clean_text(row[title_col]),
            "transcript": clean_text(row[text_col]),
            "tier": clean_text(row.get(tier_col, 'free'))
        })

    if records:
        try:
            response = supabase.table("stories").upsert(records, on_conflict="title").execute()
            print(f"   ✅ Synced {len(records)} stories.")
        except Exception as e:
            print(f"   ❌ Sync Error for stories: {e}")

def main():
    print("🚀 Starting Database Sync...")
    sync_words()
    sync_stories()
    # Scenarios logic requires JSON parsing of items, leaving for next iteration
    print("✨ Sync Complete.")

if __name__ == "__main__":
    main()
