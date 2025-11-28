#!/bin/bash

# Robust Git Push Script for Audio Files
# This script runs everything in a single shell session to avoid state issues

set -e  # Exit on any error

echo "🎵 ROBUST AUDIO FILES PUSH TO GITHUB"
echo "===================================="

# Define paths
AUDIO_REPO="/Users/clyle/Desktop/hearing-rehab-audio"
CURRENT_DIR="/Users/clyle/Desktop/my-hearing-app"

# Function to run git commands with error handling
run_git_command() {
    local cmd="$1"
    local description="$2"
    
    echo "→ $description"
    if ! eval "$cmd"; then
        echo "❌ Failed: $description"
        echo "Command: $cmd"
        exit 1
    fi
    echo "✅ Success: $description"
    echo ""
}

# Main execution
main() {
    echo "Starting in: $(pwd)"
    echo "Target repo: $AUDIO_REPO"
    echo ""
    
    # Change to audio repository
    echo "→ Changing to audio repository..."
    cd "$AUDIO_REPO" || {
        echo "❌ Cannot access $AUDIO_REPO"
        exit 1
    }
    echo "✅ Now in: $(pwd)"
    echo ""
    
    # Check if it's a git repository
    if [ ! -d ".git" ]; then
        echo "❌ Not a git repository: $AUDIO_REPO"
        exit 1
    fi
    
    # Git operations
    run_git_command "git status" "Checking repository status"
    run_git_command "git lfs install" "Initializing Git LFS"
    run_git_command "git lfs track '*.mp3'" "Tracking MP3 files with LFS"
    run_git_command "git add .gitattributes" "Adding LFS configuration"
    run_git_command "git add ." "Adding all files"
    
    # Create commit
    echo "→ Creating commit..."
    git commit -m "Add complete audio library for hearing rehabilitation exercises

- All story audio files (story_fork_spoon.mp3, etc.)
- All sentence exercise files 
- Female and male voice audio files
- Optimized for cochlear implant users
- Using Git LFS for large MP3 files" || {
        echo "❌ Commit failed (files may already be committed)"
        echo "Checking status..."
        git status
    }
    echo ""
    
    # Push to GitHub
    echo "→ Pushing to GitHub (this may take several minutes)..."
    if git push origin main; then
        echo "✅ Successfully pushed to GitHub!"
    else
        echo "❌ Push failed. Trying to push LFS objects separately..."
        git lfs push origin main
        git push origin main
    fi
    
    echo ""
    echo "🎉 COMPLETED SUCCESSFULLY!"
    echo ""
    echo "Next steps:"
    echo "1. Check: https://github.com/deafjamz/hearing-rehab-audio"
    echo "2. Test: https://cdn.jsdelivr.net/gh/deafjamz/hearing-rehab-audio@main/female_audio/story_fork_spoon.mp3"
    echo "3. Your app should now load audio files!"
}

# Run main function
main "$@"