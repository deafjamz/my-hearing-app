#!/usr/bin/env python3
"""
Coffee Shop Audio Generation - Production-Ready Version
Generates audio files in parallel with robust error handling and retry logic.
Optimized for cochlear implant rehabilitation use cases.
"""

import requests
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# --- CONFIGURATION ---
# Set from your Colab secrets or environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "YOUR_API_KEY")

# Adjust based on your ElevenLabs plan:
# Free: 2, Starter: 3, Creator: 5, Pro: 10, Scale: 15, Business: 15
MAX_CONCURRENCY = 2  # Conservative default for free tier

# Retry logic settings
RETRY_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 2

# --- DATA ---
# 4-voice configuration from clinical analysis (F0-optimized for CI users)
VOICE_MAPPING = {
    "david": "pNInz6obpgDQGcFmaJgB",   # Adam - 118.4 Hz - Warm & Friendly
    "marcus": "TxGEqnHWrfWFTfGW9XjX", # Josh - 144.4 Hz - Deep & Confident
    "sarah": "EXAVITQu4vr4xnSDxMaL",  # Bella - 171.6 Hz - Clear & Articulate
    "emma": "ErXwobaYiN019PkySvjV"    # Antoni - 186.9 Hz - Bright & Energetic
}

# Coffee Shop scenarios (clinical rehabilitation contexts)
SCENARIOS = [
    {"text": "What can I get for you?", "filename": "scenarios_coffee_basic_greeting.mp3"},
    {"text": "That'll be four dollars and fifty cents.", "filename": "scenarios_coffee_price_simple.mp3"},
    {"text": "So that's one large coffee for you.", "filename": "scenarios_coffee_confirmation_simple.mp3"},
    {"text": "What size would you like? We have small, medium, and large.", "filename": "scenarios_coffee_size_options.mp3"},
    {"text": "For milk, we have whole milk and oat milk available today.", "filename": "scenarios_coffee_milk_options.mp3"},
    {"text": "Would you like that for here or to go?", "filename": "scenarios_coffee_for_here_or_to_go.mp3"},
    {"text": "Alright, so that's a large iced coffee with oat milk and an extra shot.", "filename": "scenarios_coffee_complex_order.mp3"},
    {"text": "Your total comes to six dollars and forty-seven cents with tax.", "filename": "scenarios_coffee_total_with_tax.mp3"},
    {"text": "It'll be about five minutes for that because we're making a fresh batch right now.", "filename": "scenarios_coffee_wait_time_explanation.mp3"},
]

def generate_audio_file(text, voice_id, output_path, voice_name):
    """
    Generate a single audio file with retry logic and exponential backoff.
    Returns a tuple: (bool_success, message)
    """
    # Skip if file already exists (idempotency)
    if os.path.exists(output_path):
        return (True, f"⏭️  ({voice_name}) Skipped: {os.path.basename(output_path)} (already exists)")
    
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

    for attempt in range(RETRY_ATTEMPTS):
        try:
            response = requests.post(api_url, json=data, headers=headers, timeout=60)
            
            if response.status_code == 200:
                # Ensure directory exists
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                
                file_size_kb = len(response.content) // 1024
                return (True, f"✅  ({voice_name}) Generated: {os.path.basename(output_path)} ({file_size_kb}KB)")
            
            # Retry on specific server errors or rate limiting
            if response.status_code in [429, 500, 502, 503, 504]:
                wait_time = RETRY_DELAY_SECONDS * (2**attempt)
                if attempt < RETRY_ATTEMPTS - 1:
                    print(f"   - ({voice_name}) Status {response.status_code}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
            else:
                # Non-retryable error (e.g., 401 Unauthorized, 422 Validation Error)
                try:
                    error_details = response.json().get('detail', {}).get('message', response.text)
                except:
                    error_details = response.text
                return (False, f"❌  ({voice_name}) API Error {response.status_code}: {error_details}")

        except requests.exceptions.RequestException as e:
            wait_time = RETRY_DELAY_SECONDS * (2**attempt)
            if attempt < RETRY_ATTEMPTS - 1:
                print(f"   - ({voice_name}) Network error: {e}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                return (False, f"❌  ({voice_name}) Network failure after {RETRY_ATTEMPTS} attempts: {e}")
    
    return (False, f"❌  ({voice_name}) Failed after {RETRY_ATTEMPTS} attempts: {os.path.basename(output_path)}")

def generate_coffee_shop_audio():
    """Generate all Coffee Shop audio with 4 voices using parallel processing."""
    print("☕ COFFEE SHOP SCENARIO AUDIO GENERATION")
    print(f"🎯 Clinical 4-Voice System: David, Marcus, Sarah, Emma")
    print(f"⚡ Concurrency: {MAX_CONCURRENCY} | Retries: {RETRY_ATTEMPTS}")
    print("=" * 60)

    # Create base directories
    for voice_name in VOICE_MAPPING.keys():
        os.makedirs(f"{voice_name}_audio", exist_ok=True)

    # Build task list for all combinations
    tasks = []
    for scenario in SCENARIOS:
        for voice_name, voice_id in VOICE_MAPPING.items():
            output_path = os.path.join(f"{voice_name}_audio", scenario['filename'])
            tasks.append({
                "text": scenario['text'],
                "voice_id": voice_id,
                "output_path": output_path,
                "voice_name": voice_name,
                "scenario_text": scenario['text'][:40] + "..." if len(scenario['text']) > 40 else scenario['text']
            })

    total_tasks = len(tasks)
    success_count = 0
    skipped_count = 0
    failed_tasks = []

    print(f"📋 Processing {total_tasks} audio files ({len(SCENARIOS)} scenarios × {len(VOICE_MAPPING)} voices)")
    print("=" * 60)

    # Execute tasks in parallel
    with ThreadPoolExecutor(max_workers=MAX_CONCURRENCY) as executor:
        # Submit all tasks
        future_to_task = {
            executor.submit(
                generate_audio_file, 
                task["text"], 
                task["voice_id"], 
                task["output_path"], 
                task["voice_name"]
            ): task for task in tasks
        }

        # Process results as they complete
        for i, future in enumerate(as_completed(future_to_task)):
            task_info = future_to_task[future]
            try:
                success, message = future.result()
                print(f"[{i+1:2d}/{total_tasks}] {message}")
                
                if success:
                    if "Skipped" in message:
                        skipped_count += 1
                    else:
                        success_count += 1
                else:
                    failed_tasks.append({
                        'path': task_info['output_path'],
                        'scenario': task_info['scenario_text'],
                        'voice': task_info['voice_name']
                    })
                    
            except Exception as e:
                # Catch unexpected errors from the task function
                failed_tasks.append({
                    'path': task_info['output_path'],
                    'scenario': task_info['scenario_text'],
                    'voice': task_info['voice_name']
                })
                print(f"[{i+1:2d}/{total_tasks}] ❌ Unexpected error for {task_info['voice_name']}: {e}")

    # Final summary
    print("\n" + "=" * 60)
    print("🎉 COFFEE SHOP AUDIO GENERATION COMPLETE")
    print("=" * 60)
    print(f"📊 Results:")
    print(f"   • Generated: {success_count} files")
    print(f"   • Skipped:   {skipped_count} files (already existed)")
    print(f"   • Failed:    {len(failed_tasks)} files")
    print(f"   • Total:     {total_tasks} files")
    
    if failed_tasks:
        print(f"\n⚠️  Failed Files:")
        for task in failed_tasks:
            print(f"   • {task['voice']} - {task['scenario']}")
        print(f"\n💡 Tip: Re-run the script to retry failed files")
    else:
        print(f"\n✨ All files generated successfully!")
    
    print(f"\n📁 Audio files saved to:")
    for voice_name in VOICE_MAPPING.keys():
        print(f"   • {voice_name}_audio/")
    
    # Clinical impact summary
    print(f"\n🔬 Clinical Impact:")
    print(f"   • F0-optimized voices for cochlear implant users")
    print(f"   • Progressive training: 26Hz (male) + 15.3Hz (female) gaps")
    print(f"   • 9 functional coffee shop scenarios")
    print(f"   • Enables systematic voice discrimination training")

# Main execution
if __name__ == "__main__":
    if ELEVENLABS_API_KEY == "YOUR_API_KEY":
        print("❌ ELEVENLABS_API_KEY not configured!")
        print("Set it in line 15 or as an environment variable.")
        print("For Colab: Use userdata.get('ELEVENLABS_API_KEY')")
    else:
        generate_coffee_shop_audio()