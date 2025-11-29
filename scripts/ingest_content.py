import csv
import os
import glob
import json
import re

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_DIR = os.path.join(BASE_DIR, 'content', 'source_csvs')
OUTPUT_DIR = os.path.join(BASE_DIR, 'src', 'data')

# --- HELPER FUNCTIONS ---

def clean_text(text):
    """Cleans text: strips whitespace/quotes, removes '...'."""
    if text is None: return ""
    return str(text).strip().strip('"').strip("'").replace('...', '')

def normalize_header(header):
    """Standardizes header string."""
    return header.lower().strip()

def get_tier(row, headers, col_name='tier'):
    """Extracts tier from row, defaulting to 'free'."""
    idx = headers.get(col_name)
    if idx is None: return 'free'
    # Handle case where row might be shorter than headers
    if idx >= len(row): return 'free'
    
    val = clean_text(row[idx]).lower()
    if val not in ['free', 'standard', 'premium']:
        return 'free'
    return val

def get_col_index(headers, possible_names):
    """Finds index of a column matching one of the possible names."""
    for name in possible_names:
        if name in headers:
            return headers[name]
    return None

def read_csv_file(file_path):
    """Reads a CSV file and returns headers (dict mapping name->index) and rows."""
    rows = []
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        try:
            header_row = next(reader)
            headers = {normalize_header(h): i for i, h in enumerate(header_row)}
            for row in reader:
                rows.append(row)
        except StopIteration:
            return {}, []
    return headers, rows

def get_val(row, headers, possible_names, default=''):
    """Safe value extraction from a row based on column names."""
    idx = get_col_index(headers, possible_names)
    if idx is None or idx >= len(row):
        return default
    return clean_text(row[idx])

# --- PROCESSING LOGIC ---

def process_word_pairs(file_path):
    print(f"   -> Processing Word Pairs from: {os.path.basename(file_path)}")
    headers, rows = read_csv_file(file_path)
    pairs = []
    
    # Check for required columns
    if get_col_index(headers, ['word1', 'correct']) is None or \
       get_col_index(headers, ['word2', 'incorrect', 'option']) is None:
        print(f"      ⚠️ Skipping {os.path.basename(file_path)}: Missing 'word1' or 'word2' columns.")
        return []

    for row in rows:
        w1 = get_val(row, headers, ['word1', 'correct'])
        w2 = get_val(row, headers, ['word2', 'incorrect', 'option'])
        file_name = get_val(row, headers, ['file', 'audio', 'filename'], w1.lower())
        category = get_val(row, headers, ['category', 'set'], 'Unknown')
        tier = get_tier(row, headers)
        
        if not w1 or not w2: continue
        
        if ':' in category:
            category = category.split(':')[-1].strip()

        # Entry 1
        pairs.append({
            "id": len(pairs) + 1,
            "correct": w1, 
            "options": [w1, w2], 
            "file": file_name.replace('.mp3', '').lower(), 
            "category": category,
            "tier": tier
        })
        # Entry 2
        pairs.append({
            "id": len(pairs) + 1,
            "correct": w2, 
            "options": [w2, w1], 
            "file": file_name.replace('.mp3', '').lower(), 
            "category": category,
            "tier": tier
        })
    return pairs

def process_stories(file_path):
    print(f"   -> Processing Stories from: {os.path.basename(file_path)}")
    headers, rows = read_csv_file(file_path)
    stories = []
    
    if get_col_index(headers, ['title']) is None or \
       get_col_index(headers, ['text', 'story']) is None:
        print(f"      ⚠️ Skipping {os.path.basename(file_path)}: Missing 'title' or 'text' columns.")
        return []

    for i, row in enumerate(rows):
        title = get_val(row, headers, ['title'])
        if not title: continue
        
        audio_id = get_val(row, headers, ['audioid', 'filename', 'audiofile']).replace('.mp3', '')
        if not audio_id:
            audio_id = re.sub(r'[^a-z0-9]', '', title.lower())[:30]

        stories.append({
            "id": f"story_{i + 1}",
            "title": title,
            "text": get_val(row, headers, ['text', 'story']),
            "audioId": audio_id,
            "tier": get_tier(row, headers)
        })
    return stories

def process_scenarios(file_path):
    filename = os.path.basename(file_path)
    print(f"   -> Processing Scenarios from: {filename}")
    headers, rows = read_csv_file(file_path)
    scenarios = []

    # Logic to group rows by scenario_id
    scenario_map = {} # id -> list of rows
    
    id_col_idx = get_col_index(headers, ['scenario_id', 'scenario'])
    
    if id_col_idx is not None:
        for row in rows:
            if id_col_idx < len(row):
                sid = clean_text(row[id_col_idx])
                if sid:
                    if sid not in scenario_map: scenario_map[sid] = []
                    scenario_map[sid].append(row)
    else:
        # Treat whole file as one scenario
        base_id = filename.replace('_scenarios.csv', '').replace('.csv', '').replace('_', ' ')
        scenario_map[base_id] = rows

    for scenario_key, group_rows in scenario_map.items():
        if not group_rows: continue
        
        first_row = group_rows[0]
        
        # Calculate Difficulty
        diffs = set()
        for r in group_rows:
            diffs.add(get_val(r, headers, ['difficulty'], 'easy'))
        
        if len(diffs) == 1:
            difficulty = list(diffs)[0]
        elif len(diffs) > 1:
            difficulty = "Mixed"
        else:
            difficulty = "Intermediate"

        scenario_obj = {
            "id": re.sub(r'[^a-z0-9]', '', str(scenario_key).lower()),
            "title": str(scenario_key).replace('_', ' ').title(),
            "difficulty": difficulty,
            "description": f"Practice listening in a {str(scenario_key).replace('_', ' ')} environment.",
            "items": [],
            "tier": get_tier(first_row, headers)
        }

        for i, row in enumerate(group_rows):
            text = get_val(row, headers, ['text', 'dialogue', 'sentence'])
            if not text: continue
            
            item_id = re.sub(r'[^a-z0-9]', '', text.lower())[:20]
            speaker = get_val(row, headers, ['speaker', 'character'], 'Narrator')
            item_diff = get_val(row, headers, ['difficulty'], 'easy')

            scenario_obj["items"].append({
                "id": item_id if item_id else f"item_{i+1}",
                "speaker": speaker,
                "text": text,
                "difficulty": item_diff
            })
        
        if scenario_obj["items"]:
            scenarios.append(scenario_obj)
            
    return scenarios

# --- MAIN ORCHESTRATOR ---

def main():
    if not os.path.exists(INPUT_DIR):
        print(f"❌ Error: Input directory not found at {INPUT_DIR}")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    all_csvs = glob.glob(os.path.join(INPUT_DIR, "*.csv"))

    all_word_pairs = []
    all_stories = []
    all_scenarios = []

    print(f"🚀 Found {len(all_csvs)} CSV files in '{INPUT_DIR}'. Starting ingestion...")

    for file_path in all_csvs:
        filename = os.path.basename(file_path).lower()
        try:
            if "word" in filename:
                all_word_pairs.extend(process_word_pairs(file_path))
            elif "story" in filename or "stories" in filename:
                all_stories.extend(process_stories(file_path))
            elif "scenario" in filename:
                all_scenarios.extend(process_scenarios(file_path))
            else:
                print(f"   -> Skipping unrecognized file pattern: {filename}")
        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")

    # --- WRITE OUTPUT FILES ---
    if all_word_pairs:
        output_file = os.path.join(OUTPUT_DIR, 'wordPairs.ts')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"// Generated from CSVs. Total items: {len(all_word_pairs)}\n")
            f.write("export const WORD_PAIRS = ")
            f.write(json.dumps(all_word_pairs, indent=2))
            f.write(";\n")
        print(f"✅ Wrote {len(all_word_pairs)} word pairs to {output_file}")

    if all_stories:
        output_file = os.path.join(OUTPUT_DIR, 'stories.ts')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"// Generated from CSVs. Total items: {len(all_stories)}\n")
            f.write("import { ActivityData } from '../types/activity';\n\n")
            f.write("export const STORIES: ActivityData[] = ")
            
            transformed_stories = []
            for s in all_stories:
                transformed_stories.append({
                    "id": s['id'],
                    "title": s['title'],
                    "transcript": s['text'],
                    "audioSrc": f"{s['audioId']}.mp3",
                    "questions": [],
                    "tier": s['tier']
                })
            
            f.write(json.dumps(transformed_stories, indent=2))
            f.write(";\n")
        print(f"✅ Wrote {len(all_stories)} stories to {output_file}")
        
    if all_scenarios:
        output_file = os.path.join(OUTPUT_DIR, 'scenarios.ts')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("// Auto-generated by scripts/ingest_content.py\n")
            f.write("import { Scenario } from '../types/activity';\n\n")
            f.write("export const scenarios: Scenario[] = ")
            f.write(json.dumps(all_scenarios, indent=2))
            f.write(";\n")
        print(f"✅ Wrote {len(all_scenarios)} scenarios to {output_file}")
        
    print("✨ Content ingestion complete.")

if __name__ == "__main__":
    main()
