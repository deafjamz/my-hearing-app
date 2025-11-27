# Changelog

## [Unreleased] - 2025-11-27 (Migration to React)

### 🏗️ Architecture
- **Migrated to React:** Replaced vanilla HTML/JS with a scalable React + Vite + TypeScript setup.
- **Restructured Directories:** Moved legacy code to `legacy/` folder. Created standard `src/` and `public/` structure.
- **Dependencies:** Added `react-router-dom`, `tailwindcss`, `lucide-react`.

### ✨ New Features
- **Audio Player:** Robust component with loading states, error handling, and seek functionality.
- **SNR Mixer:** "Pro" feature allowing users to mix voice tracks with background noise (Cafe, Street) for difficulty adjustment.
- **Rapid Fire:** New activity type for "Minimal Pair" discrimination training (P/B, T/D, etc.).
- **Global Voice Settings:** Users can switch between 4 clinical voices (David, Marcus, Sarah, Emma) and the app dynamically updates audio sources.
- **Quiz Interface:** Interactive multiple-choice questions with immediate feedback.

### 🐛 Fixes
- **Audio Paths:** Fixed broken CDN links by serving audio locally from `public/hearing-rehab-audio`.
- **Missing Assets:** Recovered 36 "Coffee Shop" scenario audio files from GitHub that were missing locally.
- **Directory Hell:** Fixed nested `noise_files/noise_files/...` structure.

### 🔧 Developer Tooling
- **Data Layer:** Created `src/data/stories.ts`, `scenarios.ts`, and `minimalPairs.ts` to manage content type-safely.
- **Asset Generation:** Added `generate_minimal_pairs.py` to programmatically generate new phoneme training assets via ElevenLabs API.
- **Path Resolver:** Created `src/lib/audioUtils.ts` to handle legacy path mapping between different voice folders.

### ⚠️ Known Issues / Pending
- **Minimal Pair Audio:** The audio files for "Rapid Fire" (e.g., `pear.mp3`) are placeholders or missing. Run `generate_minimal_pairs.py` once ElevenLabs credits are restored.
- **Story Voices:** Only 'Sarah' (female) and generic 'Male' have full story audio. 'David', 'Marcus', 'Emma' will fallback to these default folders for stories (but work fully for Scenarios).
