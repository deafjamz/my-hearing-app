#!/usr/bin/env python3
"""
Coffee Shop Audio Generation for 4-Voice System
Simple version - adapt for your Colab environment
"""

import requests
import os
import csv
import time

# You'll need to set these from your secrets
ELEVENLABS_API_KEY = "YOUR_API_KEY"  # Set this from your Colab secrets

# New 4-voice configuration from clinical analysis
VOICE_MAPPING = {
    "david": "pNInz6obpgDQGcFmaJgB",   # Adam - 118.4 Hz - Warm & Friendly
    "marcus": "TxGEqnHWrfWFTfGW9XjX", # Josh - 144.4 Hz - Deep & Confident  
    "sarah": "EXAVITQu4vr4xnSDxMaL",  # Bella - 171.6 Hz - Clear & Articulate
    "emma": "ErXwobaYiN019PkySvjV"    # Antoni - 186.9 Hz - Bright & Energetic
}

# Coffee Shop scenario texts (from CSV)
COFFEE_SHOP_SCENARIOS = [
    {"text": "What can I get for you?", "filename": "scenarios_coffee_basic_greeting.mp3"},
    {"text": "That'll be four dollars and fifty cents.", "filename": "scenarios_coffee_price_simple.mp3"}, 
    {"text": "So that's one large coffee for you.", "filename": "scenarios_coffee_confirmation_simple.mp3"},
    {"text": "What size would you like? We have small, medium, and large.", "filename": "scenarios_coffee_size_options.mp3"},
    {"text": "For milk, we have whole milk and oat milk available today.", "filename": "scenarios_coffee_milk_options.mp3"},
    {"text": "Would you like that for here or to go?", "filename": "scenarios_coffee_for_here_or_to_go.mp3"},
    {"text": "Alright, so that's a large iced coffee with oat milk and an extra shot.", "filename": "scenarios_coffee_complex_order.mp3"},
    {"text": "Your total comes to six dollars and forty-seven cents with tax.", "filename": "scenarios_coffee_total_with_tax.mp3"},
    {"text": "It'll be about five minutes for that because we're making a fresh batch right now.", "filename": "scenarios_coffee_wait_time_explanation.mp3"}
]

def generate_audio_file(text, voice_id, output_path):
    """Generate single audio file"""
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json", 
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    try:
        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            json=data,
            headers=headers
        )
        
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"✅ Generated: {output_path}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def generate_coffee_shop_audio():
    """Generate all Coffee Shop audio with 4 voices"""
    
    print("☕ GENERATING COFFEE SHOP AUDIO")
    print("=" * 50)
    
    # Create directories
    for voice_name in VOICE_MAPPING.keys():
        dir_path = f"{voice_name}_audio" 
        os.makedirs(dir_path, exist_ok=True)
    
    total_generated = 0
    
    # Generate each scenario with all 4 voices
    for scenario in COFFEE_SHOP_SCENARIOS:
        print(f"\n📝 '{scenario['text'][:40]}...'")
        
        for voice_name, voice_id in VOICE_MAPPING.items():
            output_path = f"{voice_name}_audio/{scenario['filename']}"
            
            print(f"  🎤 {voice_name}: ", end="")
            success = generate_audio_file(scenario['text'], voice_id, output_path)
            
            if success:
                total_generated += 1
            
            time.sleep(1)  # Rate limiting
    
    print(f"\n🎉 Complete! Generated {total_generated} audio files")
    print(f"📁 Files saved to [voice]_audio/ directories")

if __name__ == "__main__":
    # Set your API key first!
    if ELEVENLABS_API_KEY == "YOUR_API_KEY":
        print("❌ Please set ELEVENLABS_API_KEY first")
    else:
        generate_coffee_shop_audio()