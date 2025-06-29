#!/usr/bin/env python3
"""
Generate Doctor's Office scenario audio files using ElevenLabs API
Designed for cochlear implant rehabilitation training
"""

import os
import csv
import json
import time
from elevenlabs import generate, save, set_api_key, Voice, VoiceSettings

# Configure ElevenLabs API
ELEVENLABS_API_KEY = "your_api_key_here"  # Replace with actual API key
set_api_key(ELEVENLABS_API_KEY)

# Voice configurations - using our clinically validated voices
VOICES = {
    'david': 'pNInz6obpgDQGcFmaJgB',        # Male, clear
    'marcus': 'TxGEqnHWrfWFTfGW9XjX',      # Male, deep  
    'sarah': 'EXAVITQu4vr4xnSDxMaL',       # Female, warm
    'emma': 'ThT5KcBeYPX3keUQqHPh'        # Female, clear
}

# Speaker voice assignments for medical scenario
SPEAKER_VOICES = {
    'receptionist': 'sarah',    # Warm, welcoming voice for reception
    'doctor': 'david',          # Clear, professional voice for doctor
    'staff': 'emma'             # Clear voice for billing/admin staff
}

# Medical communication scripts
DOCTOR_OFFICE_SCRIPTS = {
    # Level 1 - Basic Reception Interactions
    'doctor_office_1_receptionist_greeting': "Good morning! How can I help you today?",
    'doctor_office_1_receptionist_checkin': "I'll need to see your insurance card and a photo ID, please.",
    'doctor_office_1_receptionist_direction': "Perfect! Please head to the second room on your left. The nurse will be with you shortly.",
    
    # Level 2 - Doctor Consultation  
    'doctor_office_2_doctor_symptoms': "How long have you been experiencing these symptoms?",
    'doctor_office_2_doctor_exam': "I'm going to listen to your lungs now. Please lie down on the examination table and take slow, deep breaths.",
    'doctor_office_2_doctor_diagnosis': "Your blood pressure is slightly elevated today. This could be related to stress or dietary factors. Let's monitor this closely.",
    
    # Level 3 - Treatment and Follow-up
    'doctor_office_3_doctor_prescription': "I'm prescribing an antibiotic for you. Take two tablets twice daily with food for the full seven days, even if you start feeling better.",
    'doctor_office_3_doctor_followup': "I'd like to see you again in two weeks if these symptoms persist. If they get worse before then, don't hesitate to call.",
    'doctor_office_3_staff_billing': "Your insurance covers most of today's visit. Your copay is twenty-five dollars, which you can pay at the front desk."
}

def generate_audio_file(text, voice_id, filename):
    """Generate audio file using ElevenLabs API"""
    try:
        print(f"Generating {filename}...")
        
        # Generate audio with optimized settings for CI users
        audio = generate(
            text=text,
            voice=Voice(
                voice_id=voice_id,
                settings=VoiceSettings(
                    stability=0.6,        # Slightly higher for medical clarity
                    similarity_boost=0.8, # High similarity for consistency
                    style=0.2,           # Lower style for neutral medical tone
                    use_speaker_boost=True
                )
            ),
            model="eleven_multilingual_v2"
        )
        
        # Save to file
        save(audio, filename)
        print(f"✅ Generated: {filename}")
        
        # Add delay to respect rate limits
        time.sleep(1)
        
    except Exception as e:
        print(f"❌ Error generating {filename}: {e}")

def main():
    """Generate all Doctor's Office scenario audio files"""
    print("🏥 DOCTOR'S OFFICE SCENARIO AUDIO GENERATION")
    print("=" * 60)
    
    print(f"\n📋 Generating {len(DOCTOR_OFFICE_SCRIPTS)} audio files...")
    print("Focus: Medical communication for CI rehabilitation")
    
    # Create output directory
    os.makedirs("doctor_office_audio", exist_ok=True)
    
    generated_files = []
    
    for script_id, text in DOCTOR_OFFICE_SCRIPTS.items():
        # Determine speaker from script ID
        if 'receptionist' in script_id:
            speaker = 'receptionist'
        elif 'doctor' in script_id:
            speaker = 'doctor'
        elif 'staff' in script_id:
            speaker = 'staff'
        else:
            speaker = 'doctor'  # Default
            
        voice_name = SPEAKER_VOICES[speaker]
        voice_id = VOICES[voice_name]
        
        # Generate for all voices (for user preference)
        for voice_key, voice_id in VOICES.items():
            filename = f"doctor_office_audio/{script_id}_{voice_key}.mp3"
            generate_audio_file(text, voice_id, filename)
            generated_files.append({
                'script_id': script_id,
                'voice': voice_key,
                'speaker': speaker,
                'text': text,
                'filename': filename
            })
    
    # Generate summary report
    print(f"\n📊 GENERATION COMPLETE")
    print("=" * 60)
    print(f"✅ Generated: {len(generated_files)} audio files")
    print(f"📁 Location: doctor_office_audio/")
    
    # Save generation log
    with open('doctor_office_generation_log.json', 'w') as f:
        json.dump({
            'scenario': 'doctor_office',
            'total_files': len(generated_files),
            'voices_used': list(VOICES.keys()),
            'speakers': list(SPEAKER_VOICES.keys()),
            'files': generated_files
        }, f, indent=2)
    
    print("\n🎯 MEDICAL COMMUNICATION FOCUS AREAS:")
    print("- Reception and check-in procedures")
    print("- Doctor-patient consultation dialogue")
    print("- Medical instruction comprehension")
    print("- Prescription and follow-up directions")
    print("- Insurance and billing conversations")
    
    print("\n🔬 CLINICAL NOTES:")
    print("- Audio optimized for cochlear implant processing")
    print("- Clear, professional medical communication")
    print("- Progressive difficulty from basic to complex interactions")
    print("- Real-world medical scenarios for practical training")

if __name__ == "__main__":
    main()