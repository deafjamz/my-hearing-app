#!/usr/bin/env python3
"""
Generate audio files for all functional listening scenarios
Doctor's Office, Restaurant, Pharmacy, and Bank scenarios
Optimized for cochlear implant rehabilitation training
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

# Scenario-specific voice assignments
SCENARIO_VOICES = {
    'doctor_office': {
        'receptionist': 'sarah',    # Warm, welcoming
        'doctor': 'david',          # Clear, professional
        'staff': 'emma'            # Clear, efficient
    },
    'restaurant': {
        'host': 'sarah',           # Warm, welcoming
        'server': 'emma'           # Clear, friendly
    },
    'pharmacy': {
        'pharmacist': 'david'      # Clear, professional
    },
    'bank': {
        'teller': 'emma',          # Clear, professional
        'officer': 'david',        # Authoritative
        'advisor': 'sarah',        # Warm, trustworthy
        'specialist': 'marcus'     # Deep, experienced
    }
}

# Comprehensive scenario scripts
ALL_SCENARIO_SCRIPTS = {
    # Doctor's Office Scripts
    'doctor_office_1_receptionist_greeting': "Good morning! How can I help you today?",
    'doctor_office_1_receptionist_checkin': "I'll need to see your insurance card and a photo ID, please.",
    'doctor_office_1_receptionist_direction': "Perfect! Please head to the second room on your left. The nurse will be with you shortly.",
    'doctor_office_2_doctor_symptoms': "How long have you been experiencing these symptoms?",
    'doctor_office_2_doctor_exam': "I'm going to listen to your lungs now. Please lie down on the examination table and take slow, deep breaths.",
    'doctor_office_2_doctor_diagnosis': "Your blood pressure is slightly elevated today. This could be related to stress or dietary factors. Let's monitor this closely.",
    'doctor_office_3_doctor_prescription': "I'm prescribing an antibiotic for you. Take two tablets twice daily with food for the full seven days, even if you start feeling better.",
    'doctor_office_3_doctor_followup': "I'd like to see you again in two weeks if these symptoms persist. If they get worse before then, don't hesitate to call.",
    'doctor_office_3_staff_billing': "Your insurance covers most of today's visit. Your copay is twenty-five dollars, which you can pay at the front desk.",
    
    # Restaurant Scripts
    'restaurant_1_host_greeting': "Welcome! How many people are in your party?",
    'restaurant_1_host_seating': "Right this way, by the window. Here's your table.",
    'restaurant_1_server_greeting': "Good evening! Can I start you with something to drink?",
    'restaurant_2_server_specials': "Tonight's special is pan-seared salmon with roasted vegetables and a lemon herb sauce.",
    'restaurant_2_server_order': "How would you like your steak cooked tonight?",
    'restaurant_2_server_timing': "Your food should be ready in about twenty minutes.",
    'restaurant_3_server_allergy': "Do you have any food allergies I should know about?",
    'restaurant_3_server_payment': "We accept cash, credit cards, or mobile pay for your convenience.",
    'restaurant_3_server_feedback': "How was everything this evening?",
    
    # Pharmacy Scripts  
    'pharmacy_1_pharmacist_greeting': "Good afternoon! How can I help you today?",
    'pharmacy_1_pharmacist_pickup': "I'll need your name and date of birth, please.",
    'pharmacy_1_pharmacist_insurance': "There's a small copay of five dollars for this prescription.",
    'pharmacy_2_pharmacist_instructions': "Take one tablet twice daily with meals, and finish the entire course.",
    'pharmacy_2_pharmacist_warnings': "Avoid alcohol while taking this medicine, as it may increase drowsiness.",
    'pharmacy_2_pharmacist_refills': "This is your last refill available. You'll need a new prescription from your doctor.",
    'pharmacy_3_pharmacist_consultation': "Are you currently taking any other medications?",
    'pharmacy_3_pharmacist_interaction': "This may interact with your blood pressure medication. Let me check with the pharmacist.",
    'pharmacy_3_pharmacist_followup': "Call us if you experience any unusual symptoms.",
    
    # Bank Scripts
    'bank_1_teller_greeting': "Good morning! How can I assist you today?",
    'bank_1_teller_id': "I'll need to see a photo ID, please.",
    'bank_1_teller_transaction': "What type of transaction would you like to make?",
    'bank_2_teller_balance': "Your checking account balance is two thousand forty-seven dollars and thirty-six cents.",
    'bank_2_teller_deposit': "Is this going into checking or savings?",
    'bank_2_teller_fees': "Your account has no monthly maintenance fee.",
    'bank_3_officer_loan': "The approval process usually takes about two weeks.",
    'bank_3_advisor_investment': "The annual percentage yield is currently two-point-one percent.",
    'bank_3_specialist_mortgage': "Current mortgage rates start at three-point-eight percent for qualified borrowers."
}

def get_speaker_from_script_id(script_id):
    """Determine speaker role from script ID"""
    if 'receptionist' in script_id:
        return 'receptionist'
    elif 'doctor' in script_id:
        return 'doctor'
    elif 'staff' in script_id:
        return 'staff'
    elif 'host' in script_id:
        return 'host'
    elif 'server' in script_id:
        return 'server'
    elif 'pharmacist' in script_id:
        return 'pharmacist'
    elif 'teller' in script_id:
        return 'teller'
    elif 'officer' in script_id:
        return 'officer'
    elif 'advisor' in script_id:
        return 'advisor'
    elif 'specialist' in script_id:
        return 'specialist'
    else:
        return 'default'

def get_scenario_from_script_id(script_id):
    """Determine scenario type from script ID"""
    if script_id.startswith('doctor_office'):
        return 'doctor_office'
    elif script_id.startswith('restaurant'):
        return 'restaurant'
    elif script_id.startswith('pharmacy'):
        return 'pharmacy'
    elif script_id.startswith('bank'):
        return 'bank'
    else:
        return 'unknown'

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
                    stability=0.6,        # Higher for professional clarity
                    similarity_boost=0.8, # High similarity for consistency
                    style=0.2,           # Lower style for neutral professional tone
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
    """Generate all scenario audio files"""
    print("🏢 COMPREHENSIVE SCENARIO AUDIO GENERATION")
    print("=" * 60)
    
    scenarios = ['doctor_office', 'restaurant', 'pharmacy', 'bank']
    print(f"\n📋 Generating audio for {len(scenarios)} scenarios:")
    for scenario in scenarios:
        script_count = len([s for s in ALL_SCENARIO_SCRIPTS.keys() if s.startswith(scenario)])
        print(f"  🎯 {scenario.replace('_', ' ').title()}: {script_count} interactions")
    
    print(f"\n🎤 Total audio files to generate: {len(ALL_SCENARIO_SCRIPTS) * len(VOICES)}")
    
    # Create output directories
    for scenario in scenarios:
        os.makedirs(f"{scenario}_audio", exist_ok=True)
    
    generated_files = []
    
    for script_id, text in ALL_SCENARIO_SCRIPTS.items():
        scenario = get_scenario_from_script_id(script_id)
        speaker = get_speaker_from_script_id(script_id)
        
        # Get appropriate voice for this speaker in this scenario
        scenario_voices = SCENARIO_VOICES.get(scenario, {})
        default_voice = scenario_voices.get(speaker, 'david')
        
        # Generate for all voices (for user preference)
        for voice_key, voice_id in VOICES.items():
            filename = f"{scenario}_audio/{script_id}_{voice_key}.mp3"
            generate_audio_file(text, voice_id, filename)
            
            generated_files.append({
                'script_id': script_id,
                'scenario': scenario,
                'speaker': speaker,
                'voice': voice_key,
                'is_default': voice_key == default_voice,
                'text': text,
                'filename': filename
            })
    
    # Generate comprehensive report
    print(f"\n📊 GENERATION COMPLETE")
    print("=" * 60)
    print(f"✅ Generated: {len(generated_files)} audio files")
    print(f"📁 Scenarios: {', '.join(scenarios)}")
    print(f"🎤 Voices: {', '.join(VOICES.keys())}")
    
    # Save generation log
    with open('all_scenarios_generation_log.json', 'w') as f:
        json.dump({
            'scenarios': scenarios,
            'total_files': len(generated_files),
            'voices_used': list(VOICES.keys()),
            'scenario_voice_assignments': SCENARIO_VOICES,
            'files': generated_files
        }, f, indent=2)
    
    print("\n🎯 FUNCTIONAL LISTENING FOCUS AREAS:")
    print("🏥 Doctor's Office:")
    print("  - Medical reception and check-in")
    print("  - Doctor-patient consultation")
    print("  - Prescription and treatment instructions")
    
    print("🍽️ Restaurant:")
    print("  - Greeting and seating")
    print("  - Menu and ordering interactions")
    print("  - Payment and service feedback")
    
    print("💊 Pharmacy:")
    print("  - Prescription pickup verification")
    print("  - Medication instructions and warnings")
    print("  - Drug consultation and safety")
    
    print("🏦 Bank:")
    print("  - Basic teller transactions")
    print("  - Account services and fees")
    print("  - Loan and investment consultations")
    
    print("\n🔬 CLINICAL BENEFITS:")
    print("- Real-world communication scenarios")
    print("- Progressive difficulty levels (1-3)")
    print("- Professional vocabulary development")
    print("- Confidence building for daily activities")
    print("- Practical auditory rehabilitation training")

if __name__ == "__main__":
    main()