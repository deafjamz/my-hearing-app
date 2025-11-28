#!/bin/bash
cd "/Users/clyle/Desktop/my-hearing-app"
echo "Searching for audio URL construction patterns..."
echo "=============================="
echo "Line numbers with jsdelivr/hearing-rehab-audio:"
grep -n "jsdelivr.*hearing-rehab-audio\|deafjamz.*hearing-rehab-audio" index.html
echo ""
echo "Line numbers with slugify:"
grep -n "slugify" index.html
echo ""
echo "Line numbers with female_audio/male_audio:"
grep -n "female_audio\|male_audio" index.html
echo ""
echo "Line numbers with Audio Unavailable:"
grep -n "Audio.*Unavailable" index.html