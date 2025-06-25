#!/usr/bin/env python3
"""
GitHub Upload Script for Coffee Shop Audio Files
Run this in your Colab after generating the audio files
"""

import requests
import base64
import os
import json
import time

# GitHub Configuration - Set these values
GITHUB_TOKEN = "your_github_token_here"  # Replace with your GitHub token
GITHUB_USERNAME = "deafjamz"
GITHUB_REPO = "hearing-rehab-audio"

def upload_file_to_github(local_path, github_path, commit_message):
    """Upload a single file to GitHub repository"""
    
    # Read file content and encode
    with open(local_path, 'rb') as f:
        content = base64.b64encode(f.read()).decode('utf-8')
    
    # GitHub API URL
    api_url = f"https://api.github.com/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/{github_path}"
    headers = {"Authorization": f"token {GITHUB_TOKEN}"}
    
    # Check if file already exists (to get SHA for updates)
    existing_response = requests.get(api_url, headers=headers)
    sha = None
    if existing_response.status_code == 200:
        sha = existing_response.json().get('sha')
        print(f"    📝 File exists, updating...")
    
    # Prepare upload data
    upload_data = {
        "message": commit_message,
        "content": content
    }
    if sha:
        upload_data["sha"] = sha
    
    # Upload to GitHub
    response = requests.put(api_url, headers=headers, json=upload_data)
    
    if response.status_code in [200, 201]:
        status = "UPDATED" if sha else "CREATED"
        file_size = len(content) * 3 // 4 // 1024  # Approximate KB from base64
        return True, f"{status} - {file_size}KB"
    else:
        error_msg = response.json().get('message', 'Unknown error')
        return False, f"ERROR {response.status_code}: {error_msg}"

def upload_coffee_shop_audio():
    """Upload all Coffee Shop scenario audio files to GitHub"""
    
    print("☕ UPLOADING COFFEE SHOP AUDIO TO GITHUB")
    print("=" * 60)
    print(f"📡 Repository: {GITHUB_USERNAME}/{GITHUB_REPO}")
    print("=" * 60)
    
    # Voice folders to process
    voice_folders = ["david_audio", "marcus_audio", "sarah_audio", "emma_audio"]
    
    total_files = 0
    successful_uploads = 0
    failed_uploads = []
    
    # Process each voice folder
    for folder in voice_folders:
        print(f"\n📁 Processing {folder}/")
        
        if not os.path.exists(folder):
            print(f"   ⚠️  Folder not found, skipping...")
            continue
        
        # Get all MP3 files in the folder
        audio_files = [f for f in os.listdir(folder) if f.endswith('.mp3')]
        
        if not audio_files:
            print(f"   ⚠️  No MP3 files found in {folder}/")
            continue
        
        print(f"   📊 Found {len(audio_files)} audio files")
        
        # Upload each audio file
        for filename in sorted(audio_files):
            total_files += 1
            local_path = os.path.join(folder, filename)
            github_path = f"{folder}/{filename}"
            commit_message = f"Add Coffee Shop audio: {filename} ({folder})"
            
            print(f"   🎵 {filename}: ", end="")
            
            try:
                success, message = upload_file_to_github(local_path, github_path, commit_message)
                
                if success:
                    print(f"✅ {message}")
                    successful_uploads += 1
                else:
                    print(f"❌ {message}")
                    failed_uploads.append(f"{folder}/{filename}")
                
            except Exception as e:
                print(f"❌ EXCEPTION: {e}")
                failed_uploads.append(f"{folder}/{filename}")
            
            # Rate limiting - be nice to GitHub API
            time.sleep(1.5)
    
    # Final summary
    print("\n" + "=" * 60)
    print("🎉 GITHUB UPLOAD COMPLETE")
    print("=" * 60)
    print(f"📊 Results:")
    print(f"   • Total files processed: {total_files}")
    print(f"   • Successful uploads:   {successful_uploads}")
    print(f"   • Failed uploads:       {len(failed_uploads)}")
    
    if failed_uploads:
        print(f"\n❌ Failed Files:")
        for failed_file in failed_uploads:
            print(f"   • {failed_file}")
        print(f"\n💡 Tip: Check your GitHub token permissions and try again")
    else:
        print(f"\n✨ All Coffee Shop audio files uploaded successfully!")
    
    print(f"\n📁 View files at: https://github.com/{GITHUB_USERNAME}/{GITHUB_REPO}")
    
    # Clinical summary
    print(f"\n🔬 Clinical Impact:")
    print(f"   • 4-voice system with F0-optimized parameters")
    print(f"   • 9 functional Coffee Shop scenarios per voice")
    print(f"   • Enables progressive voice discrimination training")
    print(f"   • Ready for cochlear implant rehabilitation testing")

# Validation check
def validate_setup():
    """Check if GitHub token is configured"""
    if GITHUB_TOKEN == "your_github_token_here" or not GITHUB_TOKEN:
        print("❌ ERROR: GitHub token not configured!")
        print("\n🔧 Setup Instructions:")
        print("1. Go to GitHub → Settings → Developer settings → Personal access tokens")
        print("2. Generate a new token with 'repo' permissions")
        print("3. Replace 'your_github_token_here' with your actual token")
        print("4. Re-run this script")
        return False
    
    print("✅ GitHub token configured")
    return True

# Main execution
if __name__ == "__main__":
    if validate_setup():
        upload_coffee_shop_audio()
    else:
        print("\n⚠️  Please configure your GitHub token first")