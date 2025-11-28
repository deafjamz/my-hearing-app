import pandas as pd
import os
import json
import glob
import re # <-- ADD THIS LINE

# --- CONFIG ---
INPUT_DIR = 'Hearing Rehab Project - CSVs'
OUTPUT_DIR = 'src/data'

# --- HELPER FUNCTIONS ---
def clean_text(text):
    if pd.isna(text):
        return ""
    return str(text).strip()

# --- 1. PROCESS WORD PAIRS ---
def process_word_pairs():
    print("Processing Word Pairs...")
    csv_path = os.path.join(INPUT_DIR, 'Hearing Rehab Project - Words.csv')

    if not os.path.exists(csv_path):
        print("⚠️  Missing Words CSV. Skipping.")
        return

    df = pd.read_csv(csv_path)
    word_pairs = []
    
    # Iterate through each row and create the word pair object
    for index, row in df.iterrows():
        # Ensure all necessary fields are present and cleaned
        pair_id = int(row.get('id'))
        correct_word = clean_text(row.get('correct'))
        option1 = clean_text(row.get('options').split('...')[1].split('...')[0]) if pd.notna(row.get('options')) and '...' in row.get('options') else ""
        option2 = clean_text(row.get('options').split('...')[2].split('...')[0]) if pd.notna(row.get('options')) and len(row.get('options').split('...')) > 2 else ""
        
        # Handle cases where options might be missing or malformed
        options_list = []
        if option1: options_list.append(f"...{option1}...")
        if option2: options_list.append(f"...{option2}...")
        
        # Ensure correct word is always present in options
        if correct_word and correct_word not in options_list:
            options_list.insert(0, correct_word) # Add correct word to the beginning

        # Remove duplicates and shuffle options
        unique_options = list(dict.fromkeys(options_list))
        
        # Ensure we have exactly two options if possible, otherwise use what we have
        if len(unique_options) < 2:
            # If only one unique option, duplicate it to meet the expected format,
            # or handle as an edge case if necessary. For now, we'll just use what we have.
            pass 
        
        # Shuffle the options for variety
        import random
        random.shuffle(unique_options)

        word_pairs.append({
            "id": pair_id,
            "correct": correct_word,
            "options": unique_options,
            "file": clean_text(row.get('file')),
            "category": clean_text(row.get('category'))
        })
        
    ts_content = f"export const WORD_PAIRS = {json.dumps(word_pairs, indent=2)};"
    with open(os.path.join(OUTPUT_DIR, 'wordPairs.ts'), 'w') as f:
        f.write(f"// Generated from Hearing Rehab Project - Words.csv\n{ts_content}")
    print(f"✅ Generated src/data/wordPairs.ts ({len(word_pairs)} pairs)")

# --- 2. PROCESS STORIES ---
def process_stories():
    print("Processing Stories...")
    csv_path = os.path.join(INPUT_DIR, 'Hearing Rehab Project - Stories.csv')

    if not os.path.exists(csv_path):
        print("⚠️  Missing Stories CSV. Skipping.")
        return

    df = pd.read_csv(csv_path)
    stories = []
    
    for index, row in df.iterrows():
        stories.append({
            "id": clean_text(row.get('id')),
            "title": clean_text(row.get('title')),
            "text": clean_text(row.get('text')),
            "audioId": clean_text(row.get('audioId'))
        })
        
    ts_content = f"export const STORIES = {json.dumps(stories, indent=2)};"
    with open(os.path.join(OUTPUT_DIR, 'stories.ts'), 'w') as f:
        f.write(f"// Generated from Hearing Rehab Project - Stories.csv\n{ts_content}")
    print(f"✅ Generated src/data/stories.ts ({len(stories)} stories)")

# --- 3. PROCESS SCENARIOS ---
def process_scenarios():
    print("Processing Scenarios...")
    csv_path = os.path.join(INPUT_DIR, 'Hearing Rehab Project - Scenarios.csv')

    if not os.path.exists(csv_path):
        print("⚠️  Missing Scenarios CSV. Skipping.")
        return

    df = pd.read_csv(csv_path)
    all_scenarios = {}
    
    # === FIX: Grouping by Filename Pattern ===
    # We deduce the scenario from the filename, e.g., 'scenarios_coffee_...mp3' -> 'coffee_shop'
    def extract_scenario_group(filename):
        if pd.isna(filename): return "unknown"
        
        # Regex to find the scenario keyword (coffee, bank, etc.) from the filename string
        match = re.search(r'scenarios_([a-zA-Z]+)_', str(filename))
        if not match:
            return "unknown"
            
        keyword = match.group(1)
        # Map keywords to consistent IDs
        if keyword == "coffee": return "coffee_shop"
        if keyword == "bank": return "bank"
        if keyword == "doctor": return "doctor_office"
        if keyword == "restaurant": return "restaurant"
        if keyword == "pharmacy": return "pharmacy"
        
        return "unknown"

    df['scenario_group_id'] = df['Filename'].apply(extract_scenario_group)
    
    # Now group by the newly created and validated column
    for scenario_id, group in df.groupby('scenario_group_id'):
        if scenario_id == 'unknown':
            continue

        steps = []
        # Sort by Filename to ensure the conversation flows in a logical order
        for _, row in group.sort_values(by='Filename').iterrows():
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
        f.write(f"// Generated from Scenarios CSVs\n{ts_content}")
    print(f"✅ Generated src/data/scenarios.ts ({len(all_scenarios)} scenarios)")

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    # Create output directory if it doesn't exist
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    process_word_pairs()
    process_stories()
    process_scenarios()
    print("\nContent ingestion complete!")
