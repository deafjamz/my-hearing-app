import os
import re

# parse wordPairs.ts to extract 'file' properties
# The file format is basically JS objects.
# We can use regex to find "file": "value"

word_pairs_path = 'src/data/wordPairs.ts'
audio_base_path = 'public/hearing-rehab-audio'
voices = ['female_audio', 'male_audio']

try:
    with open(word_pairs_path, 'r') as f:
        content = f.read()
except FileNotFoundError:
    print(f"Error: {word_pairs_path} not found.")
    exit(1)

# Regex to find file:"name" or "file": "name"
# The file has: "file": "pea",
pattern = r'"file":\s*"([^"]+)"'
matches = re.findall(pattern, content)

print(f"Found {len(matches)} file references in wordPairs.ts")

missing = {voice: [] for voice in voices}
found_count = {voice: 0 for voice in voices}

for voice in voices:
    voice_path = os.path.join(audio_base_path, voice)
    if not os.path.exists(voice_path):
        print(f"Warning: Directory {voice_path} does not exist.")
        continue
        
    existing_files = set(os.listdir(voice_path))
    
    for filename_base in matches:
        filename = f"{filename_base}.mp3"
        if filename not in existing_files:
            missing[voice].append(filename)
        else:
            found_count[voice] += 1

print("\nAudit Results:")
for voice in voices:
    print(f"Voice: {voice}")
    print(f"  Found: {found_count[voice]}")
    print(f"  Missing: {len(missing[voice])}")
    if len(missing[voice]) > 0:
        print(f"  Sample missing: {missing[voice][:5]}")

if all(len(m) == 0 for m in missing.values()):
    print("\n✅ All audio files are present!")
else:
    print("\n❌ Missing audio files detected.")
