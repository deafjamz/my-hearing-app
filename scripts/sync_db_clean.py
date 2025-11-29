import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
import glob
import time

# Load env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing Supabase Credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_text(val):
    if pd.isna(val): return ""
    # Strip quotes, spaces, and specifically ellipses '...'
    s = str(val).strip().strip('"')
    s = s.replace('...', '')
    return s.strip()

def sync_words():
    print("\n🔄 Syncing Word Pairs...")
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
    tier_col = next((c for c in df.columns if 'tier' in c or 'Tier' in c), 'tier') 
    
    if not w1_col or not w2_col:
        print("   ❌ Columns Word1/Word2 (or Correct/Option) not found in Words CSV.")
        return

    for _, row in df.iterrows():
        # CLEAN THE TEXT HERE
        w1_clean = clean_text(row[w1_col])
        w2_clean = clean_text(row[w2_col])
        
        if not w1_clean or not w2_clean: continue

        records.append({
            "word_1": w1_clean,
            "word_2": w2_clean,
            "clinical_category": clean_text(row.get(cat_col, 'General')), # Mapped to new column
            "tier": clean_text(row.get(tier_col, 'free'))
        })
    
    if records:
        try:
            print("   ⚠️ Truncating word_pairs table to ensure cleanliness...")
            # Deleting all rows to reset IDs and ensure no duplicates of dirty data
            supabase.table("word_pairs").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute() 
            
            response = supabase.table("word_pairs").insert(records).execute()
            print(f"   ✅ Synced {len(records)} clean word pairs.")
            
        except Exception as e:
            print(f"   ❌ Sync Error for word pairs: {e}")

def main():
    print("🚀 Starting Clean Database Sync...")
    sync_words()
    print("✨ Sync Complete. IMPORTANT: Run link_audio_paths.py next to restore audio links!")

if __name__ == "__main__":
    main()