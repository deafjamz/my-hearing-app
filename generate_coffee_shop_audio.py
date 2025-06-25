#!/usr/bin/env python3
"""
Generate Coffee Shop Scenario Audio Files with 4-Voice System
Uses clinical-optimized voices: David, Marcus, Sarah, Emma
"""

import requests
import json
import os
import csv
from typing import Dict, List
import time

# ElevenLabs Configuration (you'll need to set your API key)
ELEVENLABS_API_KEY = "YOUR_API_KEY_HERE"  # Replace with your actual key
ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech"

# Clinical Voice Mapping (from voice analysis session)
VOICE_CONFIG = {
    "david": {
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam - 118.4 Hz
        "name": "David",
        "description": "Warm & Friendly",
        "f0": 118.4,
        "gender": "male"
    },
    "marcus": {
        "voice_id": "TxGEqnHWrfWFTfGW9XjX",  # Josh - 144.4 Hz  
        "name": "Marcus",
        "description": "Deep & Confident", 
        "f0": 144.4,
        "gender": "male"
    },
    "sarah": {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",  # Bella - 171.6 Hz
        "name": "Sarah", 
        "description": "Clear & Articulate",
        "f0": 171.6,
        "gender": "female"
    },
    "emma": {
        "voice_id": "ErXwobaYiN019PkySvjV",  # Antoni - 186.9 Hz
        "name": "Emma",
        "description": "Bright & Energetic", 
        "f0": 186.9,
        "gender": "female"
    }
}

# Audio generation settings (CI-optimized)
AUDIO_SETTINGS = {
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.0,
        "use_speaker_boost": True
    }
}

def load_coffee_shop_data() -> List[Dict]:
    """Load Coffee Shop scenario data from CSV"""
    scenarios = []
    
    with open('coffee_shop_scenarios.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            scenarios.append({
                'text': row['Text'].strip('"'),
                'filename': row['Filename'],
                'level': int(row['Level']),
                'interaction_id': row['Interaction_ID'],
                'clinical_focus': row['Clinical_Focus'],
                'speaker': row['Speaker'],
                'duration_seconds': int(row['Duration_Seconds'])
            })
    
    return scenarios

def generate_audio_file(text: str, voice_id: str, output_path: str) -> bool:
    """Generate audio file using ElevenLabs API"""
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    data = {
        "text": text,
        "model_id": AUDIO_SETTINGS["model_id"],
        "voice_settings": AUDIO_SETTINGS["voice_settings"]
    }
    
    try:
        print(f"🎧 Generating: {text[:50]}...")
        
        response = requests.post(
            f"{ELEVENLABS_URL}/{voice_id}",
            json=data,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"✅ Saved: {output_path}")
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def assign_voice_to_scenario(scenario: Dict) -> str:
    """Assign voice based on speaker and clinical considerations"""
    
    speaker = scenario['speaker']
    level = scenario['level']
    clinical_focus = scenario['clinical_focus']
    
    # Speaker-based assignment with clinical optimization
    if 'male' in speaker:
        # Alternate between David and Marcus for male voices
        if scenario['interaction_id'].endswith('1') or scenario['interaction_id'].endswith('3'):
            return 'david'  # Warm & Friendly for greetings and explanations
        else:
            return 'marcus'  # Deep & Confident for prices and confirmations
            
    elif 'female' in speaker:
        # Alternate between Sarah and Emma for female voices  
        if scenario['interaction_id'].endswith('1') or scenario['interaction_id'].endswith('3'):
            return 'sarah'  # Clear & Articulate for complex orders
        else:
            return 'emma'   # Bright & Energetic for options and questions
    
    # Default fallback (should not occur)
    return 'david'

def create_output_directories():
    """Create output directories for all 4 voices"""
    base_paths = [
        '../hearing-rehab-audio/david_audio',
        '../hearing-rehab-audio/marcus_audio', 
        '../hearing-rehab-audio/sarah_audio',
        '../hearing-rehab-audio/emma_audio'
    ]
    
    for path in base_paths:
        os.makedirs(path, exist_ok=True)
        print(f"📁 Created directory: {path}")

def generate_all_coffee_shop_audio():
    """Generate all Coffee Shop scenario audio files with 4-voice system"""
    
    print("☕ COFFEE SHOP SCENARIO AUDIO GENERATION")
    print("=" * 60)
    print("🎯 Clinical Voice System: David, Marcus, Sarah, Emma")
    print("🔬 F0 Ranges: 118.4Hz, 144.4Hz, 171.6Hz, 186.9Hz")
    print("=" * 60)
    
    # Create directories
    create_output_directories()
    
    # Load scenario data
    scenarios = load_coffee_shop_data()
    print(f"📋 Loaded {len(scenarios)} Coffee Shop interactions")
    
    # Track generation statistics
    total_files = 0
    successful_files = 0
    failed_files = []
    
    # Generate audio for each scenario with all 4 voices
    for scenario in scenarios:
        print(f"\n🎬 Processing: {scenario['interaction_id']} (Level {scenario['level']})")
        print(f"📝 Text: {scenario['text']}")
        print(f"🎯 Clinical Focus: {scenario['clinical_focus']}")
        
        # Assign primary voice for this scenario
        assigned_voice = assign_voice_to_scenario(scenario)
        print(f"🎤 Assigned Voice: {VOICE_CONFIG[assigned_voice]['name']} ({VOICE_CONFIG[assigned_voice]['description']})")
        
        # Generate with all 4 voices for maximum flexibility
        for voice_name, voice_config in VOICE_CONFIG.items():
            
            # Create filename for this voice
            base_filename = scenario['filename'].replace('.mp3', '')
            output_filename = f"{base_filename}.mp3"
            output_path = f"../hearing-rehab-audio/{voice_name}_audio/{output_filename}"
            
            print(f"  🎙️  {voice_config['name']}: ", end="")
            
            # Generate audio file
            success = generate_audio_file(
                scenario['text'], 
                voice_config['voice_id'], 
                output_path
            )
            
            total_files += 1
            if success:
                successful_files += 1
                print(f"✅")
            else:
                failed_files.append({
                    'scenario': scenario['interaction_id'],
                    'voice': voice_name,
                    'path': output_path
                })
                print(f"❌")
            
            # Rate limiting
            time.sleep(0.5)
    
    # Summary report
    print("\n" + "=" * 60)
    print("📊 GENERATION SUMMARY")
    print("=" * 60)
    print(f"Total files attempted: {total_files}")
    print(f"Successful generations: {successful_files}")
    print(f"Failed generations: {len(failed_files)}")
    print(f"Success rate: {(successful_files/total_files)*100:.1f}%")
    
    if failed_files:
        print(f"\n❌ Failed Files:")
        for failed in failed_files:
            print(f"   {failed['scenario']} - {failed['voice']}")
    
    print(f"\n🎉 Coffee Shop audio generation complete!")
    print(f"📁 Files saved to ../hearing-rehab-audio/[voice]_audio/scenarios_*.mp3")
    
    # Clinical impact summary
    print(f"\n🔬 CLINICAL IMPACT:")
    print(f"• 4 voices with optimal F0 gaps for CI users")
    print(f"• Progressive training: 26Hz (male) + 15.3Hz (female) gaps")
    print(f"• 9 functional scenarios × 4 voices = 36 total audio files")
    print(f"• Enables systematic voice discrimination training")

if __name__ == "__main__":
    generate_all_coffee_shop_audio()