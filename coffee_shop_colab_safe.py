#!/usr/bin/env python3
"""
Coffee Shop Audio Generation - Colab Safe Version
No long lines that could break during copy/paste
"""

import requests
import os
import time

# Set from your Colab secrets
ELEVENLABS_API_KEY = "YOUR_API_KEY"

# 4-voice configuration from clinical analysis
VOICE_MAPPING = {
    "david": "pNInz6obpgDQGcFmaJgB",
    "marcus": "TxGEqnHWrfWFTfGW9XjX", 
    "sarah": "EXAVITQu4vr4xnSDxMaL",
    "emma": "ErXwobaYiN019PkySvjV"
}

# Coffee Shop scenarios - safe formatting with escaped quotes
scenarios = []
scenarios.append({"text": "What can I get for you?", "filename": "scenarios_coffee_basic_greeting.mp3"})
scenarios.append({"text": "That\\'ll be four dollars and fifty cents.", "filename": "scenarios_coffee_price_simple.mp3"})
scenarios.append({"text": "So that\\'s one large coffee for you.", "filename": "scenarios_coffee_confirmation_simple.mp3"})

# Longer texts split for safety
text4 = "What size would you like? We have small, medium, and large."
scenarios.append({"text": text4, "filename": "scenarios_coffee_size_options.mp3"})

text5 = "For milk, we have whole milk and oat milk available today."
scenarios.append({"text": text5, "filename": "scenarios_coffee_milk_options.mp3"})

scenarios.append({"text": "Would you like that for here or to go?", "filename": "scenarios_coffee_for_here_or_to_go.mp3"})

text7 = "Alright, so that\\'s a large iced coffee with oat milk and an extra shot."
scenarios.append({"text": text7, "filename": "scenarios_coffee_complex_order.mp3"})

text8 = "Your total comes to six dollars and forty-seven cents with tax."
scenarios.append({"text": text8, "filename": "scenarios_coffee_total_with_tax.mp3"})

text9 = "It\\'ll be about five minutes for that because we\\'re making a fresh batch right now."
scenarios.append({"text": text9, "filename": "scenarios_coffee_wait_time_explanation.mp3"})

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
    
    api_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    try:
        response = requests.post(api_url, json=data, headers=headers)
        
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
    for scenario in scenarios:
        print(f"\n📝 '{scenario['text'][:40]}...'")
        
        for voice_name, voice_id in VOICE_MAPPING.items():
            output_path = f"{voice_name}_audio/{scenario['filename']}"
            
            print(f"  🎤 {voice_name}: ", end="")
            success = generate_audio_file(scenario['text'], voice_id, output_path)
            
            if success:
                total_generated += 1
            
            time.sleep(1)
    
    print(f"\n🎉 Complete! Generated {total_generated} audio files")
    print(f"📁 Files saved to [voice]_audio/ directories")

# Main execution
if __name__ == "__main__":
    if ELEVENLABS_API_KEY == "YOUR_API_KEY":
        print("❌ Please set ELEVENLABS_API_KEY first")
    else:
        generate_coffee_shop_audio()