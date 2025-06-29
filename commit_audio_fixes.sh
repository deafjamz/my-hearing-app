#!/bin/bash
cd /Users/clyle/Desktop/my-hearing-app

git add .
git commit -m "Fix CI Rings display and improve audio error handling

- Fix CI Rings labels: Use correct element IDs (consistency-goal, clarity-goal, challenge-goal)
- Improve audio error messages: More user-friendly fallback text when audio unavailable
- Add graceful degradation: App remains functional even when audio files missing
- Better UX: Clear indication when audio is unavailable vs loading errors

Fixes JavaScript errors preventing proper app initialization and functionality."

git push origin main

echo "✅ Audio fixes committed and pushed!"
echo "🌐 Your app will be updated at: https://deafjamz.github.io/my-hearing-app/"
echo "⏱️  GitHub Pages will rebuild in 2-5 minutes"