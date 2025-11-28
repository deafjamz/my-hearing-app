# 🎵 SoundSteps: Project Context & Guidelines

## 🎯 Project Mission
**SoundSteps** is a clinically-validated hearing rehabilitation app designed for **Cochlear Implant (CI) users**. It gamifies auditory training to reduce listening strain and improve speech recognition through progressive difficulty.

## 🛠 Tech Stack
- **Frontend:** Vanilla HTML5, JavaScript (ES6+), Tailwind CSS (via CDN).
- **Backend/Tools:** Python 3 scripts for audio generation, analysis, and logging.
- **Audio Engine:** ElevenLabs API (using specific clinically-validated voice profiles).
- **Data/QC:** Google Sheets API for content management and audio quality flagging.
- **Hosting:** Netlify (soundsteps.app) / GitHub Pages.

## 🧠 Core Systems

### 1. Gamification Engine (`js/gamification.js`)
Inspired by Apple Watch fitness rings.
- **Consistency Ring:** Tracks daily streak and practice time.
- **Clarity Ring:** Tracks accuracy percentage.
- **Challenge Ring:** Tracks difficulty level progression.
- **Sound Garden:** Visual reward system where consistency "waters" a virtual garden.
- **Badges:** 18 clinical achievement badges (Bronze/Silver/Gold tiers).

### 2. Story System
- **Adaptive Captioning:** 4 levels (25% -> 100% text visibility).
- **Content:** 10+ custom stories optimized for CI prosody (4+ word phrases).
- **Dual Voice:** Toggle between Male/Female narrators to train different frequency responses.

### 3. Quality Control (QC)
- **Admin Mode:** Activate by **triple-tapping** the "Choose a Category" title.
- **Flagging:** Allows real-time flagging of "muddy," "cut-off," or "robotic" audio.
- **Workflow:** Flags are exported to CSV/Google Sheets -> `enhanced_audio_generator.py` regenerates them.

## 🎚 Clinical Configuration (DO NOT CHANGE WITHOUT TESTING)
These Voice IDs were selected based on **Rainbow Passage spectral analysis** for CI suitability.

| Role | Name | Voice ID | CI Score | Notes |
|------|------|----------|----------|-------|
| **Female Primary** | Sarah | `EXAVITQu4vr4xnSDxMaL` | **9.2/10** | High spectral clarity, 145wpm |
| **Male Primary** | Bill | `TxGEqnHWrfWFTfGW9XjX` | **8.8/10** | Excellent pause distribution |
| *Banned* | *Old Male* | *`pNInz6obpg...`* | *4.5/10* | *Too fast (185wpm), muddy* |

## 🚀 Common Workflows

### Regenerate Broken Audio
If QC flags bad files, run the repair tool:
```bash
python run_audio_repair.py
# Then run the command it outputs (enhanced_audio_generator.py with flags)

