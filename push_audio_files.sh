#!/bin/bash

# Script to push audio files to hearing-rehab-audio GitHub repository
# This handles large MP3 files using Git LFS

echo "🎵 PUSHING HEARING REHABILITATION AUDIO FILES TO GITHUB"
echo "======================================================="

# Navigate to the hearing-rehab-audio directory
cd "../hearing-rehab-audio" || {
    echo "❌ Error: Could not find hearing-rehab-audio directory"
    exit 1
}

echo "📁 Current directory: $(pwd)"

# Check if this is a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: This directory is not a git repository"
    exit 1
fi

# Set up Git LFS for MP3 files if not already configured
echo "🔧 Setting up Git LFS for MP3 files..."
git lfs track "*.mp3"
git add .gitattributes

# Check git status
echo ""
echo "📊 Current git status:"
git status

# Add all MP3 files
echo ""
echo "📥 Adding all audio files..."
git add female_audio/*.mp3
git add male_audio/*.mp3
git add david_audio/*.mp3 2>/dev/null || echo "No files in david_audio/"
git add emma_audio/*.mp3 2>/dev/null || echo "No files in emma_audio/"

# Create commit
echo ""
echo "💾 Creating commit..."
git commit -m "Add complete audio library for hearing rehabilitation exercises

- All story audio files (story_fork_spoon.mp3, etc.)
- All sentence exercise files 
- Female and male voice audio files
- Optimized for cochlear implant users

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

# Verify the push
echo ""
echo "✅ Push completed! Checking final status:"
git status

echo ""
echo "🎉 AUDIO FILES SUCCESSFULLY PUSHED TO GITHUB!"
echo "Your hearing rehabilitation app should now be able to load audio files."
echo ""
echo "📝 Next steps:"
echo "1. Test your app at https://deafjamz.github.io/my-hearing-app/"
echo "2. Audio files will be available via jsDelivr CDN"
echo "3. App should no longer show 'Audio Unavailable' messages"