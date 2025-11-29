import os
import subprocess
import requests
from dotenv import load_dotenv

load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

def generate_test_audio():
    print("1️⃣ Generating raw test audio...")
    url = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": "Testing.", # Period for stability
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        with open("debug_input.mp3", "wb") as f:
            f.write(response.content)
        print("   ✅ Generated 'debug_input.mp3'")
        return True
    else:
        print(f"   ❌ Failed to generate audio: {response.text}")
        return False

def test_ffmpeg_trim():
    print("\n2️⃣ Testing FFmpeg Trim...")
    input_file = "debug_input.mp3"
    output_file = "debug_output.mp3"
    
    if os.path.exists(output_file): os.remove(output_file)

    # The command we are using in the main script
    # silenceremove=start_periods=1:start_threshold=-30dB:start_duration=0.1:detection=peak,silenceremove=end_periods=1:end_threshold=-30dB:end_duration=0.1:detection=peak
    
    # Simplified command first to test basic functionality
    command = [
        "ffmpeg",
        "-y",
        "-i", input_file,
        "-af", "silenceremove=start_periods=1:start_threshold=-50dB:start_duration=0.05:detection=peak,silenceremove=end_periods=1:end_threshold=-50dB:end_duration=0.05:detection=peak",
        output_file
    ]
    
    print(f"   🏃 Running: {" ".join(command)}")
    
    try:
        # Capture BOTH stdout and stderr
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print("   ✅ FFmpeg Success!")
        print(f"   📄 Output size: {os.path.getsize(output_file)} bytes")
        
        # Analyze input vs output duration
        dur_cmd_in = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", input_file]
        dur_in = subprocess.check_output(dur_cmd_in).decode().strip()
        
        dur_cmd_out = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", output_file]
        dur_out = subprocess.check_output(dur_cmd_out).decode().strip()
        
        print(f"   ⏱️ Duration Change: {dur_in}s -> {dur_out}s")
        
    except subprocess.CalledProcessError as e:
        print(f"   ❌ FFmpeg Failed with return code {e.returncode}")
        print("   🔴 STDERR Output:")
        print(e.stderr)

if __name__ == "__main__":
    if generate_test_audio():
        test_ffmpeg_trim()
