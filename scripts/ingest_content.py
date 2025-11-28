import pandas as pd
import os
import glob
import json
import re

# --- CONFIGURATION ---
# Assumes this script is in the 'scripts' directory at the project root.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_DIR = os.path.join(BASE_DIR, 'content', 'source_csvs')
OUTPUT_DIR = os.path.join(BASE_DIR, 'src', 'data')

# --- HELPER FUNCTIONS ---

def clean_text(text):
    """Cleans text from CSVs: handles None, strips whitespace/quotes, removes '...'."""
    if pd.isna(text): return ""
    return str(text).strip().strip('"').strip("'").replace('...', '')

def normalize_headers(df):
    """Standardizes DataFrame column headers to lowercase and stripped."""
    df.columns = [c.lower().strip() for c in df.columns]
    return df

# --- PROCESSING LOGIC ---

def process_word_pairs(file_path):
    """Processes a word pairs CSV into a list of pair objects."""
    print(f"   -> Processing Word Pairs from: {os.path.basename(file_path)}")
    df = normalize_headers(pd.read_csv(file_path))
    pairs = []
    
    # Determine the correct column names, allowing for variations
    word1_col = next((col for col in df.columns if 'word1' in col or 'correct' in col), None)
    word2_col = next((col for col in df.columns if 'word2' in col or 'incorrect' in col or 'option' in col), None)
    file_col = next((col for col in df.columns if 'file' in col or 'audio' in col or 'filename' in col), None)
    category_col = next((col for col in df.columns if 'category' in col or 'set' in col), None)

    if not word1_col or not word2_col:
        print(f"      ⚠️ Skipping {os.path.basename(file_path)}: Missing 'word1' or 'word2'/'option' columns.")
        return []

    for _, row in df.iterrows():
        w1 = clean_text(row.get(word1_col))
        w2 = clean_text(row.get(word2_col))
        file_name = clean_text(row.get(file_col, w1.lower())) # Default to word1 if no file specified
        category = clean_text(row.get(category_col, 'Unknown'))
        
        if not w1 or not w2: continue
        
        # Extract category if it's in a "Set: Category" format
        if ':' in category:
            category = category.split(':')[-1].strip()

        # Entry 1 (Word 1 Correct)
        pairs.append({
            "id": len(pairs) + 1,
            "correct": w1, 
            "options": [w1, w2], 
            "file": file_name.replace('.mp3', '').lower(), 
            "category": category
        })
        # Entry 2 (Word 2 Correct)
        pairs.append({
            "id": len(pairs) + 1,
            "correct": w2, 
            "options": [w2, w1], 
            "file": file_name.replace('.mp3', '').lower(), 
            "category": category
        })
    return pairs

def process_stories(file_path):
    """Processes a stories CSV into a list of story objects."""
    print(f"   -> Processing Stories from: {os.path.basename(file_path)}")
    df = normalize_headers(pd.read_csv(file_path))
    stories = []
    
    # Determine column names
    title_col = next((col for col in df.columns if 'title' in col), None)
    text_col = next((col for col in df.columns if 'text' in col or 'story' in col), None)
    audio_col = next((col for col in df.columns if 'audioid' in col or 'filename' in col or 'audiofile' in col), None)

    if not title_col or not text_col:
        print(f"      ⚠️ Skipping {os.path.basename(file_path)}: Missing 'title' or 'text'/'story' columns.")
        return []

    for i, row in df.iterrows():
        title = clean_text(row.get(title_col))
        if not title: continue
        
        audio_id = clean_text(row.get(audio_col, '')).replace('.mp3', '')
        # If audioId is empty, try to generate one from the title
        if not audio_id:
            audio_id = re.sub(r'[^a-z0-9]', '', title.lower())[:30]

        stories.append({
            "id": f"story_{i + 1}", # Use row index for ID
            "title": title,
            "text": clean_text(row.get(text_col)),
            "audioId": audio_id
        })
    return stories

def process_scenarios(file_path):
    """Processes a scenario CSV into a list of scenario objects."""
    filename = os.path.basename(file_path)
    print(f"   -> Processing Scenarios from: {filename}")
    df = normalize_headers(pd.read_csv(file_path))
    scenarios = []

    # Determine column names
    scenario_id_col = next((col for col in df.columns if 'scenario_id' in col or 'scenario' in col), None)
    speaker_col = next((col for col in df.columns if 'speaker' in col or 'character' in col), None)
    text_col = next((col for col in df.columns if 'text' in col or 'dialogue' in col or 'sentence' in col), None)
    difficulty_col = next((col for col in df.columns if 'difficulty' in col), None)

    # If no specific scenario ID column, use filename as the base ID
    if scenario_id_col:
        groups = df.groupby(scenario_id_col)
    else:
        base_scenario_id = filename.replace('_scenarios.csv', '').replace('.csv', '').replace('_', ' ')
        groups = [(base_scenario_id, df)] # Treat the whole file as one scenario

    for scenario_key, group in groups:
        scenario_obj = {
            "id": re.sub(r'[^a-z0-9]', '', str(scenario_key).lower()),
            "title": str(scenario_key).replace('_', ' ').title(),
            "difficulty": "Intermediate", # Default
            "description": f"Practice listening in a {str(scenario_key).replace('_', ' ')} environment.",
            "items": []
        }
        
        # Attempt to infer difficulty from the group if possible
        if difficulty_col:
            unique_difficulties = group[difficulty_col].dropna().unique()
            if len(unique_difficulties) == 1:
                scenario_obj["difficulty"] = clean_text(unique_difficulties[0])
            elif len(unique_difficulties) > 1:
                 # If multiple difficulties, maybe use the most common or a default
                 scenario_obj["difficulty"] = "Mixed" 

        for i, row in enumerate(group.itertuples()):
            text = clean_text(getattr(row, text_col) if text_col else '')
            if not text: continue
            
            item_id = re.sub(r'[^a-z0-9]', '', text.lower())[:20]
            speaker = clean_text(getattr(row, speaker_col, 'Narrator'))
            difficulty = clean_text(getattr(row, difficulty_col, 'easy'))

            scenario_obj["items"].append({
                "id": item_id if item_id else f"item_{i+1}",
                "speaker": speaker,
                "text": text,
                "difficulty": difficulty
            })
        
        # Only add scenario if it has items
        if scenario_obj["items"]:
            scenarios.append(scenario_obj)
            
    return scenarios

# --- MAIN ORCHESTRATOR ---

def main():
    """Finds all CSVs in the source directory and processes them polymorphically."""
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
            if "word" in filename and "pair" in filename:
                all_word_pairs.extend(process_word_pairs(file_path))
            elif "story" in filename: # "story" or "stories"
                all_stories.extend(process_stories(file_path))
            elif "scenario" in filename:
                all_scenarios.extend(process_scenarios(file_path))
            else:
                print(f"   -> Skipping unrecognized file pattern: {filename}")
        except pd.errors.EmptyDataError:
            print(f"   -> Warning: File is empty, skipping: {filename}")
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
            f.write("export const STORIES = ")
            f.write(json.dumps(all_stories, indent=2))
            f.write(";\n")
        print(f"✅ Wrote {len(all_stories)} stories to {output_file}")
        
    if all_scenarios:
        output_file = os.path.join(OUTPUT_DIR, 'scenarios.ts')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("// Auto-generated by scripts/ingest_content.py\n")
            f.write("import { Scenario } from '../types';\n\n")
            f.write("export const scenarios: Scenario[] = ")
            f.write(json.dumps(all_scenarios, indent=2))
            f.write(";\n")
        print(f"✅ Wrote {len(all_scenarios)} scenarios to {output_file}")
        
    print("✨ Content ingestion complete.")

if __name__ == "__main__":
    main()
