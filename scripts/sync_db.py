import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
import glob

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing Supabase Credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_text(val):
    if pd.isna(val): return ""
    return str(val).strip().strip('"').replace('...', '').strip()

def sync_words():
    print("\n🔄 Syncing Word Pairs...")
    word_csv_path = os.path.join("content/source_csvs", "Hearing Rehab Project - Words.csv")
    if not os.path.exists(word_csv_path): return
    
    df = pd.read_csv(word_csv_path)
    records = []
    df.columns = [c.strip() for c in df.columns]
    
    w1_col = next((c for c in df.columns if 'Word1' in c or 'Correct' in c), None)
    w2_col = next((c for c in df.columns if 'Word2' in c or 'Option' in c), None)
    cat_col = next((c for c in df.columns if 'Category' in c or 'Set' in c), 'Category')
    tier_col = next((c for c in df.columns if 'tier' in c or 'Tier' in c), 'tier') 

    for _, row in df.iterrows():
        w1_clean = clean_text(row[w1_col])
        w2_clean = clean_text(row[w2_col])
        if not w1_clean or not w2_clean: continue

        records.append({
            "word_1": w1_clean,
            "word_2": w2_clean,
            "clinical_category": clean_text(row.get(cat_col, 'General')),
            "tier": clean_text(row.get(tier_col, 'free'))
        })
    
    if records:
        try:
            supabase.table("word_pairs").upsert(records, on_conflict="word_1, word_2").execute()
            print(f"   ✅ Synced {len(records)} word pairs.")
        except Exception as e:
            print(f"   ❌ Sync Error for word pairs: {e}")

def sync_stories():
    print("\n🔄 Syncing Stories...")
    story_csv_path = os.path.join("content/source_csvs", "Hearing Rehab Project - Stories.csv")
    if not os.path.exists(story_csv_path): return

    df = pd.read_csv(story_csv_path)
    df.columns = [c.strip() for c in df.columns]
    
    records = []
    title_col = next((c for c in df.columns if 'Title' in c), None)
    text_col = next((c for c in df.columns if 'Text' in c or 'Story' in c), None)
    tier_col = next((c for c in df.columns if 'tier' in c or 'Tier' in c), 'tier')
    
    for _, row in df.iterrows():
        records.append({
            "title": clean_text(row[title_col]),
            "transcript": clean_text(row[text_col]),
            "tier": clean_text(row.get(tier_col, 'free'))
        })

    if records:
        try:
            supabase.table("stories").upsert(records, on_conflict="title").execute()
            print(f"   ✅ Synced {len(records)} stories.")
        except Exception as e:
            print(f"   ❌ Sync Error for stories: {e}")

def sync_scenarios():
    print("\n🔄 Syncing Scenarios...")
    
    # 1. Sync Metadata (Parents)
    meta_path = "content/source_csvs/scenarios_meta.csv"
    if not os.path.exists(meta_path):
        print("   ⚠️ No scenarios_meta.csv found.")
        return

    df_meta = pd.read_csv(meta_path)
    meta_records = []
    
    # We need to fetch existing IDs if we want to link items correctly?
    # Actually, we can just upsert the scenarios. 
    # But we need the UUIDs for the items.
    # We'll rely on the 'id' column in CSV as a lookup key, but Supabase generates UUIDs.
    # Wait, for scenarios, we can use a fixed ID or slug?
    # The schema says `id uuid default uuid_generate_v4()`.
    # Ideally we upsert based on `title`? Or add a `slug` column?
    # Let's query existing scenarios by title to get their IDs.
    
    # For simplicity in this iteration: Delete existing scenarios to avoid orphans and re-insert?
    # Or better: Search by title.
    
    existing_scenarios = {} # title -> uuid
    
    # Insert/Update Parents
    for _, row in df_meta.iterrows():
        data = {
            "title": clean_text(row['title']),
            "description": clean_text(row['description']),
            "difficulty": clean_text(row['difficulty']), # Enum '1', '2' etc
            "tier": clean_text(row['tier'])
            # 'ambience_path' updated by generation script later
        }
        
        # Check if exists
        res = supabase.table("scenarios").select("id").eq("title", data["title"]).execute()
        if res.data:
            # Update
            sid = res.data[0]['id']
            supabase.table("scenarios").update(data).eq("id", sid).execute()
            existing_scenarios[row['id']] = sid # Map CSV ID to DB UUID
        else:
            # Insert
            res = supabase.table("scenarios").insert(data).execute()
            if res.data:
                existing_scenarios[row['id']] = res.data[0]['id']
    
    print(f"   ✅ Synced {len(existing_scenarios)} scenario definitions.")

    # 2. Sync Dialogue (Children)
    dialogue_path = "content/source_csvs/scenarios_dialogue.csv"
    if not os.path.exists(dialogue_path): return
    
    df_dialogue = pd.read_csv(dialogue_path)
    item_records = []
    
    # First, clear items for these scenarios to avoid duplicates/ordering issues?
    # Yes, deleting items for these specific scenarios is safer for a sync.
    for db_id in existing_scenarios.values():
        supabase.table("scenario_items").delete().eq("scenario_id", db_id).execute()

    for _, row in df_dialogue.iterrows():
        csv_id = row['scenario_id']
        if csv_id not in existing_scenarios:
            print(f"   ⚠️ Skipping item for unknown scenario: {csv_id}")
            continue
            
        item_records.append({
            "scenario_id": existing_scenarios[csv_id],
            "speaker": clean_text(row['speaker']),
            "text": clean_text(row['text']),
            "order": int(row['order'])
            # 'audio_path' updated by generation script later
        })
    
    if item_records:
        try:
            supabase.table("scenario_items").insert(item_records).execute()
            print(f"   ✅ Synced {len(item_records)} dialogue lines.")
        except Exception as e:
            print(f"   ❌ Sync Error for items: {e}")


def main():
    print("🚀 Starting Database Sync...")
    sync_words()
    sync_stories()
    sync_scenarios()
    print("✨ Sync Complete.")

if __name__ == "__main__":
    main()