#!/usr/bin/env python3
"""
Generate the missing audio files that the hearing rehabilitation app actually needs
Based on the sampleStories and sentence data from the app
"""

import os
import time
import json
from pathlib import Path

# You'll need: pip install elevenlabs requests
try:
    from elevenlabs import generate, save, set_api_key, Voice, VoiceSettings
    import requests
except ImportError:
    print("❌ Missing dependencies. Run: pip install elevenlabs requests")
    exit(1)

# Configure ElevenLabs API
ELEVENLABS_API_KEY = "your_api_key_here"  # Replace with your actual API key
set_api_key(ELEVENLABS_API_KEY)

# Voice configurations
VOICES = {
    'david': 'pNInz6obpgDQGcFmaJgB',        # Male, clear
    'marcus': 'TxGEqnHWrfWFTfGW9XjX',      # Male, deep  
    'sarah': 'EXAVITQu4vr4xnSDxMaL',       # Female, warm
    'emma': 'ThT5KcBeYPX3keUQqHPh'        # Female, clear
}

# Story audio files the app expects (from your sampleStories)
STORY_TEXTS = {
    "story_timid_teacup": "In a bustling kitchen cabinet, there lived a timid little teacup named Pip. While all the other dishes clinked and clanked confidently, Pip trembled at the thought of being used. One morning, Pip was chosen for an important guest, but instead of fear, Pip felt proud to serve the perfect cup of tea.",
    
    "story_compass_north": "Charlie the compass had always pointed north with unwavering certainty. But one day, his needle began spinning wildly, unable to find direction. Panicked, Charlie felt lost until he realized that sometimes being uncertain opens up new paths to explore. He learned that not all who wander are truly lost.",
    
    "story_left_sock": "In the washing machine's spin cycle, Left Sock realized his partner was missing again. This time, instead of waiting hopefully in the drawer, Left Sock decided to go on an adventure. He discovered that being unique wasn't something to hide from, but something to celebrate with pride.",
    
    "story_grumpy_cloud": "Nimbus was the grumpiest cloud in the sky, always raining on everyone's picnics and parades. The other clouds avoided him, thinking he was mean. But when the town faced a terrible drought, Nimbus realized his gift for making rain could help everyone. Sometimes what makes us different makes us special.",
    
    "story_streetlight_stars": "Every night, Stanley the streetlight looked up at the twinkling stars with envy. He felt dim and ordinary compared to their celestial beauty. But when a lost child needed his warm glow to find the way home, Stanley discovered that being helpful was just as magical as being distant and bright.",
    
    "story_eraser_forget": "Rosie the eraser had an unusual problem - she couldn't forget anything she had erased. While other erasers moved on quickly, Rosie carried every mistake and correction in her memory. She learned that remembering mistakes isn't a burden, but a way to help others learn and grow.",
    
    "story_autumn_leaf": "As autumn arrived, Maple was the last leaf clinging to her tree branch. All her friends had already fallen, dancing gracefully to the ground. Maple was afraid to let go, but when she finally released her grip, she discovered that falling was really flying in disguise.",
    
    "story_fork_spoon": "Frederick the fork was tired of stabbing and poking food all day. He watched Sophia the spoon gracefully scooping and stirring, wishing he could be gentle like her. But during a fancy dinner party, Frederick realized that his unique prongs made him perfect for twirling pasta - something no spoon could do.",
    
    "story_clock_backwards": "Tick-Tock the clock discovered one morning that he was running backwards, moving through yesterday instead of tomorrow. At first, he panicked, but then he realized he could help people remember happy moments they had forgotten. Sometimes looking back helps us appreciate where we are now.",
    
    "story_dust_everything": "Dusty was just a tiny mote of dust floating through a sunbeam, but she had an extraordinary gift - she could see the connections between all things. From her microscopic perspective, she watched love grow, friendships form, and dreams take shape. She learned that even the smallest things can witness the biggest moments."
}

# Sample sentences (these would normally come from Google Sheets)
SAMPLE_SENTENCES = [
    "He will show the goat",
    "The beautiful painting hung on the wall", 
    "She walked quickly down the street",
    "The children played in the park",
    "Coffee tastes better in the morning"
]

def slugify(text):
    """Convert text to filename-safe format (matches app's slugify function)"""
    return text.lower().replace(' ', '-').replace('.', '').replace(',', '').replace('!', '').replace('?', '').replace("'", '')

def load_google_sheets_sentences():
    """Try to load actual sentences from Google Sheets"""
    try:
        url = 'https://docs.google.com/spreadsheets/d/1CNDRfgqSdMEyc0JgW6DerCRX1jUftWSX49nsiBPUbek/gviz/tq?tqx=out:csv&sheet=Sentences'
        response = requests.get(url)
        if response.status_code == 200:
            lines = response.text.strip().split('\n')
            sentences = []
            for line in lines[1:]:  # Skip header
                if line.strip():
                    # Extract text from CSV (assuming first column is the sentence)
                    sentence = line.split(',')[0].strip('"')
                    if sentence and len(sentence) > 5:  # Valid sentence
                        sentences.append(sentence)
            return sentences[:20]  # First 20 sentences
    except Exception as e:
        print(f"⚠️ Could not load Google Sheets data: {e}")
    
    return SAMPLE_SENTENCES

def generate_audio_file(text, voice_id, filename):
    """Generate audio file using ElevenLabs API"""
    try:
        print(f"Generating {filename}...")
        
        # Generate audio with CI-optimized settings
        audio = generate(
            text=text,
            voice=Voice(
                voice_id=voice_id,
                settings=VoiceSettings(
                    stability=0.6,        # Good consistency
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
        
        # Rate limiting
        time.sleep(1)
        return True
        
    except Exception as e:
        print(f"❌ Error generating {filename}: {e}")
        return False

def main():
    """Generate the missing audio files"""
    print("🎤 MISSING AUDIO FILES GENERATION")
    print("=" * 60)
    
    if ELEVENLABS_API_KEY == "your_api_key_here":
        print("❌ Please set your ElevenLabs API key in the script")
        print("   Get your API key from: https://elevenlabs.io/")
        return
    
    generated_files = []
    failed_files = []
    
    # Create voice directories  
    for voice_name in VOICES.keys():
        os.makedirs(f"{voice_name}_audio", exist_ok=True)
    
    print(f"\n📖 Generating {len(STORY_TEXTS)} story files for {len(VOICES)} voices...")
    
    # Generate story audio files
    for story_id, story_text in STORY_TEXTS.items():
        for voice_name, voice_id in VOICES.items():
            filename = f"{voice_name}_audio/{story_id}.mp3"
            
            if generate_audio_file(story_text, voice_id, filename):
                generated_files.append(filename)
            else:
                failed_files.append(filename)
    
    print(f"\n📝 Loading sentences from Google Sheets...")
    sentences = load_google_sheets_sentences()
    print(f"Found {len(sentences)} sentences to generate")
    
    # Generate sentence audio files
    for sentence in sentences:
        filename_base = slugify(sentence) + '.mp3'
        
        for voice_name, voice_id in VOICES.items():
            filename = f"{voice_name}_audio/{filename_base}"
            
            if generate_audio_file(sentence, voice_id, filename):
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
        for file in failed_files[:5]:  # Show first 5
            print(f"   - {file}")
        if len(failed_files) > 5:
            print(f"   ... and {len(failed_files) - 5} more")
    
    print(f"\n📁 Audio directories:")
    for voice_name in VOICES.keys():
        file_count = len([f for f in generated_files if f.startswith(f"{voice_name}_audio/")])
        print(f"   - {voice_name}_audio/: {file_count} files")
    
    # Save generation log
    with open('missing_audio_generation_log.json', 'w') as f:
        json.dump({
            'generated_files': generated_files,
            'failed_files': failed_files,
            'story_count': len(STORY_TEXTS),
            'sentence_count': len(sentences),
            'voice_count': len(VOICES)
        }, f, indent=2)
    
    print(f"\n🚀 NEXT STEPS:")
    print("1. Check that audio files sound good")
    print("2. Upload to hearing-rehab-audio repository (use Git LFS for large files)")
    print("3. Test your app - it should now load audio properly!")
    print("\n🔬 Audio optimized for cochlear implant rehabilitation!")

if __name__ == "__main__":
    main()