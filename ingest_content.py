import pandas as pd
import os
import json
import glob

# --- CONFIG ---
INPUT_DIR = 'content/source_csvs'
OUTPUT_DIR = 'src/data'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def clean_text(text):
    if pd.isna(text): return ""
    return str(text).strip().strip('"').strip("'")

# --- 1. PROCESS WORD PAIRS ---
def process_words():
    print("Processing Words...")
    # Attempt to find the words file
    csv_path = os.path.join(INPUT_DIR, 'Hearing Rehab Project - Words.csv')
            
    if not os.path.exists(csv_path):
        print(f"⚠️  Missing Words CSV at {csv_path}. Skipping.")
        return

    df = pd.read_csv(csv_path)
    pairs = []
    id_counter = 1
    
    for _, row in df.iterrows():
        w1 = clean_text(row.get('Word1'))
        w2 = clean_text(row.get('Word2'))
        set_name = clean_text(row.get('Set'))
        
        if not w1 or not w2 or w1.lower() == 'word1': continue
        
        category = set_name.split(':')[-1].strip() if ':' in set_name else set_name

        # Entry 1 (Word 1 Correct)
        pairs.append({
            "id": id_counter,
            "correct": w1,
            "options": [w1, w2],
            "file": w1.lower().replace("...", "").strip(),
            "category": category
        })
        id_counter += 1

        # Entry 2 (Word 2 Correct)
        pairs.append({
            "id": id_counter,
            "correct": w2,
            "options": [w2, w1],
            "file": w2.lower().replace("...", "").strip(),
            "category": category
        })
        id_counter += 1

    ts_content = f"export const WORD_PAIRS = {json.dumps(pairs, indent=2)};"
    with open(os.path.join(OUTPUT_DIR, 'wordPairs.ts'), 'w') as f:
        f.write(f"// Generated from Hearing Rehab Project - Words.csv\\n{ts_content}")
    print(f"✅ Generated src/data/wordPairs.ts ({len(pairs)} items)")

# --- 2. PROCESS STORIES ---
def process_stories():
    print("Processing Stories...")
    csv_path = os.path.join(INPUT_DIR, 'Hearing Rehab Project - Stories.csv')
    
    if not os.path.exists(csv_path):
        print(f"⚠️  Missing Stories CSV. Skipping.")
        return
        
    df = pd.read_csv(csv_path)
    stories = []
    
    for i, row in df.iterrows():
        title = clean_text(row.get('Title'))
        if not title: continue
        
        stories.append({
            "id": f"story_{i+1}",
            "title": title,
            "text": clean_text(row.get('Text')),
            "audioId": clean_text(row.get('Filename', '')).replace('.mp3', '')
        })
        
    ts_content = f"export const STORIES = {json.dumps(stories, indent=2)};"
    with open(os.path.join(OUTPUT_DIR, 'stories.ts'), 'w') as f:
        f.write(f"// Generated from Stories CSV\\n{ts_content}")
    print(f"✅ Generated src/data/stories.ts ({len(stories)} items)")

# --- 3. PROCESS SCENARIOS ---
def process_scenarios():
    print("Processing Scenarios...")
    csv_path = os.path.join(INPUT_DIR, 'Hearing Rehab Project - Scenarios.csv')

    if not os.path.exists(csv_path):
        print("⚠️  Missing Scenarios CSV. Skipping.")
        return

    df = pd.read_csv(csv_path)
    all_scenarios = {}
    
    for scenario_id, group in df.groupby('scenario_id'):
        steps = []
        for _, row in group.iterrows():
            steps.append({
                "speaker": clean_text(row.get('Speaker')),
                "text": clean_text(row.get('Text')),
                "audioId": clean_text(row.get('Filename')).replace('.mp3', '')
            })
            
        all_scenarios[scenario_id] = {
            "id": scenario_id,
            "title": scenario_id.replace('_', ' ').title(),
            "steps": steps
        }
        
    ts_content = f"export const SCENARIOS = {json.dumps(all_scenarios, indent=2)};"
    with open(os.path.join(OUTPUT_DIR, 'scenarios.ts'), 'w') as f:
        f.write(f"// Generated from Scenarios CSVs\\n{ts_content}")
    print(f"✅ Generated src/data/scenarios.ts ({len(all_scenarios)} scenarios)")

if __name__ == "__main__":
    try:
        # Check for pandas before running main logic
        import pandas as pd 
    except ImportError:
        print("❌ ERROR: pandas library not found.")
        print("Please run: pip install pandas")
        exit(1)
        
    print("🚀 Starting Content Ingestion Engine...")
    process_words()
    process_stories()
    process_scenarios()
    print("✨ Content Pipeline Complete!")