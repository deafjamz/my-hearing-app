import os
import requests
import subprocess
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload(file_path, dest):
    with open(file_path, 'rb') as f:
        supabase.storage.from_("audio").upload(dest, f, file_options={"content-type": "audio/mpeg", "upsert": "true"})
    return f"{SUPABASE_URL}/storage/v1/object/public/audio/{dest}"

def generate(text):
    url = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL"
    headers = { "Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY }
    data = { "text": text, "model_id": "eleven_turbo_v2_5", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75} }
    response = requests.post(url, json=data, headers=headers)
    return response.content

def trim(input_path, output_path):
    # -50dB gentle trim
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", input_path, "-af", 
           "silencedetect=noise=-50dB:d=0.1,areverse,silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-50dB:detection=peak", 
           output_path]
    # Note: simplified command
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", input_path, "-af", "silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse", output_path], check=True)

def run_final_test():
    print("🧪 Testing Text Padding...")
    
    # 1. Padded Text
    print("   Generating '... bear ...'")
    raw = generate("... bear ...")
    with open("temp_pad.mp3", "wb") as f: f.write(raw)
    print(f"   Raw Upload: {upload('temp_pad.mp3', 'words/sarah/diag_text_pad.mp3')}")
    
    # 2. Trimmed
    print("   Trimming...")
    trim("temp_pad.mp3", "temp_pad_trim.mp3")
    print(f"   Trimmed Upload: {upload('temp_pad_trim.mp3', 'words/sarah/diag_text_pad_trim.mp3')}")

    # Cleanup
    if os.path.exists("temp_pad.mp3"): os.remove("temp_pad.mp3")
    if os.path.exists("temp_pad_trim.mp3"): os.remove("temp_pad_trim.mp3")

if __name__ == "__main__":
    run_final_test()
