# ==============================================================================
# UPDATED STORY PROCESSING FOR YOUR COLAB SCRIPT
# ==============================================================================

# Add this to your existing Colab script's helper functions section:

def process_stories(creds):
    """Process story data from the dedicated Stories tab."""
    print("\n▶️ Processing stories from Stories tab...")
    
    # Get stories from the dedicated Stories tab
    df_stories = get_sheet_as_df(creds, 'Stories')
    
    if df_stories.empty:
        print("    - ❌ No Stories tab found or no data in Stories tab.")
        return [], []
    
    story_texts = []
    story_filenames = []
    
    # Process each row in the Stories tab
    for _, row in df_stories.iterrows():
        try:
            set_name = row['Set'] if 'Set' in row and pd.notna(row['Set']) else ""
            title = row['Title'] if 'Title' in row and pd.notna(row['Title']) else ""
            text = row['Text'] if 'Text' in row and pd.notna(row['Text']) else ""
            filename = row['Filename'] if 'Filename' in row and pd.notna(row['Filename']) else ""
            
            if text and filename:
                story_texts.append(text)
                story_filenames.append(filename)
                print(f"    - Found story: {title} ({set_name}) -> {filename}")
                
        except Exception as e:
            print(f"    - ⚠️ Error processing story row: {e}")
            continue
    
    print(f"✅ Found {len(story_texts)} stories to generate.")
    return story_texts, story_filenames

# ==============================================================================
# UPDATED MAIN EXECUTION SECTION
# ==============================================================================

# Replace your existing main execution section with this updated version:

if __name__ == "__main__":
    try:
        check_github_rate_limit()
        google_creds = authenticate_google()

        print("\n▶️ Loading data from Google Sheet tabs...")
        all_text_to_generate = set()
        
        # Process existing tabs (Words, Sentences, Keywords)
        if GENERATE_WORDS:
            df_words = get_sheet_as_df(google_creds, 'Words')
            if not df_words.empty:
                all_text_to_generate.update(df_words['Word1'].dropna())
                all_text_to_generate.update(df_words['Word2'].dropna())
                
        if GENERATE_SENTENCES:
            df_sentences = get_sheet_as_df(google_creds, 'Sentences')
            if not df_sentences.empty:
                all_text_to_generate.update(df_sentences['Sentence1'].dropna())
                all_text_to_generate.update(df_sentences['Sentence2'].dropna())
                
        if GENERATE_KEYWORDS:
            df_keywords = get_sheet_as_df(google_creds, 'Keywords')
            if not df_keywords.empty:
                all_text_to_generate.update(df_keywords['Sentence'].dropna())
                all_text_to_generate.update(df_keywords['Keyword1'].dropna())
                all_text_to_generate.update(df_keywords['Keyword2'].dropna())
        
        # 🆕 Process Stories from dedicated Stories tab
        story_texts = []
        story_filenames = []
        if GENERATE_STORIES:
            story_texts, story_filenames = process_stories(google_creds)
        
        unique_text_items = sorted(list(all_text_to_generate))
        total_items = len(unique_text_items) + len(story_texts)
        print(f"✅ Found {len(unique_text_items)} unique text items + {len(story_texts)} stories = {total_items} total items to process.")

        failed_logs = {}
        
        if GENERATE_FEMALE_VOICE:
            existing_female_files = get_existing_github_files("female_audio")
            
            # Generate regular items (words, sentences, keywords)
            if unique_text_items:
                print(f"\n▶️ Generating {len(unique_text_items)} regular items for FEMALE voice...")
                failed_logs['female'] = generate_audio_for_voice(unique_text_items, FEMALE_VOICE_ID, "female", existing_female_files)
            else:
                failed_logs['female'] = []
            
            # Generate stories with custom filenames
            if story_texts:
                print(f"\n▶️ Generating {len(story_texts)} stories for FEMALE voice...")
                story_failures = generate_audio_for_voice(story_texts, FEMALE_VOICE_ID, "female", existing_female_files, story_filenames)
                failed_logs['female'].extend(story_failures)
            
            upload_folder_to_github("female_audio")

        if GENERATE_MALE_VOICE:
            existing_male_files = get_existing_github_files("male_audio")
            
            # Generate regular items (words, sentences, keywords)
            if unique_text_items:
                print(f"\n▶️ Generating {len(unique_text_items)} regular items for MALE voice...")
                failed_logs['male'] = generate_audio_for_voice(unique_text_items, MALE_VOICE_ID, "male", existing_male_files)
            else:
                failed_logs['male'] = []
            
            # Generate stories with custom filenames
            if story_texts:
                print(f"\n▶️ Generating {len(story_texts)} stories for MALE voice...")
                story_failures = generate_audio_for_voice(story_texts, MALE_VOICE_ID, "male", existing_male_files, story_filenames)
                failed_logs['male'].extend(story_failures)
            
            upload_folder_to_github("male_audio")
        
        print("\n🚀 Automation Complete!")
        if any(failed_logs.values()):
            print("\n⚠️ NOTE: Some items failed to generate.")
            for voice, failures in failed_logs.items():
                if failures: print(f"  - {voice.capitalize()} voice failures: {len(failures)} items")

    except Exception as e:
        print(f"\n❌ A critical error occurred in the main execution: {e}")