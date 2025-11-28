# 🎵 SoundSteps: Digital Hearing Rehabilitation Platform

> **⚠️ AI AGENT INSTRUCTIONS:** Before writing code, you MUST read `docs/CONTRIBUTING.md`.

## 📐 Development Standards
This project follows strict development and design standards to ensure consistency and prevent regressions.

### Required Reading
- 📘 [Style Guide](docs/STYLE_GUIDE.md) - UI/UX standards and component patterns
- 🛠️ [Contributing Guide](docs/CONTRIBUTING.md) - Engineering protocols and safety standards

---

**SoundSteps** is a scientifically-backed, gamified auditory training application designed for **Cochlear Implant (CI) recipients** and individuals with hearing loss. It focuses on the hierarchy of auditory skills: Detection, Discrimination, Identification, and Comprehension.

## 🚀 Project Status: React Migration (Phase 5 Complete)

We have successfully migrated the prototype from legacy vanilla JS to a modern **React + TypeScript + Vite** architecture.

### Key Features
*   **🎧 Robust Audio Engine:** Custom `useAudio` hook with loading states, error handling, and progress tracking.
*   **🎚️ SNR Mixer (Speech-in-Noise):** "Pro" feature allowing users to adjust the balance between voice and background noise (e.g., Cafe, Traffic) to train listening in difficult environments.
*   **🗣️ 4-Voice System:** Switch globally between David, Marcus (Male) and Sarah, Emma (Female) to train pitch perception.
*   **⚡ Rapid Fire (Minimal Pairs):** High-repetition discrimination training (e.g., "Pear" vs. "Bear") using **ElevenLabs Turbo v2.5**.
*   **📖 Interactive Stories:** Narrative comprehension with adaptive audio.

## 🛠️ Tech Stack

*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS (v3), Lucide React (Icons)
*   **State Management:** React Context (`VoiceContext`)
*   **Routing:** React Router v6
*   **Audio:** Native HTML5 Audio API with custom hooks
*   **Assets:** ElevenLabs generated audio (stored in `public/hearing-rehab-audio`)

## 📂 Project Structure

```
my-hearing-app/
├── src/
│   ├── components/     # Reusable UI (AudioPlayer, QuizCard, SNRMixer)
│   ├── hooks/          # Logic (useAudio, useAudioMixer)
│   ├── pages/          # Screens (Dashboard, Player, RapidFire, AudioQA)
│   ├── data/           # Static content (stories.ts, scenarios.ts, minimalPairs.ts)
│   ├── store/          # Global state (VoiceContext)
│   └── types/          # TypeScript interfaces
├── public/
│   ├── hearing-rehab-audio/  # Voice assets (David, Sarah, etc.)
│   ├── noise_files/          # Background noise tracks
│   └── audio_quality_test/   # QA samples
├── legacy/             # Old vanilla JS prototype (Archived)
└── generate_minimal_pairs.py # Script for generating new assets
```

## ⚡ Quick Start

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run Local Development Server:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

3.  **Generate Audio Assets (Optional):**
    If you need to generate new Minimal Pairs, ensure your `.env` has a valid `ELEVENLABS_API_KEY` and run:
    ```bash
    python3 generate_minimal_pairs.py
    ```

## 🗺️ Roadmap & Progress

| Phase | Objective | Status | Notes |
|-------|-----------|--------|-------|
| **1** | **Structural Pivot** | ✅ Done | Migrated to React/Vite. |
| **1.5**| **Navigation** | ✅ Done | Implemented Router & Layout. |
| **2** | **Audio Engine** | ✅ Done | Built `useAudio` & `SNRMixer`. |
| **3** | **Active Learning** | ✅ Done | Built `QuizCard` & Feedback loop. |
| **4** | **Data Layer** | ✅ Done | Migrated CSVs to TypeScript data modules. |
| **5** | **Personalization** | ✅ Done | Global Voice Settings implemented. |
| **6** | **Asset Pipeline** | ✅ Done | Script `generate_minimal_pairs.py` creates assets for all 4 voices using Turbo v2.5. |
| **7** | **Visual Polish** | 📅 Next | Add animations, improved typography, and "Audiogram" visualizations. |
| **8** | **Advanced Audio** | 🔮 Future | **ElevenLabs Features:**<br>• **Karaoke Mode:** Real-time word highlighting via *Forced Alignment API*.<br>• **Dynamic Ambience:** Generative backgrounds via *Sound Effects API*.<br>• **Voice Lab:** Custom voice design for pitch training ladders. |
| **9** | **Conversational AI** | 🔮 Future | **Agent Integration (Scribe v2):**<br>• **"The Barista Bot":** Live roleplay (ordering coffee).<br>• **"Telephone Mode":** Audio-only conversation practice. |

## 📚 ElevenLabs Reference Links
*   [Text to Speech Capabilities](https://elevenlabs.io/docs/capabilities/text-to-speech)
*   [Agents Platform Quickstart](https://elevenlabs.io/docs/agents-platform/quickstart)
*   [Sound Effects](https://elevenlabs.io/docs/capabilities/sound-effects)
*   [Forced Alignment (Karaoke)](https://elevenlabs.io/docs/capabilities/forced-alignment)

## 🤝 Contributing

*   **Audio Files:** Stored in `public/hearing-rehab-audio`. Do not rename folders without updating `src/lib/audioUtils.ts`.
*   **New Activities:** Add data to `src/data/` and create a route in `App.tsx`.


