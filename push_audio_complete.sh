#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "🎵 PUSHING HEARING REHABILITATION AUDIO FILES TO GITHUB"
echo "======================================================="

# --- Configuration ---
AUDIO_REPO_PATH="/Users/clyle/Desktop/hearing-rehab-audio"
REMOTE_NAME="origin"
BRANCH_NAME="main"

echo "📁 Target repository: ${AUDIO_REPO_PATH}"
echo "🔗 Remote: ${REMOTE_NAME}/${BRANCH_NAME}"
echo ""

# --- Step 1: Verification ---
echo "STEP 1: Verifying Git repository status..."
cd "${AUDIO_REPO_PATH}"
pwd
echo ""
echo "Git status:"
git status
echo ""
echo "Remote repositories:"
git remote -v
echo ""

# --- Step 2: Git LFS Setup ---
echo "STEP 2: Setting up Git LFS for large MP3 files..."
echo "Initializing Git LFS..."
git lfs install

echo "Tracking *.mp3 files with LFS..."
git lfs track "*.mp3"

echo "LFS tracking status:"
git lfs track
echo ""

# --- Step 3: Stage Files ---
echo "STEP 3: Staging files for commit..."
echo "Adding .gitattributes file..."
git add .gitattributes

echo "Adding all audio files (this may take a moment)..."
git add female_audio/
git add male_audio/
git add david_audio/
git add emma_audio/

echo ""
echo "Current git status after staging:"
git status
echo ""

# --- Step 4: Commit ---
echo "STEP 4: Creating commit..."
git commit -m "Add complete audio library for hearing rehabilitation exercises

- All story audio files (story_fork_spoon.mp3, etc.)
- All sentence exercise files 
- Female and male voice audio files
- Optimized for cochlear implant users
- Using Git LFS for large MP3 files"

echo "✅ Commit created successfully!"
echo ""

# --- Step 5: Push to GitHub ---
echo "STEP 5: Pushing to GitHub..."
echo "⚠️  This will upload ~1000 audio files and may take several minutes..."
echo "Pushing commit and LFS objects..."

git push "${REMOTE_NAME}" "${BRANCH_NAME}"

echo ""
echo "🎉 SUCCESS! Audio files have been pushed to GitHub!"
echo ""

# --- Step 6: Verification ---
echo "STEP 6: Final verification..."
echo "Git status:"
git status

echo ""
echo "LFS files:"
git lfs ls-files | head -10
echo "... and more"

echo ""
echo "📋 NEXT STEPS:"
echo "1. Check GitHub repository: https://github.com/deafjamz/hearing-rehab-audio"
echo "2. Test sample file: https://cdn.jsdelivr.net/gh/deafjamz/hearing-rehab-audio@main/female_audio/story_fork_spoon.mp3"
echo "3. Test your app: https://deafjamz.github.io/my-hearing-app/"
echo ""
echo "✅ Your hearing rehabilitation app should now load audio successfully!"