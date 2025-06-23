# ==============================================================================
# TEST VERSION: SINGLE STORY GENERATION
# ==============================================================================

# Add this modified process_stories function to your Colab script for testing:

def process_stories_test(creds):
    """Process ONLY the first story from the Stories tab for testing."""
    print("\n▶️ Processing SINGLE STORY for testing from Stories tab...")
    
    # Get stories from the dedicated Stories tab
    df_stories = get_sheet_as_df(creds, 'Stories')
    
    if df_stories.empty:
        print("    - ❌ No Stories tab found or no data in Stories tab.")
        return [], []
    
    story_texts = []
    story_filenames = []
    
    # Process ONLY the first row for testing
    if len(df_stories) > 0:
        row = df_stories.iloc[0]  # Get first row only
        try:
            set_name = row['Set'] if 'Set' in row and pd.notna(row['Set']) else ""
            title = row['Title'] if 'Title' in row and pd.notna(row['Title']) else ""
            text = row['Text'] if 'Text' in row and pd.notna(row['Text']) else ""
            filename = row['Filename'] if 'Filename' in row and pd.notna(row['Filename']) else ""
            
            if text and filename:
                story_texts.append(text)
                story_filenames.append(filename)
                print(f"    - 🧪 TEST: Found story: {title} ({set_name}) -> {filename}")
                print(f"    - 📝 Text preview: {text[:100]}...")
                
        except Exception as e:
            print(f"    - ⚠️ Error processing test story row: {e}")
    
    print(f"✅ Found {len(story_texts)} story for testing.")
    return story_texts, story_filenames

# ==============================================================================
# TEST CONFIGURATION - Add these settings to your script
# ==============================================================================

# Override your generation controls for testing:
GENERATE_WORDS = False          # 🚫 Skip words for test
GENERATE_SENTENCES = False      # 🚫 Skip sentences for test  
GENERATE_KEYWORDS = False       # 🚫 Skip keywords for test
GENERATE_STORIES = True         # ✅ Only stories

GENERATE_FEMALE_VOICE = True    # ✅ Only female for test
GENERATE_MALE_VOICE = False     # 🚫 Skip male for test

# ==============================================================================
# TEST MAIN EXECUTION SECTION
# ==============================================================================

if __name__ == "__main__":
    try:
        check_github_rate_limit()
        google_creds = authenticate_google()

        print("\n🧪 TEST MODE: Single Story Generation")
        print("="*50)
        
        # Skip regular activities for test
        print("\n▶️ Skipping Words, Sentences, Keywords for test...")
        unique_text_items = []  # Empty for test
        
        # Process ONLY first story for testing
        story_texts = []
        story_filenames = []
        if GENERATE_STORIES:
            story_texts, story_filenames = process_stories_test(google_creds)  # Use test function
        
        total_items = len(story_texts)
        print(f"✅ TEST: Processing {total_items} story (female voice only).")

        failed_logs = {}
        
        if GENERATE_FEMALE_VOICE and story_texts:
            existing_female_files = get_existing_github_files("female_audio")
            
            print(f"\n🧪 TEST: Generating 1 story for FEMALE voice...")
            print(f"    - Story text length: {len(story_texts[0])} characters")
            print(f"    - Expected filename: {story_filenames[0]}")
            
            # Generate the test story
            story_failures = generate_audio_for_voice(story_texts, FEMALE_VOICE_ID, "female", existing_female_files, story_filenames)
            failed_logs['female'] = story_failures
            
            upload_folder_to_github("female_audio")

        print("\n🧪 TEST COMPLETE!")
        if failed_logs.get('female'):
            print(f"❌ Test failed: {failed_logs['female']}")
        else:
            print("✅ Test story generated successfully!")
            print("\n📋 Next steps:")
            print("1. Check your GitHub repo for the new audio file")
            print("2. Test the story in your hearing app")
            print("3. If satisfied, run full generation for all 10 stories")

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")

# ==============================================================================
# SIMPLE TEST DATA (if you want to test without Google Sheets)
# ==============================================================================

def test_with_hardcoded_story():
    """Alternative test function using hardcoded story data."""
    print("\n🧪 HARDCODED TEST: Generating Barnaby story...")
    
    test_texts = ["Barnaby was a teacup who was afraid of tea. He saw the big, steaming pot and shivered, his porcelain chattering. One day, a little girl with warm hands chose him. 'You're my favorite,' she whispered. She filled him not with tea, but with cool milk and a single strawberry. Barnaby decided he wasn't afraid anymore."]
    test_filenames = ["story_timid_teacup.mp3"]
    
    try:
        existing_female_files = get_existing_github_files("female_audio")
        failed = generate_audio_for_voice(test_texts, FEMALE_VOICE_ID, "female", existing_female_files, test_filenames)
        upload_folder_to_github("female_audio")
        
        if not failed:
            print("✅ Hardcoded test successful!")
        else:
            print(f"❌ Hardcoded test failed: {failed}")
            
    except Exception as e:
        print(f"❌ Hardcoded test error: {e}")

# To use hardcoded test, call: test_with_hardcoded_story()