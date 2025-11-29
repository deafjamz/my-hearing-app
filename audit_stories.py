import os
import re

# parse stories.ts to extract 'audioId' properties
stories_path = 'src/data/stories.ts'
audio_base_path = 'public/hearing-rehab-audio'
voices = ['female_audio', 'male_audio']

try:
    with open(stories_path, 'r') as f:
        content = f.read()
except FileNotFoundError:
    print(f"Error: {stories_path} not found.")
    exit(1)

# Regex to find audioId:"name" or "audioId": "name"
pattern = r'"audioId":\s*"([^"]+)"'
matches = re.findall(pattern, content)

print(f"Found {len(matches)} audio references in stories.ts")

missing = {voice: [] for voice in voices}

for voice in voices:
    voice_path = os.path.join(audio_base_path, voice)
    if not os.path.exists(voice_path):
        continue
        
    existing_files = set(os.listdir(voice_path))
    
    for filename_base in matches:
        filename = f"{filename_base}.mp3"
        if filename not in existing_files:
            missing[voice].append(filename)

print("\nStory Audio Audit Results:")
for voice in voices:
    print(f"Voice: {voice}")
    print(f"  Missing: {len(missing[voice])}")
    if len(missing[voice]) > 0:
        print(f"  Sample missing: {missing[voice][:5]}")
