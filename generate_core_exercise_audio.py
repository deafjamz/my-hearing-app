#!/usr/bin/env python3
"""
Generate core exercise audio files that the app is currently trying to load
Based on the actual sentences and stories used in the hearing rehabilitation app
"""

import os
import time
import json
from pathlib import Path

# You'll need to install these: pip install elevenlabs
try:
    from elevenlabs import generate, save, set_api_key, Voice, VoiceSettings
except ImportError:
    print("❌ ElevenLabs not installed. Run: pip install elevenlabs")
    exit(1)

# Configure ElevenLabs API
ELEVENLABS_API_KEY = "your_api_key_here"  # Replace with your actual API key
set_api_key(ELEVENLABS_API_KEY)

# Voice configurations from your app
VOICES = {
    'david': 'pNInz6obpgDQGcFmaJgB',        # Male, clear
    'marcus': 'TxGEqnHWrfWFTfGW9XjX',      # Male, deep  
    'sarah': 'EXAVITQu4vr4xnSDxMaL',       # Female, warm
    'emma': 'ThT5KcBeYPX3keUQqHPh'        # Female, clear
}

# Sample sentences that your app uses (from Google Sheets data)
CORE_SENTENCES = [
    "He will show the goat",
    "The beautiful painting hung on the wall",
    "She walked quickly down the street",
    "The children played in the park",
    "Coffee tastes better in the morning",
    "Rain started falling on the roof",
    "Birds sing loudly in the trees",
    "The book was left on the table",
    "Cars drove slowly through the fog",
    "Music played softly in the background",
    "The cat slept peacefully by the window",
    "Fresh bread smells wonderful",
    "Flowers bloom brightly in spring",
    "The phone rang three times",
    "People waited patiently for the bus"
]

# Story audio files from your app
STORY_AUDIO_FILES = [
    "story_fork_spoon",
    "story_lost_keys", 
    "story_birthday_party",
    "story_grocery_store",
    "story_phone_call"
]

def slugify(text):
    """Convert text to filename-safe format (matches your app's slugify function)"""
    return text.lower().replace(' ', '-').replace('.', '').replace(',', '').replace('!', '').replace('?', '')

def generate_audio_file(text, voice_id, filename):
    """Generate audio file using ElevenLabs API with CI-optimized settings"""
    try:
        print(f"Generating {filename}...")
        
        # Generate audio with settings optimized for CI users
        audio = generate(
            text=text,
            voice=Voice(
                voice_id=voice_id,
                settings=VoiceSettings(
                    stability=0.6,        # Good for consistency
                    similarity_boost=0.8, # High similarity for recognition
                    style=0.2,           # Low style for clear speech
                    use_speaker_boost=True
                )
            ),
            model="eleven_multilingual_v2"
        )
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        # Save to file
        save(audio, filename)
        print(f"✅ Generated: {filename}")
        
        # Add delay to respect rate limits
        time.sleep(1)
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating {filename}: {e}")
        return False

def main():
    """Generate core exercise audio files"""
    print("🎤 CORE EXERCISE AUDIO GENERATION")
    print("=" * 60)
    
    if ELEVENLABS_API_KEY == "your_api_key_here":
        print("❌ Please set your ElevenLabs API key in the script")
        return
    
    generated_files = []
    failed_files = []
    
    # Create voice directories
    for voice_name in VOICES.keys():
        os.makedirs(f"{voice_name}_audio", exist_ok=True)
    
    print(f"\n📝 Generating {len(CORE_SENTENCES)} sentences for {len(VOICES)} voices...")
    
    # Generate sentence audio files
    for sentence in CORE_SENTENCES:
        filename_base = slugify(sentence) + '.mp3'
        
        for voice_name, voice_id in VOICES.items():
            filename = f"{voice_name}_audio/{filename_base}"
            
            if generate_audio_file(sentence, voice_id, filename):
                generated_files.append(filename)
            else:
                failed_files.append(filename)
    
    print(f"\n📖 Generating {len(STORY_AUDIO_FILES)} story files for {len(VOICES)} voices...")
    
    # Generate story audio files (placeholders with generic story text)
    story_text = "This is a practice story for hearing rehabilitation. Listen carefully and answer the questions that follow."
    
    for story_file in STORY_AUDIO_FILES:
        for voice_name, voice_id in VOICES.items():
            filename = f"{voice_name}_audio/{story_file}.mp3"
            
            if generate_audio_file(story_text, voice_id, filename):
                generated_files.append(filename)
            else:
                failed_files.append(filename)
    
    # Generate summary
    print(f"\n📊 GENERATION COMPLETE")
    print("=" * 60)
    print(f"✅ Successfully generated: {len(generated_files)} files")
    print(f"❌ Failed to generate: {len(failed_files)} files")
    
    if failed_files:
        print(f"\n❌ Failed files:")
        for file in failed_files:
            print(f"   - {file}")
    
    print(f"\n📁 Audio directories created:")
    for voice_name in VOICES.keys():
        file_count = len([f for f in generated_files if f.startswith(f"{voice_name}_audio/")])
        print(f"   - {voice_name}_audio/: {file_count} files")
    
    # Save generation log
    with open('core_audio_generation_log.json', 'w') as f:
        json.dump({
            'generated_files': generated_files,
            'failed_files': failed_files,
            'voice_count': len(VOICES),
            'sentence_count': len(CORE_SENTENCES),
            'story_count': len(STORY_AUDIO_FILES)
        }, f, indent=2)
    
    print(f"\n🎯 NEXT STEPS:")
    print("1. Set up the hearing-rehab-audio GitHub repository")
    print("2. Upload these audio files using Git LFS")
    print("3. Test the app with real audio files")
    print("\n🔬 Generated audio optimized for cochlear implant users!")

if __name__ == "__main__":
    main()